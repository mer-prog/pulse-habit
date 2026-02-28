<p align="center">
  <img src="assets/icon.png" alt="PulseHabit" width="80" height="80" />
</p>

<h1 align="center">PulseHabit 習慣トラッカー</h1>
<p align="center"><strong>オフラインファースト習慣トラッカー — クラウド同期対応、ネットワーク不要でもデータ損失ゼロ</strong></p>

---

## 1. 実装スキル一覧

| スキル | 実装内容 |
|--------|----------|
| **オフラインファーストアーキテクチャ** | 全ての変更操作はまずローカルSQLiteに書き込み（応答10ms以下）、sync_queueテーブルを経由してSupabaseへ非同期同期。指数バックオフ（1秒×2^n＋ジッター）で自動リトライし、5回失敗で自動パージ。ネットワーク状態に関わらずデータ損失ゼロ。 |
| **認証＋行レベルセキュリティ（RLS）** | 全5テーブル（habits、completions、streaks、sync_queue、sync_conflicts）にPostgreSQLレベルのRLSポリシーを適用。`auth.uid() = user_id`による直接所有チェックと、completionsではhabitsテーブル経由の間接所有チェックを実装。APIキーが漏洩しても他ユーザーのデータにアクセス不可。 |
| **カスタムデザインシステム** | UIライブラリ不使用で10種のネオブルータリスト・コンポーネントを構築。太ボーダー（2〜3px）、オフセットシャドウ（3〜4px）、モノスペースタイポグラフィで統一。ライト/ダーク/システムのテーマ3モード対応。 |
| **同期コンフリクト解決** | ローカルSQLiteのuser_idとSupabase認証のUIDが乖離する本番バグを解決。同期パイプラインでuser_idを書き換え、RLSポリシーが正常に機能するよう修正。habitsテーブルではversionベースの楽観的ロックによるコンフリクト検出を実装。 |
| **セキュリティ設計** | `crypto.getRandomValues()`による暗号学的ID生成、パラメータ化クエリ（`?`バインド変数）によるSQLインジェクション防止、入力値バリデーション（名前100文字、説明500文字、メール254文字）、開発ログでのユーザーID切り詰め表示。 |
| **国際化（i18n）** | i18next＋react-i18next＋expo-localizationで日本語・英語切替を実装。初回起動時にデバイス言語を自動検出し、Zustandの`settingsStore`（AsyncStorage永続化）と双方向同期。アプリ再起動なしの即時切替対応。 |
| **ストリーク計算エンジン** | completionsテーブルから現在のストリーク・最長ストリーク・達成率をクライアントサイドで計算。タップ即座に更新し、SQLiteに保存後クラウドへ同期。日付の連続性チェック、昨日・今日の境界処理を実装。 |
| **触覚フィードバック** | expo-hapticsによる7種のフィードバック（Success、Warning、Error、Light、Medium、Heavy、Selection）を操作に応じて使い分け。習慣完了時はSuccess、削除時はWarning。 |
| **通知リマインダー** | expo-notificationsによる日次リマインダー通知。習慣ごとに設定可能な時刻指定（HH:MM形式）、通知タップで習慣詳細画面へ遷移。 |

---

## 2. 技術スタック

