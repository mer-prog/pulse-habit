import type { AppErrorType } from '@/types';
import type { SQLiteDatabase } from 'expo-sqlite';

export class AppError extends Error {
  type: AppErrorType;
  originalError?: unknown;

  constructor(type: AppErrorType, message: string, originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.originalError = originalError;
  }
}

export class SyncError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super('SYNC_ERROR', message, originalError);
    this.name = 'SyncError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super('DATABASE_ERROR', message, originalError);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super('NETWORK_ERROR', message, originalError);
    this.name = 'NetworkError';
  }
}

export async function withDatabaseTransaction<T>(
  db: SQLiteDatabase,
  operation: () => Promise<T>
): Promise<T> {
  try {
    await db.execAsync('BEGIN TRANSACTION');
    const result = await operation();
    await db.execAsync('COMMIT');
    return result;
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw new DatabaseError(
      'Transaction failed',
      error
    );
  }
}

export function withWorkletErrorHandler<T extends (...args: unknown[]) => unknown>(
  fn: T,
  fallback?: (...args: Parameters<T>) => ReturnType<T>
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('[Worklet Error]', error);
      if (fallback) {
        return fallback(...args);
      }
      return undefined as ReturnType<T>;
    }
  }) as T;
}
