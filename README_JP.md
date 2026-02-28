<p align="center">
  <img src="assets/icon.png" alt="PulseHabit" width="80" height="80" />
</p>

<h1 align="center">PulseHabit</h1>
<p align="center"><strong>オフラインファーストの習慣トラッカー — ネットが切れてもデータ消失ゼロ。</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-RLS-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/運用コスト-¥0%2F月-brightgreen?style=flat-square" alt="Cost" />
</p>

<p align="center">
  <a href="https://mer-prog.github.io/pulse-habit/docs/showcase.html"><strong>ショーケース</strong></a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">アーキテクチャ</a> ·
  <a href="#security">セキュリティ</a> ·
  <a href="./README.md">English</a>
</p>

---

## なぜこのプロジェクトを作ったか

多くの習慣アプリは現実世界で壊れる — 地下鉄、機内モード、不安定なWi-Fi。PulseHabitはこの問題を解決するために作った。全ての変更はまずSQLiteに書き込み、Supabaseへは非同期で同期するため、UIは通信状態に関係なく10ms以下で応答する。

チュートリアルの延長ではない。オフラインモードで生成されたローカルSQLiteのuser_idが、サインアップ後にSupabaseの`auth.uid()`と乖離し、Row Level Securityポリシーが全INSERTを拒否するという**本番レベルの同期バグ**を発見し、解決している。

**対象**: モバイルアプリを作りたいスタートアップ、ヘルステック企業、オフラインファースト設計のReact Native実装例を探しているエンジニア。

---

## デモ