| 分類 | 技術 | バージョン | 選定理由 |
|------|------|-----------|----------|
| フレームワーク | React Native | 0.81.4 | iOS・Android両対応のクロスプラットフォーム開発 |
| プラットフォーム | Expo SDK | 54 | マネージドワークフロー、OTAアップデート、開発ビルド対応 |
| ルーティング | Expo Router | 6.0.23 | ファイルベースルーティング、型付きルート対応 |
| 言語 | TypeScript | 5.8.0 | strict有効、全ソースファイルに型安全性 |
| 状態管理 | Zustand | 5.0.11 | セレクタベースの再レンダリング、Providerラッパー不要 |
| ローカルDB | expo-sqlite | 16.0.10 | 同期読み取り、オフライン永続化、ACIDトランザクション |
| バックエンド | Supabase | 2.97.0 | 認証、PostgreSQL、行レベルセキュリティ |
| デザイン | カスタム（ネオブルータリスト） | - | 手作り10コンポーネント、ダークモード対応 |
| i18n | i18next + react-i18next | 25.8.13 / 16.5.4 | 翻訳キー名前空間、補間（`{{count}}`）、言語切替 |
| ローカライゼーション | expo-localization | 55.0.8 | デバイス言語検出 |
| アニメーション | react-native-reanimated | 4.1.1 | ネイティブスレッド上の高性能アニメーション |
| フォント | Space Grotesk + Space Mono | - | ディスプレイ＋モノスペースの組み合わせ |
| チャート | react-native-gifted-charts | 1.4.74 | 統計画面のバーチャート |
| SVG | react-native-svg | 15.12.1 | ストリークリング、ドットグリッド、ハッチパターン |

---

## 3. アーキテクチャ

```
┌──────────────────────────────────────────────────────────────┐
│                     React Native UI層                        │
│          ネオブルータリスト・デザインシステム（10種）           │
│          Expo Router v6 · useTheme() · useTranslation()     │
├──────────────────────────────────────────────────────────────┤
│                    Zustand 状態管理層                         │
│     authStore · habitStore · settingsStore · toastStore     │
│     AsyncStorage永続化（persist + createJSONStorage）        │
├──────────────────────────┬───────────────────────────────────┤
│   SQLite（ローカル）     │       同期キュー                  │
│   全ミューテーション     │   指数バックオフ: 1s×2^n          │
│   はここに書き込み       │   最大リトライ: 5回               │
│   応答: <10ms           │   超過時: 自動パージ              │
├──────────────────────────┴───────────────────────────────────┤
│                   Supabase（クラウド）                        │
│       Auth · PostgreSQL · RLSポリシー（全5テーブル）          │
└──────────────────────────────────────────────────────────────┘
```

**データフロー**: ユーザー操作 → Zustand → SQLite（即座） → sync_queue → Supabase（非同期）

```
習慣完了タップ
  → SQLite INSERT（即座、<10ms）
  → sync_queueテーブルにエンキュー
  → SyncManagerが認証セッション検出
  → キューアイテムを順次処理
  → user_idをSupabase auth UIDに書き換え
  → Supabase UPSERT（RLSバリデーション通過）
  → 成功時: デキュー
  → 失敗時: retry_countインクリメント、1s×2^nバックオフ
  → 5回失敗: 自動パージ
```

**アプリ起動フロー**:
```
RootLayout
  → フォント読み込み（Space Grotesk × 4 + Space Mono × 2）
  → スプラッシュ非表示
  → GestureHandlerRootView
    → SafeAreaProvider
      → SQLiteProvider（DB: pulsehabit.db, onInit: migrateDatabase）
        → AppContent
          ├ 認証初期化（Supabaseセッション確認）
          ├ LanguageSync（初回: デバイス言語検出、以降: 保存言語復元）
          ├ SyncManager（認証完了後にsync開始、3秒後にリトライ）
          ├ ToastContainer
          └ Stack
            ├ (tabs)  [認証済み]
            ├ (auth)  [未認証]
            ├ habit/[id] (card表示)
            └ habit/new  (modal表示)
```

---

## 4. 主要機能

### 4.1 オフラインファースト同期パイプライン

全ての操作（習慣作成・完了記録・削除・編集）はまずローカルSQLiteに書き込まれる。ネットワーク状態に関わらずUIは即座に反応し、同期はバックグラウンドで実行される。

**同期コンフリクト解決の実装**（`src/lib/sync.ts`）:
```typescript
// ローカルuser_idとSupabase auth UIDの乖離を検出し書き換え
if (session?.user?.id && data.user_id && data.user_id !== session.user.id) {
  data.user_id = session.user.id;
}
```

**habitsテーブルのバージョンベース・コンフリクト検出**:
- UPDATEの場合、リモートのversionとローカルのversionを比較
- リモートが新しい場合、`sync_conflicts`テーブルに両バージョンを記録
- INSERTで重複キーエラー（23505）の場合、UPSERTにフォールバック

