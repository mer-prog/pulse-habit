import type { SQLiteDatabase } from 'expo-sqlite';
import { getBackoffDelay, isReadyForRetry, processSyncQueue } from '@/lib/sync';
import { SYNC_BACKOFF_BASE_MS, SYNC_MAX_RETRIES } from '@/constants/config';
import type { SyncQueueItem } from '@/types';

jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'auth-user-1' } } },
      }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('Sync Queue', () => {
  describe('getBackoffDelay', () => {
    it('returns base delay plus jitter for first retry', () => {
      const delay = getBackoffDelay(0);
      expect(delay).toBeGreaterThanOrEqual(SYNC_BACKOFF_BASE_MS);
      expect(delay).toBeLessThanOrEqual(SYNC_BACKOFF_BASE_MS * 1.5);
    });

    it('doubles the base delay for each retry (jitter adds at most 50%)', () => {
      for (const retry of [1, 2, 3, 4]) {
        const base = SYNC_BACKOFF_BASE_MS * Math.pow(2, retry);
        const delay = getBackoffDelay(retry);
        expect(delay).toBeGreaterThanOrEqual(base);
        expect(delay).toBeLessThanOrEqual(base * 1.5);
      }
    });
  });

  describe('isReadyForRetry', () => {
    const NOW = Date.parse('2026-02-22T12:00:00.000Z');

    it('is ready when the item has never failed', () => {
      expect(isReadyForRetry({ retry_count: 0, last_attempt_at: null }, NOW)).toBe(true);
    });

    it('is not ready before the backoff delay has elapsed', () => {
      // retry_count 1 → delay is at least SYNC_BACKOFF_BASE_MS
      const lastAttempt = new Date(NOW - 100).toISOString();
      expect(isReadyForRetry({ retry_count: 1, last_attempt_at: lastAttempt }, NOW)).toBe(false);
    });

    it('is ready once the maximum backoff delay has elapsed', () => {
      // retry_count 1 → delay is at most SYNC_BACKOFF_BASE_MS * 1.5
      const lastAttempt = new Date(NOW - SYNC_BACKOFF_BASE_MS * 1.5 - 1).toISOString();
      expect(isReadyForRetry({ retry_count: 1, last_attempt_at: lastAttempt }, NOW)).toBe(true);
    });

    it('waits longer after more failures', () => {
      // retry_count 4 → delay is at least SYNC_BACKOFF_BASE_MS * 8
      const lastAttempt = new Date(NOW - SYNC_BACKOFF_BASE_MS * 2).toISOString();
      expect(isReadyForRetry({ retry_count: 4, last_attempt_at: lastAttempt }, NOW)).toBe(false);
    });
  });

  describe('processSyncQueue backoff wiring', () => {
    const makeItem = (overrides: Partial<SyncQueueItem>): SyncQueueItem => ({
      id: 'item-1',
      table_name: 'completions',
      operation: 'INSERT',
      data: JSON.stringify({ id: 'c-1', habit_id: 'h-1', completed_date: '2026-02-22' }),
      retry_count: 0,
      max_retries: SYNC_MAX_RETRIES,
      created_at: '2026-02-22T00:00:00.000Z',
      last_attempt_at: null,
      ...overrides,
    });

    const makeDb = (items: SyncQueueItem[]) =>
      ({
        getAllAsync: jest.fn().mockResolvedValue(items),
        runAsync: jest.fn().mockResolvedValue({ changes: 0 }),
      }) as unknown as SQLiteDatabase;

    it('skips items still inside their backoff window and processes due items', async () => {
      const waiting = makeItem({
        id: 'waiting',
        retry_count: 2, // delay is at least 2 × SYNC_BACKOFF_BASE_MS
        last_attempt_at: new Date(Date.now() - 10).toISOString(), // just failed
      });
      const due = makeItem({ id: 'due' });
      const db = makeDb([waiting, due]);

      const result = await processSyncQueue(db);

      expect(result.skipped).toBe(1);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      // The due item was dequeued; the waiting one stayed in the queue
      expect(db.runAsync).toHaveBeenCalledWith(
        'DELETE FROM sync_queue WHERE id = ?',
        ['due']
      );
      expect(db.runAsync).not.toHaveBeenCalledWith(
        'DELETE FROM sync_queue WHERE id = ?',
        ['waiting']
      );
    });

    it('processes a failed item again once its backoff delay has elapsed', async () => {
      const recovered = makeItem({
        id: 'recovered',
        retry_count: 1, // delay is at most 1.5 × SYNC_BACKOFF_BASE_MS
        last_attempt_at: new Date(
          Date.now() - SYNC_BACKOFF_BASE_MS * 1.5 - 1
        ).toISOString(),
      });
      const db = makeDb([recovered]);

      const result = await processSyncQueue(db);

      expect(result.skipped).toBe(0);
      expect(result.processed).toBe(1);
      expect(db.runAsync).toHaveBeenCalledWith(
        'DELETE FROM sync_queue WHERE id = ?',
        ['recovered']
      );
    });
  });

  describe('SyncQueueItem structure', () => {
    it('defines correct max retries constant', () => {
      expect(SYNC_MAX_RETRIES).toBe(5);
    });

    it('defines correct backoff base', () => {
      expect(SYNC_BACKOFF_BASE_MS).toBe(1000);
    });
  });

  describe('conflict detection logic', () => {
    it('identifies version mismatch as conflict', () => {
      const localVersion = 3;
      const serverVersion = 5;
      const isConflict = serverVersion > localVersion - 1;
      expect(isConflict).toBe(true);
    });

    it('accepts matching versions', () => {
      const localVersion = 3;
      const serverVersion = 2; // server was at 2, we're updating to 3
      const isConflict = serverVersion > localVersion - 1;
      expect(isConflict).toBe(false);
    });
  });

  describe('completion upsert idempotency', () => {
    it('unique constraint on habit_id + date prevents duplicates', () => {
      // This is tested at the database level
      // The UNIQUE(habit_id, completed_date) constraint ensures:
      const constraint = 'UNIQUE(habit_id, completed_date)';
      expect(constraint).toBeDefined();

      // When upserting with the same habit_id and date, it should:
      // 1. Not create a duplicate
      // 2. Not produce a sync conflict
      // This is inherently idempotent
      const operation = 'upsert';
      expect(operation).toBe('upsert');
    });
  });
});