> **[ショーケースページ](https://mer-prog.github.io/pulse-habit/docs/showcase.html)** — インタラクティブなモックアップ、機能ウォークスルー、擬似ストアページ。

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   TODAY.     │  │   HABITS.   │  │   STATS.    │  │   PROFILE   │
│             │  │             │  │             │  │             │
│  ◉ 3/5     │  │ 01 🏃 ジョグ │  │  ▓▓▓▓░ 78% │  │  ○ user     │
│  ████░░░░░ │  │ 02 📚 読書  │  │             │  │  Theme: ◐   │
│             │  │ 03 🧘 瞑想  │  │  Streak: 45 │  │  Sync: ✓    │
│  🏃 ジョグ ✓ │  │ 04 💧 水2L  │  │  Best: 45d  │  │             │
│  📚 読書  ✓ │  │ 05 💻 コード │  │  Total: 847 │  │  Sign Out → │
│  🧘 瞑想  ✓ │  │             │  │             │  │             │
│  💧 水2L  · │  │  🔥23  🔥15 │  │  ▪▪▫▪▪▪▫   │  │             │
│  💻 コード · │  │             │  │  Feb 2026   │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

<a id="quick-start"></a>

## Quick Start

```bash
# 1. クローン
git clone https://github.com/mer-prog/pulse-habit.git
cd pulse-habit

# 2. 依存関係インストール
npm install

# 3. 環境変数の設定（任意 — Supabaseなしでもオフラインで完全動作）
cp .env.example .env
# .env にSupabaseプロジェクトURLとanon keyを記入

# 4. 起動
npx expo start
```

> **Supabaseアカウントがなくても大丈夫。** アプリはローカルSQLiteで完全に動作します。Supabaseの認証情報を追加すると、クラウド同期が自動で有効になります。

### 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm start` | Expo開発サーバーを起動 |
| `npm run ios` | iOSシミュレータで実行 |
| `npm run android` | Androidエミュレータで実行 |
| `npm run web` | Web版を起動 |
| `npm test` | Jestテストスイートを実行 |
| `npm run lint` | ESLintを実行 |
| `npm run typecheck` | TypeScript strictモード型チェック |

---

## 証明できるスキル

| スキル | 実装内容 |
|--------|---------|
| **オフラインファースト設計** | 全ての変更をまずローカルSQLiteに書き込み（<10ms）、キュー経由でSupabaseに非同期同期。指数バックオフ＋自動パージで接続状態に関係なくデータ消失ゼロ。 |
| **認証 + Row Level Security** | APIキーが漏洩しても他人のデータにアクセスできない。PostgreSQLレベルでデータ分離を強制。クライアント側の制御ではなくサーバーサイドで保証。 |
| **カスタムデザインシステム** | UIライブラリ不使用で10コンポーネントのNeo-Brutalistシステムをゼロから構築。太ボーダー、オフセットシャドウ、モノスペースフォント。ダークモード完全対応。 |
| **同期コンフリクト解決** | ローカルSQLiteのuser_idとSupabase auth UIDが乖離する本番バグを発見・解決。同期パイプライン内でuser_idを書き換え、RLSを通過させる仕組みを実装。 |
| **セキュリティ強化** | 暗号学的ID生成、入力バリデーション、デバッグログのサニタイズ、PRAGMAインジェクション防止。全監査結果を下記に記載。 |
| **多言語対応 (i18n)** | i18next + expo-localizationによる日英切替、デバイス言語自動検出、Zustand永続化との統合。 |

---

<a id="architecture"></a>

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│           React Native UI               │
│    Neo-Brutalist デザインシステム (10)    │
│    Expo Router v6 · useTheme()          │
├─────────────────────────────────────────┤
│          Zustand 状態管理層              │
│   authStore · habitStore · settings     │
├───────────────────┬─────────────────────┤
│  SQLite (ローカル)  │   Sync Queue       │
│  全ての変更は      │   retry + purge    │
│  ここに先に書く    │   backoff: 1s×2^n  │
├───────────────────┴─────────────────────┤
│           Supabase (クラウド)            │
│    Auth · PostgreSQL · RLS Policies     │
└─────────────────────────────────────────┘
```

**データフロー**: UI → Zustand → SQLite（即座） → Sync Queue → Supabase（非同期）。ユーザーはネットワークを待たない。

---

## 主要機能

### 1. オフラインファースト同期パイプライン

ユーザーはオフラインでも習慣の作成、完了記録、統計閲覧がすべて可能。接続が戻れば自動で同期。

```
ユーザーが「完了」をタップ
  → SQLite INSERT（即座、<10ms）
  → sync_queueテーブルにエンキュー
  → SyncManagerが認証セッションを検出
  → キューアイテムを順次処理
  → Supabase UPSERTをRLS検証付きで実行
  → 成功: デキュー
  → 失敗: リトライカウント++、バックオフ 1s × 2^n
  → 5回失敗: 古いアイテムを自動パージ
```

**難所**: SQLiteはオフラインモード中にローカル生成のUUIDを保存する。サインアップ後、これが`auth.uid()`と乖離する。書き換えなしだとRLSポリシーが全INSERTを拒否する。同期パイプラインでこれを解決:

```typescript
// sync.ts — Supabase INSERT前のuser_id書き換え
if (data.user_id && data.user_id !== session.user.id) {
  data.user_id = session.user.id;
}
```

### 2. Row Level Security（RLS）

APIキーが漏洩しても他人のデータにはアクセス不可。セキュリティはPostgreSQLレベルで強制。

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

### 3. Neo-Brutalistデザインシステム

Material/Cupertino系の量産UIと一線を画す、記憶に残るUI。テーマ切り替え時のフラッシュゼロでダークモード完全対応。

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

**テーマシステム**: `useTheme()`がZustandの`settingsStore`（AsyncStorageで永続化）から読み取り、`useColorScheme()`でシステム設定に対応。Context Provider不要 — 不要な再レンダリングなし。

### 4. ストリーク追跡エンジン

現在のストリーク、最長記録、達成率がタップした瞬間にリアルタイム更新。計算はSQLiteに対してクライアントサイドで実行し、即座にフィードバック。

### 5. 多言語対応（i18n）

日本語/英語の完全切替対応 — アプリの再起動不要で即座に反映。

- **デバイス言語の自動検出**: `expo-localization`で初回起動時に自動判定（日本語環境 → `ja`、それ以外 → `en`）
- **設定画面からの手動切替**: JP / EN トグルボタン（Neo-Brutalistスタイル）
- **Zustand settingsStoreとの双方向同期**: i18nextの言語変更がAsyncStorage経由で永続化
- **ロケール別フォーマット**: 日付、カレンダーの曜日名・月名、ストリークテキストが選択言語に対応

---

## 技術スタック

| カテゴリ | 技術 | 選定理由 |
|---------|------|---------|
| フレームワーク | React Native 0.81 | iOS + Android クロスプラットフォーム |
| プラットフォーム | Expo SDK 54 | マネージドワークフロー、OTAアップデート |
| ナビゲーション | Expo Router v6 | ファイルベースルーティング（型安全） |
| 言語 | TypeScript (strict) | 全ソースファイルの型安全性 |
| 状態管理 | Zustand | セレクタベース再レンダリング、Provider不要 |
| ローカルDB | expo-sqlite | 同期リード、オフライン永続化、ACID |
| バックエンド | Supabase | Auth、PostgreSQL、RLS |
| デザイン | カスタム（Neo-Brutalist） | 手作り10コンポーネント、ダークモード |
| 多言語対応 | i18next + react-i18next | 翻訳キー管理、補間、名前空間分離 |
| ロケール検出 | expo-localization | デバイス言語検出でデフォルトロケール決定 |
| フォント | Space Grotesk + Space Mono | ディスプレイ + モノスペースの組み合わせ |

---

## プロジェクト構成

```
src/
├── app/                        # Expo Router 画面
│   ├── _layout.tsx             # ルートレイアウト + SyncManager
│   ├── (auth)/                 # サインイン / サインアップ
│   ├── (tabs)/                 # 4タブナビゲーション
│   │   ├── index.tsx           # Today画面 + FAB
│   │   ├── habits.tsx          # 習慣一覧
│   │   ├── stats.tsx           # 統計 + カレンダーヒートマップ
│   │   └── profile.tsx         # 設定 + テーマトグル
│   └── habit/
│       ├── new.tsx             # 3ステップ作成ウィザード
│       └── [id].tsx            # 詳細 + 月間カレンダー
├── components/
│   ├── brutal/                 # デザインシステム（10コンポーネント）
│   ├── habits/                 # BrutalHabitCard, StreakRing
│   └── common/                 # LoadingSpinner, Toast
├── constants/
│   ├── theme.ts                # パレット、トークン、useTheme()
│   └── config.ts               # アプリ定数 + バリデーション制限値
├── i18n/
│   ├── index.ts                # i18next初期化 + デバイス言語検出
│   └── locales/                # 翻訳JSONファイル（ja.json, en.json）
├── stores/                     # Zustand ストア（auth, habit, settings, toast）
├── hooks/                      # useHabits, useStreak, useSync, useNotifications
├── lib/
│   ├── database.ts             # SQLite CRUD + マイグレーション
│   ├── sync.ts                 # 同期パイプライン + コンフリクト解決
│   ├── supabase.ts             # クライアント初期化
│   └── errors.ts               # 型付きエラー階層
├── types/index.ts              # TypeScript インターフェース
└── dev/seed.ts                 # 開発用シードデータ
```

---

## データベース設計

```
┌───────────┐        ┌──────────────┐        ┌───────────┐
│  habits    │──1:N──│ completions   │        │  streaks   │
│            │       │               │        │            │
│ id (PK)    │       │ habit_id (FK) │        │ habit_id   │
│ user_id    │       │ completed_date│        │  (PK, FK)  │
│ name       │       │ note          │        │ current    │
│ frequency  │       └───────────────┘        │ longest    │
│ icon/color │──1:1───────────────────────────│ last_date  │
│ version    │                                └────────────┘
└────────────┘
       │ (user_id)
       ▼
┌──────────────┐     ┌────────────────┐
│  sync_queue   │     │ sync_conflicts  │
│               │     │                 │
│ table_name    │     │ local_data      │
│ operation     │     │ remote_data     │
│ data (JSONB)  │     │ resolved        │
│ retry_count   │     └─────────────────┘
└───────────────┘
```

| 判断 | 根拠 |
|------|------|
| `UNIQUE(habit_id, completed_date)` | 同じ日の重複完了を防止 — 冪等な同期に不可欠 |
| `streaks` を別テーブルに分離 | 読み取り毎の高コスト再計算を回避、書き込み時に更新 |
| `sync_queue` に JSONB | どのテーブルの変更でもスキーマ結合なしにキューイング可能 |
| `habits` に `version` | マルチデバイス対応に向けた楽観的ロック |
| 全FKに `ON DELETE CASCADE` | ユーザー削除時に関連データを自動クリーンアップ |

---

<a id="security"></a>

## セキュリティ

### 監査結果

本コードベースに対してフルセキュリティ監査を実施。結果:

| カテゴリ | 状態 | 詳細 |
|---------|------|------|
| ハードコードされた秘密鍵 / APIキー | **PASS** | 全認証情報は環境変数経由。`.env`はコミット履歴に一度も含まれていない |
| SQLインジェクション | **PASS** | 全クエリでパラメータバインド変数（`?`）を使用 |
| XSS | **N/A** | React Native の `Text` はHTMLを描画しない |
| Row Level Security | **PASS** | 全5テーブルで `auth.uid() = user_id` をPostgreSQLレベルで強制 |
| ID生成 | **PASS** | `crypto.getRandomValues()` で暗号学的に安全なUUIDを生成 |
| 入力バリデーション | **PASS** | 全ユーザー入力に長さ制限（名前、メール、習慣名） |
| パスワードポリシー | **PASS** | サインアップ時に最小8文字 + 大文字 + 数字を要求 |
| デバッグログのサニタイズ | **PASS** | 開発ログでユーザーIDを切り詰め。本番ではPII出力なし |
| Git履歴 | **PASS** | `.env`ファイルのコミット履歴なし。秘密情報は一切含まれない |
| 依存パッケージの脆弱性 | **NOTE** | 開発依存のみ（jest/babel）。本番ビルドへの影響なし |

### 脅威モデル

| 脅威 | 対策 |
|------|------|
| 不正なデータアクセス | 全5テーブルにRLSポリシー — PostgreSQLレベルで強制 |
| セッションハイジャック | Supabase AuthのJWTリフレッシュトークン、セッション有効期限 |
| SQLインジェクション（ローカル） | expo-sqliteのバインド変数によるパラメータ化クエリ |
| 予測可能なID | `Math.random()`ではなく`crypto.getRandomValues()`を使用 |
| 入力オーバーフロー | バリデーション制限: 名前100文字、説明500文字、メール254文字 |
| 接続不良時のデータ消失 | ローカルファーストSQLite + 指数バックオフ付き非同期sync queue |

### 本番強化ロードマップ

| 強化項目 | 状況 |
|---------|------|
| 認証エンドポイントのレート制限 | 計画中 — Supabase組み込み |
| メール認証フロー | 計画中 — Supabaseでサポート済み |
| 証明書ピンニング | 計画中 — プロダクションビルド用 |
| 生体認証ロック | 計画中 — expo-local-authentication |

---

## 設計判断

| 判断 | 根拠 |
|------|------|
| **SQLite（AsyncStorageではなく）** | リレーショナルクエリ（ストリーク計算のJOIN）、高速リード、ACIDトランザクション |
| **Zustand（Redux/Contextではなく）** | ボイラープレート70%削減、セレクタベース再レンダリング、Providerラッパー不要 |
| **Supabase（Firebaseではなく）** | PostgreSQL（RLS、正規リレーショナルモデル）、オープンソース、予測可能な料金体系 |
| **インラインスタイル（NativeWindではなく）** | Neo-Brutalistのデザイントークンを完全制御。NativeWindのユーティリティクラスが太ボーダー/シャドウパターンと競合 |
| **useTheme() フック（Contextではなく）** | Zustandセレクタが`themeMode`のみを購読 — テーマ変更でツリー全体の再レンダリングを回避 |
| **キューベース同期（リアルタイムではなく）** | ネットワーク断に対して耐性が高い。WebSocketは切断時にサイレント失敗する |
| **i18next（expo-localization単体ではなく）** | 翻訳キーの名前空間分離、補間（`{{count}}日連続`等）、複数形対応が必要。expo-localizationはロケール検出のみ |

---

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | いいえ | SupabaseプロジェクトURL（`https://<id>.supabase.co`） |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | いいえ | Supabase公開anonキー |

> 両方とも任意。設定なしでもオフラインモードで全機能が利用可能。

---

## ライセンス

[MIT](./LICENSE) — 自由に使用・改変・再配布可能。

---

<p align="center">
  Built by <a href="https://github.com/mer-prog">mer-prog</a>
</p>