**completionsテーブル**: `habit_id,completed_date`ペアでUPSERT。重複完了を防止。

**streaksテーブル**: `habit_id`でUPSERT。常に最新の計算結果で上書き。

**AppStateフォアグラウンド同期**: アプリがフォアグラウンドに戻るたびに自動同期を実行（`useSync`フック内のAppStateリスナー）。

### 4.2 行レベルセキュリティ（RLS）

```sql
-- 直接所有（habits、sync_queue）
CREATE POLICY "ユーザーは自分の習慣を閲覧可能" ON habits
  FOR SELECT USING (auth.uid() = user_id);

-- 間接所有（completionsは親habitsテーブル経由）
CREATE POLICY "ユーザーは自分の完了記録を閲覧可能" ON completions
  FOR SELECT USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );
```

### 4.3 ネオブルータリスト・デザインシステム

UIライブラリ（Material UI、NativeWind等）を使わず、10種のカスタムコンポーネントを構築:

| コンポーネント | ファイル | 行数 | 機能 |
|-------------|---------|------|------|
| `OffsetShadow` | `OffsetShadow.tsx` | 51 | オフセットシャドウラッパー。アニメーション付きpress状態対応 |
| `BrutalCard` | `BrutalCard.tsx` | 46 | コンテナ。2〜3pxボーダー＋3〜4pxオフセットシャドウ |
| `BrutalButton` | `BrutalButton.tsx` | 83 | ボタン。sm/md/lgサイズ、ローディング状態、触覚フィードバック |
| `BrutalInput` | `BrutalInput.tsx` | 81 | テキスト入力。フォーカスシャドウ色変更、エラー表示 |
| `BrutalCheckbox` | `BrutalCheckbox.tsx` | 70 | チェックボックス。SVGチェックマーク、スケールアニメーション |
| `BrutalTag` | `BrutalTag.tsx` | 51 | タグバッジ。filled/outlineバリアント、small対応 |
| `BrutalProgress` | `BrutalProgress.tsx` | 61 | プログレスバー。ハッチパターン背景、完全達成メッセージ |
| `StatBox` | `StatBox.tsx` | 53 | 数値統計表示。アクセントカラー、モノスペースラベル |
| `HatchPattern` | `HatchPattern.tsx` | 47 | SVG斜線パターン。45度、交互カラー |
| `BlackTag` | `BrutalTag.tsx` | - | 黒背景タグ（BrutalTag内に同梱） |

**テーマシステム**: `useTheme()`フックがZustandの`settingsStore.themeMode`とシステム設定`useColorScheme()`を合成。ライト/ダーク各11色のパレット。Context Providerを使わずセレクタベースで再レンダリングを最小化。

**ライトパレット**: bg=#FFFDF5（クリーム）、ink=#1A1A1A、card=#FFFFFF、border=#1A1A1A
**ダークパレット**: bg=#0D0D0D、ink=#E8E4DC、card=#1A1A1A、border=#555555

### 4.4 ストリーク計算エンジン

`src/lib/database.ts`の`calculateStreak()`関数で実装:

1. completionsから日付のSetを構築
2. 今日が含まれない場合、昨日からチェック開始（ストリーク維持判定）
3. 連続日数をカウントしてcurrent_streakを算出
4. 全日付をソートして最長連続日数（longest_streak）を算出
5. streaksテーブルにINSERT OR REPLACEで保存
6. sync_queueにエンキュー

### 4.5 国際化（i18n）

**対応言語**: 日本語（ja）、英語（en）
**翻訳キー数**: 各言語約100キー、12の名前空間（common、tabs、auth、today、habits、stats、profile、habit、categories、weekdays、weekdaysShort、months、date）

