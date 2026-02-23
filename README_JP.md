# 🟠 PulseHabit — オフラインでも使える習慣トラッカー

## サマリー

- **何を作ったか**: ネットが切れても普通に使えて、繋がった瞬間にクラウドと自動同期する習慣トラッカー。データ消失ゼロ。
- **誰のためか**: モバイルアプリを作りたいスタートアップ、ヘルステック企業、オフラインファースト設計のReact Native実装例を探しているエンジニア。
- **技術**: React Native · Expo SDK 54 · TypeScript · Zustand · SQLite · Supabase · Row Level Security

---

## リンク

| | |
|---|---|
| **📱 ショーケース** | [mer-prog.github.io/pulse-habit/docs/showcase.html](https://mer-prog.github.io/pulse-habit/docs/showcase.html) |
| **💻 ソースコード** | [github.com/mer-prog/pulse-habit](https://github.com/mer-prog/pulse-habit) |
| **🏗️ 運用コスト** | **月額 ¥0** — Supabase無料枠（5万リクエスト/月、500MBストレージ） |

> **注意**: ポートフォリオ用プロジェクトです。ショーケースページにはモックスクリーンショットと擬似ストアページを含みます。

---

## このプロジェクトで証明できるスキル

| スキル | 実装内容 |
|--------|---------|
| **オフラインファースト設計** | ネットなしで完全動作するアプリを構築。全ての変更をまずローカルSQLiteに書き込み、キュー経由でSupabaseに非同期同期。指数バックオフ＋自動パージで接続不良時もデータ消失ゼロ。 |
| **認証 + Row Level Security** | APIキーが漏洩しても他人のデータにアクセスできない設計。Supabase Authでセッション管理し、PostgreSQL RLSポリシーでサーバーサイドからデータ分離を強制。 |
| **カスタムデザインシステム** | UIライブラリ不使用で10コンポーネントのNeo-Brutalistデザインシステムをゼロから構築。太ボーダー、オフセットシャドウ、モノスペースフォント。ダークモード完全対応。 |
| **同期コンフリクト解決** | ローカルSQLiteのuser_idとSupabase auth UIDが乖離する実運用バグを発見・解決。同期パイプライン内でuser_idを書き換え、RLSポリシーを通過させる仕組みを実装。 |
| **ファイルベースルーティング + 状態管理** | Expo Router v6で型安全なナビゲーション、Zustandでボイラープレート最小の状態管理。設定はpersistミドルウェアでAsyncStorageに永続化。 |

---

## アーキテクチャ

```
┌──────────────────────────────────────┐
│         React Native UI              │
│   Neo-Brutalist デザインシステム (10)  │
│   Expo Router v6 · useTheme()        │
├──────────────────────────────────────┤
│         Zustand 状態管理層            │
│  authStore · habitStore · settings   │
├─────────────────┬────────────────────┤
│  SQLite (ローカル) │  Sync Queue      │
│  全ての変更は     │  retry + purge   │
│  ここに先に書く   │  backoff: 1s×2^n │
├─────────────────┴────────────────────┤
│          Supabase (クラウド)          │
│   Auth · PostgreSQL · RLS Policies   │
└──────────────────────────────────────┘
```

**データフロー**: UI → Zustand → SQLite（即座） → Sync Queue → Supabase（非同期）。ユーザーはネットワークを待たない。

---

## 主要機能

### 1. オフラインファースト同期パイプライン

**成果**: ユーザーはオフラインでも習慣の作成、完了記録、統計閲覧がすべて可能。接続が戻れば自動で同期。

**仕組み**:

```
ユーザーが「完了」をタップ
  → SQLite INSERT（即座、<10ms）
  → sync_queueテーブルにエンキュー
  → SyncManagerが認証セッションを検出
  → キューアイテムを順次処理
  → Supabase INSERTをRLS検証付きで実行
  → 成功: デキュー
  → 失敗: リトライカウント++、バックオフ 1s × 2^n
  → 5回失敗: 古いアイテムを自動パージ
```

**技術詳細**: 同期パイプラインは各バッチ処理前に `session.user.id` を検証し、ペイロード内の `user_id` フィールドを認証済みUIDで上書きする。これはゲストモード中にSQLiteがローカル生成UUIDを保存し、サインアップ後に `auth.uid()` と乖離するため必要な処理。この書き換えがないとRLSポリシーがINSERTを拒否する。

```typescript
// sync.ts — Supabase INSERT前のuser_id書き換え
if (data.user_id && data.user_id !== session.user.id) {
  data.user_id = session.user.id;
}
```

---

### 2. Row Level Security（RLS）

**成果**: APIキーが漏洩しても他人のデータにはアクセス不可。セキュリティはPostgreSQLレベルで強制。

**仕組み**: 全テーブルに `auth.uid() = user_id` のRLSポリシーを設定。completionsとstreaksは親habitを経由したサブクエリで所有権を検証。

```sql
-- 直接所有権（habits, sync_queue）
CREATE POLICY "Users can view own habits" ON habits 
  FOR SELECT USING (auth.uid() = user_id);

-- 間接所有権（completions → habit経由）
CREATE POLICY "Users can view own completions" ON completions 
  FOR SELECT USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );
```

---

### 3. Neo-Brutalistデザインシステム

**成果**: Material/Cupertino系の量産UIと一線を画す、記憶に残るUI。テーマ切り替え時のフラッシュゼロでダークモード完全対応。

**構築したコンポーネント**（計10個）:

| コンポーネント | 用途 |
|-------------|------|
| `BrutalCard` | 3px枠線 + 4pxオフセットシャドウのコンテナ |
| `BrutalButton` | 押下時にtranslateアニメーション |
| `BrutalInput` | 太枠線スタイルのテキスト入力 |
| `BrutalCheckbox` | 触覚フィードバック付き完了トグル |
| `BrutalTag` | カラーバリアント対応のカテゴリバッジ |
| `BrutalProgress` | 枠線スタイルのプログレスバー |
| `StatBox` | 数値統計の表示（ストリーク、達成率） |
| `OffsetShadow` | 再利用可能なシャドウラッパー |
| `HatchPattern` | SVG斜線パターンの背景 |
| `BrutalHabitCard` | ストリークリング付きの複合ハビットカード |

**テーマシステム**: `useTheme()` フックがZustandの `settingsStore`（AsyncStorageで永続化）から読み取り、`useColorScheme()` でシステム設定に対応。各コンポーネントで `const { colors, isDark } = useTheme()` を展開 — Context Provider不要、不要な再レンダリングなし。

---

### 4. ストリーク追跡エンジン

**成果**: 現在のストリーク、最長記録、達成率をリアルタイム表示。タップした瞬間に更新が反映される。

**仕組み**: ストリーク計算はSQLiteに対してクライアントサイドで実行し、即座にフィードバック。完了トグル時の処理:

1. `completions` テーブルにINSERT/DELETE
2. 今日から遡って `completed_date` エントリを走査しストリーク再計算
3. `streaks` テーブルを新しい値でUPDATE
4. 両オペレーションをsync queueにエンキュー

---

## 技術スタック

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| フレームワーク | React Native 0.81 | iOS + Android クロスプラットフォーム |
| プラットフォーム | Expo SDK 54 | ビルドツール、OTAアップデート |
| ナビゲーション | Expo Router v6 | ファイルベースルーティング（型安全） |
| 言語 | TypeScript (strict) | 47ソースファイル全体の型安全性 |
| 状態管理 | Zustand | セレクタベース再レンダリング、Provider不要 |
| ローカルDB | expo-sqlite | 同期リード、オフライン永続化 |
| バックエンド | Supabase | Auth、PostgreSQL、RLS |
| デザイン | カスタム（Neo-Brutalist） | 手作り10コンポーネント、ダークモード |
| フォント | Space Grotesk + Space Mono | ディスプレイ + モノスペースの組み合わせ |

---

## プロジェクト構成

```
src/                          # 4,805行 / 47ファイル
├── app/                      # Expo Router 画面
│   ├── _layout.tsx           # ルートレイアウト + SyncManager
│   ├── (auth)/               # サインイン / サインアップ
│   ├── (tabs)/               # 4タブナビゲーション
│   │   ├── index.tsx         # Today画面 + FAB
│   │   ├── habits.tsx        # 習慣一覧
│   │   ├── stats.tsx         # 統計 + カレンダー
│   │   └── profile.tsx       # 設定 + テーマトグル
│   └── habit/
│       ├── new.tsx           # 3ステップ作成ウィザード
│       └── [id].tsx          # 詳細 + 月間カレンダー
├── components/
│   ├── brutal/               # デザインシステム（10コンポーネント）
│   ├── habits/               # BrutalHabitCard, StreakRing
│   └── common/               # LoadingSpinner
├── constants/
│   ├── theme.ts              # パレット、トークン、useTheme()
│   └── config.ts             # アプリ定数
├── stores/                   # Zustand ストア（3つ）
├── hooks/                    # useHabits, useStreak, useNotifications
├── lib/
│   ├── database.ts           # SQLite CRUD（619行）
│   ├── sync.ts               # 同期パイプライン（244行）
│   └── supabase.ts           # クライアント初期化
└── types/index.ts            # TypeScript インターフェース
```

---

## データベース設計

### ER図

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  habits   │──1:N──│ completions  │       │ streaks  │
│           │       │              │       │          │
│ id (PK)   │       │ habit_id(FK) │       │habit_id  │
│ user_id   │       │ completed_   │       │ (PK,FK)  │
│ name      │       │   date       │       │ current_ │
│ frequency │       │ note         │       │  streak  │
│ icon      │       └──────────────┘       │ longest_ │
│ color     │──1:1──────────────────────────│  streak  │
│ version   │                              └──────────┘
└──────────┘
     │
     │ (user_id)
     ▼
┌──────────────┐    ┌────────────────┐
│  sync_queue  │    │ sync_conflicts │
│              │    │                │
│ table_name   │    │ local_data     │
│ operation    │    │ remote_data    │
│ data (JSONB) │    │ resolved       │
│ retry_count  │    └────────────────┘
└──────────────┘
```

### スキーマ（TypeScript）

```typescript
interface Habit {
  id: string;              // UUID, PK
  user_id: string;         // FK → auth.users, RLSのアンカー
  name: string;
  icon: string;            // 絵文字
  color: string;           // Hex
  category: HabitCategory; // 'health' | 'exercise' | 'learning' | ...
  frequency: 'daily' | 'weekly' | 'custom';
  target_days: number[];   // [1,2,3,4,5] = 月〜金
  reminder_time: string | null;
  is_archived: boolean;
  version: number;         // 楽観的ロック用
  device_id: string | null;
}

interface Completion {
  id: string;
  habit_id: string;        // FK → habits
  completed_date: string;  // YYYY-MM-DD, habit_idとのUNIQUE制約
  note: string | null;
}

interface Streak {
  habit_id: string;        // PK + FK → habits
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}
```

### 設計判断の根拠

| 判断 | 根拠 |
|------|------|
| `completions` に `UNIQUE(habit_id, completed_date)` | 同じ日の重複完了を防止 — 冪等な同期に不可欠 |
| `streaks` を別テーブルに分離（計算値ではなく） | 読み取り毎の高コスト再計算を回避、書き込み時に更新 |
| `sync_queue` に `JSONB data` を格納 | どのテーブルの変更でもスキーマ結合なしにキューイング可能 |
| `habits` に `version` カラム | 将来のマルチデバイス対応に向けた楽観的ロック |
| 全FKに `ON DELETE CASCADE` | ユーザー削除時に関連データを自動クリーンアップ |

---

## セキュリティ設計

### 現在の実装

| 脅威 | 対策 |
|------|------|
| 不正なデータアクセス | 全5テーブルにRLSポリシー — PostgreSQLレベルで強制 |
| セッションハイジャック | Supabase AuthのJWTリフレッシュトークン、セッション有効期限 |
| SQLインジェクション（ローカル） | expo-sqliteのバインド変数によるパラメータ化クエリ |
| 接続不良時のデータ消失 | ローカルファーストSQLite + リトライ付き非同期sync queue |

### 本番強化計画（Production Hardening Plan）

| 強化項目 | 状況 |
|---------|------|
| 認証エンドポイントのレート制限 | 計画中 — Supabase組み込みのレート制限を活用予定 |
| メール認証フロー | 計画中 — Supabaseでサポート済み、未設定 |
| 証明書ピンニング | 計画中 — プロダクションビルド時に実装 |
| 生体認証ロック | 計画中 — expo-local-authenticationを使用予定 |

---

## 設計判断

| 判断 | 根拠 |
|------|------|
| **SQLite（AsyncStorageではなく）** | リレーショナルクエリ（ストリーク計算のJOIN）、高速リード、ACIDトランザクション |
| **Zustand（Redux/Contextではなく）** | ボイラープレート70%削減、セレクタベース再レンダリング、Providerラッパー不要 |
| **Supabase（Firebaseではなく）** | PostgreSQL（RLS、正規リレーショナルモデル）、オープンソース、予測可能な料金体系 |
| **インラインスタイル（NativeWindではなく）** | Neo-Brutalistのデザイントークンを完全制御。NativeWindのユーティリティクラスが太ボーダー/シャドウパターンと競合 |
| **useTheme() フック（Contextではなく）** | Zustandセレクタが `themeMode` のみを購読 — テーマ変更でツリー全体の再レンダリングを回避 |
| **キューベース同期（リアルタイムではなく）** | ネットワーク断に対して耐性が高い。リアルタイム（WebSocket）は切断時にサイレント失敗する |

---

## 作者

Built by [mer-prog](https://github.com/mer-prog)