**言語同期フロー**:
```
初回起動
  → expo-localizationでデバイス言語を検出
  → 日本語ロケール → 'ja'、その他 → 'en'
  → settingsStore.languageに保存（AsyncStorage永続化）
  → i18n.changeLanguage()で適用

以降の起動
  → settingsStore.languageを読み込み
  → i18n.changeLanguage()で適用

手動切替
  → プロフィール画面のJP/ENセレクター
  → settingsStore.setLanguage()
  → i18n.changeLanguage()
  → アプリ再起動不要で即時反映
```

**ロケール依存フォーマット**: カレンダーの曜日名（`weekdaysShort.mon`）、月名（`months.0`〜`months.11`）、日付フォーマット（`date.monthYear`）が選択言語に連動。

### 4.6 習慣作成ウィザード（3ステップ）

**ステップ1（詳細）**: 名前（必須、最大100文字）、説明（任意、最大500文字）、アイコン選択（20種の絵文字）、カラー選択（10色）、カテゴリ選択（6種：健康/運動/学習/仕事/マインド/その他）

**ステップ2（頻度）**: 「毎日」/「特定の曜日」/「カスタム」の3択。曜日選択UIは7つのトグルボタン。

**ステップ3（リマインダー）**: 日次リマインダーの有効/無効切替、時刻入力（HH:MM）、プレビューカード表示。

### 4.7 統計・分析画面

- **達成率**: ヒーローサイズ（72pt）のパーセント表示
- **日次バーチャート**: 過去7日間の達成率（曜日ラベル付き）
- **28日間ヒートマップ**: 4段階グリッド（0%=無色、>0%=薄、>40%=中、>70%=濃）
- **トップストリーク**: 上位3習慣の現在ストリーク表示

---

## 5. データベース設計

### ER図

```
┌───────────┐        ┌──────────────┐        ┌───────────┐
│  habits    │──1:N──│ completions   │        │  streaks   │
│            │       │               │        │            │
│ id (PK)    │       │ id (PK)       │        │ habit_id   │
│ user_id    │       │ habit_id (FK) │        │  (PK, FK)  │
│ name       │       │ completed_date│        │ current    │
│ description│       │ note          │        │  _streak   │
│ icon       │       │ photo_uri     │        │ longest    │
│ color      │       │ created_at    │        │  _streak   │
│ category   │       │ synced_at     │        │ last_date  │
│ frequency  │       │               │        │ updated_at │
│ target_days│       │ UNIQUE(       │        └────────────┘
│ reminder_  │       │  habit_id,    │
│  time      │       │  completed_   │
│ reminder_  │       │  date)        │
│  enabled   │       └───────────────┘
│ is_archived│
│ sort_order │
│ device_id  │               ┌────────────────┐
│ version    │               │ sync_conflicts  │
│ created_at │               │                 │
│ updated_at │               │ id (PK)         │
│ synced_at  │               │ table_name      │
│            │               │ record_id       │
│ habits     │──1:1──────────│ local_data      │
│  (user_id) │               │ remote_data     │
└────────────┘               │ resolved        │
       │                     │ created_at      │
       ▼                     └─────────────────┘
┌──────────────┐
│  sync_queue   │
│               │
│ id (PK)       │
│ table_name    │
│ operation     │
│ data (JSON)   │
│ retry_count   │
│ max_retries   │
│ created_at    │
└───────────────┘
```

### インデックス

```sql
CREATE INDEX idx_completions_date ON completions(completed_date);
CREATE INDEX idx_completions_habit ON completions(habit_id, completed_date);
CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_sync_queue_retry ON sync_queue(retry_count);
```

### TypeScriptインターフェース

```typescript
// src/types/index.ts

type HabitCategory = 'health' | 'exercise' | 'learning' | 'work' | 'mind' | 'other';
type HabitFrequency = 'daily' | 'weekly' | 'custom';

interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  target_days: number[];       // [1,2,3,4,5] = 月〜金
  reminder_time: string | null; // HH:MM
  reminder_enabled: boolean;
  is_archived: boolean;
  sort_order: number;
  device_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

interface Completion {
  id: string;
  habit_id: string;
  completed_date: string;     // YYYY-MM-DD
  note: string | null;
  photo_uri: string | null;
  created_at: string;
  synced_at: string | null;
}

interface Streak {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

interface SyncQueueItem {
  id: string;
  table_name: 'habits' | 'completions' | 'streaks';
  operation: SyncOperation;
  data: string;               // JSON文字列
  retry_count: number;
  max_retries: number;
  created_at: string;
}

interface SyncConflict {
  id: string;
  table_name: string;
  record_id: string;
  local_data: string;         // JSON文字列
  remote_data: string;        // JSON文字列
  resolved: boolean;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface HabitWithStreak extends Habit {
  streak: Streak;
  isCompletedToday: boolean;
}
```

### 設計判断

| 判断 | 理由 |
|------|------|
| `UNIQUE(habit_id, completed_date)` | 重複完了を防止。べき等な同期に必須 |
| streaksを別テーブルに分離 | 読み取り毎の高コスト再計算を回避。書き込み時に更新 |
| sync_queueにJSON格納 | テーブルごとのスキーマ結合なしに任意のミューテーションをキューイング可能 |
| habitsにversion列 | マルチデバイスでの楽観的ロック・コンフリクト解決 |
| 全FK `ON DELETE CASCADE` | アカウント削除時に関連データを自動クリーンアップ |
| `lower(hex(randomblob(16)))` | SQLiteデフォルトIDとして暗号学的ランダム32桁16進数 |

---

## 6. セキュリティ設計

### 監査結果

| カテゴリ | 結果 | 詳細 |
|----------|------|------|
| ハードコードされた秘密鍵・APIキー | **合格** | 全認証情報は環境変数経由。`.env`はコミット履歴に含まれない |
| SQLインジェクション | **合格** | 全クエリがパラメータ化バインド変数（`?`）を使用 |
| XSS | **該当なし** | React Nativeの`Text`コンポーネントはHTMLをレンダリングしない |
| 行レベルセキュリティ | **合格** | 全5テーブルでPostgreSQLレベルの`auth.uid() = user_id`を強制 |
| ID生成 | **合格** | `crypto.getRandomValues()`による暗号学的に安全なUUID |
| 入力値バリデーション | **合格** | 全ユーザー入力に長さ制限（名前100文字、メール254文字、パスワード最小8文字＋大文字＋数字） |
| パスワードポリシー | **合格** | 8文字以上＋大文字1つ以上＋数字1つ以上をサインアップ時に要求 |
| デバッグログのサニタイズ | **合格** | 開発ログでユーザーIDを8文字に切り詰め表示。本番環境ではPII出力なし |
| PRAGMAインジェクション防止 | **合格** | `DB_VERSION`を`Number()`でキャストし整数チェック後にPRAGMAに代入 |

### 脅威モデル

| 脅威 | 対策 |
|------|------|
| 不正データアクセス | 全5テーブルにRLSポリシー（PostgreSQLレベルで強制） |
| セッションハイジャック | Supabase認証のJWTリフレッシュトークン、セッション有効期限 |
| SQLインジェクション（ローカル） | expo-sqliteバインド変数によるパラメータ化クエリ |
| 予測可能なID | `Math.random()`の代わりに`crypto.getRandomValues()` |
| 入力値オーバーフロー | バリデーション制限：名前100文字、説明500文字、メール254文字 |
| 通信不良時のデータ損失 | ローカルファーストSQLite＋指数バックオフ付き非同期同期キュー |

### 型付きエラー階層

```typescript
// src/lib/errors.ts
class AppError extends Error {
  type: 'SYNC_ERROR' | 'DATABASE_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR';
}
class SyncError extends AppError {}      // 同期パイプライン
class DatabaseError extends AppError {}  // SQLiteトランザクション
class NetworkError extends AppError {}   // ネットワーク障害
```

`withDatabaseTransaction()`関数が`BEGIN`/`COMMIT`/`ROLLBACK`を管理し、失敗時に`DatabaseError`をスロー。

---

## 7. プロジェクト構造

```
src/                                           行数
├── app/                                       ─ Expo Routerスクリーン
│   ├── _layout.tsx                          (135)  ルートレイアウト＋LanguageSync＋SyncManager
│   ├── (auth)/
│   │   ├── _layout.tsx                      ( 10)  認証スタックレイアウト
│   │   ├── sign-in.tsx                      (113)  サインイン画面
│   │   └── sign-up.tsx                      (104)  サインアップ画面
│   ├── (tabs)/
│   │   ├── _layout.tsx                      ( 71)  4タブナビゲーション
│   │   ├── index.tsx                        (130)  今日の画面＋FAB
│   │   ├── habits.tsx                       ( 82)  全習慣リスト
│   │   ├── stats.tsx                        (197)  統計＋ヒートマップ
│   │   └── profile.tsx                      (196)  設定＋テーマ＋言語切替
│   └── habit/
│       ├── new.tsx                           (224)  3ステップ作成ウィザード
│       └── [id].tsx                          (267)  習慣詳細＋月間カレンダー
├── components/
│   ├── brutal/                              ─ デザインシステム（10コンポーネント）
│   │   ├── index.ts                         ( 10)  バレルエクスポート
│   │   ├── OffsetShadow.tsx                 ( 51)  アニメーション付きシャドウ
│   │   ├── BrutalCard.tsx                   ( 46)  カードコンテナ
│   │   ├── BrutalButton.tsx                 ( 83)  ボタン（3サイズ＋ローディング）
│   │   ├── BrutalInput.tsx                  ( 81)  テキスト入力＋エラー表示
│   │   ├── BrutalCheckbox.tsx               ( 70)  チェックボックス＋アニメーション
│   │   ├── BrutalTag.tsx                    ( 51)  タグ＋BlackTag
│   │   ├── BrutalProgress.tsx               ( 61)  プログレスバー
│   │   ├── StatBox.tsx                      ( 53)  数値統計表示
│   │   └── HatchPattern.tsx                 ( 47)  SVG斜線パターン
│   ├── habits/
│   │   ├── BrutalHabitCard.tsx              (105)  習慣カード（ストリーク＋カテゴリ）
│   │   └── StreakRing.tsx                   ( 72)  SVG円形プログレス
│   └── common/
│       ├── LoadingSpinner.tsx               ( 25)  読み込み中スピナー
│       └── Toast.tsx                        ( 50)  トースト通知
├── constants/
│   ├── theme.ts                             (116)  パレット、トークン、useTheme()
│   ├── config.ts                            ( 39)  アプリ定数＋バリデーション制限
│   └── categories.ts                        ( 50)  6カテゴリ定義
├── i18n/
│   ├── index.ts                             ( 33)  i18next初期化＋デバイス言語検出
│   └── locales/
│       ├── ja.json                          (197)  日本語翻訳
│       └── en.json                          (197)  英語翻訳
├── stores/
│   ├── authStore.ts                         (111)  認証状態＋Supabaseセッション管理
│   ├── habitStore.ts                        (140)  習慣・完了・ストリーク状態
│   ├── settingsStore.ts                     ( 47)  テーマ・言語・通知設定
│   └── toastStore.ts                        ( 37)  トースト通知キュー
├── hooks/
│   ├── useHabits.ts                         (124)  習慣CRUD＋完了切替
│   ├── useStreak.ts                         ( 42)  ストリーク取得＋トップストリーク
│   ├── useSync.ts                           ( 59)  同期実行＋AppState監視
│   └── useNotifications.ts                  ( 44)  リマインダー通知管理
├── lib/
│   ├── database.ts                          (630)  SQLite CRUD＋マイグレーション＋ストリーク計算
│   ├── sync.ts                              (249)  同期パイプライン＋コンフリクト解決
│   ├── supabase.ts                          ( 25)  Supabaseクライアント初期化
│   ├── errors.ts                            ( 70)  型付きエラー階層＋トランザクション
│   ├── haptics.ts                           ( 29)  触覚フィードバック（7種）
│   └── notifications.ts                     ( 49)  プッシュ通知スケジューリング
├── types/
│   └── index.ts                             (160)  全TypeScriptインターフェース
├── dev/
│   └── seed.ts                              (212)  開発用シードデータ（5習慣）
└── __tests__/
    ├── habitStore.test.ts                   (195)  Zustandストアテスト
    ├── streak.test.ts                       (127)  ストリーク計算テスト
    └── sync.test.ts                         ( 59)  同期パイプラインテスト
                                           ─────
                                    合計: 5,375行
```

---

## 8. セットアップ

### 前提条件

- Node.js 18以上
- npm 9以上
- Expo CLI（`npx expo`経由）
- iOS: Xcode 15以上（シミュレータ用）
- Android: Android Studio（エミュレータ用）

### インストール手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/mer-prog/pulse-habit.git
cd pulse-habit

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数を設定（任意 — Supabaseなしでもオフラインモードで動作）
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定

# 4. 開発サーバーを起動
npx expo start
```

### 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | いいえ | SupabaseプロジェクトURL（`https://<id>.supabase.co`） |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | いいえ | Supabase公開anonキー |

両方とも任意。設定しない場合、アプリはローカルSQLiteのみのオフラインモードで全機能が動作する。

### 実行コマンド

| コマンド | 説明 |
|---------|------|
| `npm start` | Expo開発サーバー起動 |
| `npm run ios` | iOSシミュレータで実行 |
| `npm run android` | Androidエミュレータで実行 |
| `npm run web` | ウェブ版起動 |
| `npm test` | Jestテストスイート実行 |
| `npm run lint` | ESLint実行 |
| `npm run typecheck` | TypeScript strict型チェック |

---

## 9. 設計判断

| 判断 | 理由 |
|------|------|
| **AsyncStorageではなくSQLite** | リレーショナルクエリ（ストリーク計算のJOIN）、高速読み取り、ACIDトランザクション対応 |
| **ReduxやContextではなくZustand** | ボイラープレート70%削減、セレクタベースの再レンダリング、Providerラッパー不要 |
| **FirebaseではなくSupabase** | PostgreSQL（RLS、リレーショナルモデル）、オープンソース、予測可能な課金体系 |
| **NativeWindではなくインラインスタイル** | ネオブルータリストのデザイントークン（太ボーダー・オフセットシャドウ）をNativeWindで表現すると競合が発生 |
| **ContextではなくuseTheme()フック** | Zustandセレクタが`themeMode`のみを購読し、ツリー全体の再レンダリングを回避 |
| **リアルタイムではなくキューベースの同期** | ネットワーク切断に耐性あり。WebSocketは切断時にサイレント失敗する |
| **expo-localization単体ではなくi18next** | 翻訳キーの名前空間分離、補間（`{{count}}`日）、複数形対応。expo-localizationはロケール検出のみに使用 |
| **4ストア分離（auth/habit/settings/toast）** | 関心の分離。認証変更が習慣ストアの再レンダリングを引き起こさない |
| **streaksテーブルの分離** | 完了記録追加のたびに全completionsを再計算するコストを回避。書き込み時にインクリメンタルに更新 |

---

## 10. 運用コスト

| サービス | プラン | 月額コスト |
|----------|--------|-----------|
| Supabase | 無料枠 | 0円 |
| Expo | 無料枠 | 0円 |
| Apple Developer Program | - | 年間12,980円（公開時のみ） |
| Google Play Console | - | 一回のみ25ドル（公開時のみ） |

**合計運用コスト: 0円/月**

Supabase無料枠: 500MBデータベース、1GB転送、50,000行、50,000月間アクティブユーザー。個人利用や小規模チームでは十分。

Supabase未設定時はローカルSQLiteのみで動作するため、クラウドサービスなしでも全機能を利用可能。

---

## 11. 著者

<p align="center">
  <a href="https://github.com/mer-prog">mer-prog</a> により構築
</p>

---

<p align="center">
  <a href="./README.md">English README</a> · <a href="./README_JP.md">日本語 README</a>
</p>
