<p align="center">
  <img src="assets/icon.png" alt="PulseHabit" width="80" height="80" />
</p>

<h1 align="center">PulseHabit</h1>
<p align="center"><strong>オフラインファーストの習慣トラッカー — ネットが切れてもデータ消失ゼロ。<br />Offline-first habit tracker with cloud sync — zero data loss, even without internet.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-RLS-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tests-43_passed-brightgreen?style=flat-square&logo=jest" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="https://mer-prog.github.io/pulse-habit/docs/showcase.html"><strong>ショーケース / Live Showcase</strong></a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">アーキテクチャ</a> ·
  <a href="#security">セキュリティ</a> ·
  <a href="./README_PulseHabit_習慣トラッカー_EN.md">English (detailed spec)</a> ·
  <a href="./README_JP.md">日本語詳細版</a>
</p>

---

## 概要 / Overview

多くの習慣アプリは現実世界で壊れる — 地下鉄、機内モード、不安定な Wi-Fi。PulseHabit はこの問題を解決するために作った。全ての変更はまずローカル SQLite に書き込み、Supabase へは非同期で同期するため、UI は通信状態に関係なくネットワークを待たずに応答する。

チュートリアルの延長ではない。オフラインモードで生成されたローカル SQLite の user_id が、サインアップ後に Supabase の `auth.uid()` と乖離し、Row Level Security ポリシーが全 INSERT を拒否するという**本番レベルの同期バグ**を発見し、解決している。

**対象**: モバイルアプリを作りたいスタートアップ、ヘルステック企業、オフラインファースト設計の React Native 実装例を探しているエンジニア。

**技術的な見どころ:**

| | 実装内容 | コード上の根拠 |
|---|---|---|
| **オフラインファースト同期** | 全ミューテーションを SQLite 先行書込 → sync_queue 経由で Supabase へ非同期同期。失敗時は失敗時刻を記録し、**指数バックオフ（1s×2^n＋ジッタ）の待機時間が経過するまでリトライをスキップ**。5 回失敗で自動パージ | `src/lib/sync.ts`（`isReadyForRetry` / `processSyncQueue`） |
| **RLS による多層防御** | 全 5 テーブルに PostgreSQL レベルの Row Level Security。completions / streaks は親 habit 経由の間接所有チェック | `supabase/migrations/001_initial_schema.sql` |
| **user_id 書き換えパイプライン** | ローカル生成 UUID と `auth.uid()` の乖離で RLS が全拒否する本番バグを、同期時の user_id 書き換えで解決 | `src/lib/sync.ts:89-94` |
| **頻度対応ストリークエンジン** | daily / weekly / custom（曜日指定）の各頻度で「スケジュール日のみ」を連続性判定に使うストリーク計算。非スケジュール日はストリークを壊さない | `src/lib/database.ts`（`calculateStreak`） |
| **テスト 43 件** | ストリーク境界値（月跨ぎ・年跨ぎ・gap・頻度別）、バックオフの結線検証（統合テスト）、ストア挙動 — `npm test` で 3 スイート 43 件パス | `src/__tests__/` |

> **EN:** PulseHabit is an offline-first habit tracker: every mutation hits local SQLite first, then syncs asynchronously to Supabase through a queue. Failed items record their last attempt time and are skipped until an exponential backoff delay (1s×2^n + jitter) has elapsed, with auto-purge after 5 failures (`isReadyForRetry` in `src/lib/sync.ts`). All 5 tables are protected by PostgreSQL Row Level Security, and the sync pipeline rewrites locally-generated user IDs to match `auth.uid()` — fixing a real bug where RLS silently rejects every INSERT after sign-up. The streak engine respects habit frequency (daily / weekly / custom weekdays): continuity is judged on scheduled days only. 43 Jest tests across 3 suites cover streak boundaries, backoff gating, and store behavior.

---

## デモ / Demo

> **[ショーケースページ / Live Showcase](https://mer-prog.github.io/pulse-habit/docs/showcase.html)** — インタラクティブなモックアップ、機能ウォークスルー、擬似ストアページ。

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   TODAY.     │  │   HABITS.   │  │   STATS.    │  │   PROFILE   │
│             │  │             │  │             │  │             │
│  ◉ 3/5     │  │ 01 🏃 Jog  │  │  ▓▓▓▓░ 78% │  │  ○ mer-prog │
│  ████░░░░░ │  │ 02 📚 Read │  │             │  │  Theme: ◐   │
│             │  │ 03 🧘 Med  │  │  Streak: 45 │  │  Sync: ✓    │
│  🏃 Jog  ✓ │  │ 04 💧 H2O  │  │  Best: 45d  │  │             │
│  📚 Read ✓ │  │ 05 💻 Code │  │  Total: 847 │  │  Sign Out → │
│  🧘 Med  ✓ │  │             │  │             │  │             │
│  💧 H2O  · │  │  🔥23  🔥15 │  │  ▪▪▫▪▪▪▫   │  │             │
│  💻 Code · │  │             │  │  Feb 2026   │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

<a id="quick-start"></a>

## Quick Start

```bash
# 1. クローン / Clone
git clone https://github.com/mer-prog/pulse-habit.git
cd pulse-habit

# 2. 依存関係インストール / Install
#    react 19.1 と react-dom 19.2（jest-expo の peer 依存）の競合があるため
#    --legacy-peer-deps が必要 / required due to a react / react-dom peer conflict
npm ci --legacy-peer-deps

# 3. 環境変数の設定（任意 — Supabase なしでもオフラインで完全動作）
#    Configure environment (optional — works fully offline without Supabase)
cp .env.example .env
# .env に Supabase プロジェクト URL と anon key を記入

# 4. 起動 / Run
npx expo start
```

> **Supabase アカウントがなくても動きます。** アプリはローカル SQLite で完全に動作し、Supabase の認証情報を追加するとクラウド同期が自動で有効になります。 / The app works fully offline with local SQLite; cloud sync activates automatically when credentials are added.

### スクリプト / Available Scripts

| コマンド | 説明 |
|---------|------|
| `npm start` | Expo 開発サーバーを起動 |
| `npm run ios` / `npm run android` | シミュレータ / エミュレータで実行 |
| `npm run web` | Web 版を起動 |
| `npm test` | Jest テストスイートを実行（3 スイート・43 件） |
| `npm run lint` | ESLint を実行 |
| `npm run typecheck` | TypeScript strict 型チェック |

---

<a id="architecture"></a>

## アーキテクチャ / Architecture

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

**データフロー**: UI → Zustand → SQLite（即座） → Sync Queue → Supabase（非同期）。ユーザーはネットワークを待たない。 / **Data flow**: UI → Zustand → SQLite (instant) → Sync Queue → Supabase (async). The user never waits for the network.

---

## 主要機能 / Key Features

### 1. オフラインファースト同期パイプライン / Offline-First Sync Pipeline

ユーザーはオフラインでも習慣の作成、完了記録、統計閲覧がすべて可能。接続が戻れば自動で同期する。

```
ユーザーが「完了」をタップ
  → SQLite INSERT（即座）
  → sync_queue テーブルにエンキュー
  → SyncManager が認証セッションを検出（フォアグラウンド復帰時）
  → キューアイテムを順次処理
  → Supabase UPSERT を RLS 検証付きで実行
  → 成功: デキュー
  → 失敗: retry_count++ と失敗時刻を記録
  → 次回同期時: 1s×2^n＋ジッタの待機時間が経過するまでスキップ（指数バックオフ）
  → 5 回失敗: 古いアイテムを自動パージ
```

**難所**: SQLite はオフラインモード中にローカル生成の UUID を保存する。サインアップ後、これが `auth.uid()` と乖離する。書き換えなしだと RLS ポリシーが全 INSERT を拒否する。同期パイプラインでこれを解決:

```typescript
// sync.ts — Supabase INSERT 前の user_id 書き換え
if (data.user_id && data.user_id !== session.user.id) {
  data.user_id = session.user.id;
}
```

> **EN:** The hard part: SQLite stores a locally-generated UUID during offline mode. After sign-up it diverges from `auth.uid()`, and without a rewrite RLS rejects every INSERT. The sync pipeline rewrites `user_id` before each upload. Failed items record their last attempt time (`last_attempt_at`) and `isReadyForRetry()` gates them until the exponential backoff delay has elapsed.

### 2. Row Level Security（RLS）

API キーが漏洩しても他人のデータにはアクセス不可。セキュリティは PostgreSQL レベルで強制。 / Even with a leaked API key, no user can read another user's data — enforced server-side.

```sql
-- 直接所有権（habits, sync_queue）
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

-- 間接所有権（completions → habit 経由）
CREATE POLICY "Users can view own completions" ON completions
  FOR SELECT USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );
```

### 3. 頻度対応ストリークエンジン / Frequency-Aware Streak Engine

現在のストリーク、最長記録、達成率がタップした瞬間に更新される。計算は習慣の頻度設定を尊重する:

- **daily**: 毎日の連続を判定
- **weekly / custom**: `target_days`（曜日指定。例: 月・水・金）の**スケジュール日のみ**で連続性を判定。非スケジュール日はストリークを壊さず、オフ日の完了はストリークを増やしも壊しもしない
- 「今日が未完了」はその日が終わるまでストリークを壊さない（猶予）

> **EN:** Streaks respect the habit's frequency: a Mon/Wed/Fri habit stays on-streak across Tuesday and the weekend, and continuity is judged over scheduled days only. An uncompleted "today" does not break the streak until the day ends.

### 4. Neo-Brutalist デザインシステム / Custom Design System

UI ライブラリ不使用で 10 コンポーネントをゼロから構築。太ボーダー、オフセットシャドウ、モノスペースフォント。Light / Dark / System の 3 モード対応。

| コンポーネント | 用途 |
|-------------|------|
| `BrutalCard` | 3px 枠線 + 4px オフセットシャドウのコンテナ |
| `BrutalButton` | 押下時に translate アニメーション |
| `BrutalInput` | 太枠線スタイルのテキスト入力 |
| `BrutalCheckbox` | 触覚フィードバック付き完了トグル |
| `BrutalTag` | カラーバリアント対応のカテゴリバッジ |
| `BrutalProgress` | 枠線スタイルのプログレスバー |
| `StatBox` | 数値統計の表示（ストリーク、達成率） |
| `OffsetShadow` | 再利用可能なシャドウラッパー |
| `HatchPattern` | SVG 斜線パターンの背景 |
| `BrutalHabitCard` | ストリークリング付きの複合ハビットカード |

**テーマシステム**: `useTheme()` が Zustand の `settingsStore`（AsyncStorage で永続化）から読み取り、`useColorScheme()` でシステム設定に対応。Context Provider 不要 — 不要な再レンダリングなし。

### 5. 多言語対応 / Internationalization (i18n)

日本語 / 英語の完全切替対応 — アプリの再起動不要で即座に反映。

- **デバイス言語の自動検出**: `expo-localization` で初回起動時に自動判定（日本語環境 → `ja`、それ以外 → `en`）
- **設定画面からの手動切替**: JP / EN トグルボタン
- **Zustand settingsStore との双方向同期**: 言語変更が AsyncStorage 経由で永続化
- **ロケール別フォーマット**: 日付、カレンダーの曜日名・月名、ストリークテキストが選択言語に対応

---

## テスト / Tests

```bash
npm test
# Test Suites: 3 passed, 3 total
# Tests:       43 passed, 43 total
```

| スイート | 件数 | 検証内容 |
|---------|-----|---------|
| `streak.test.ts` | 20 | ストリーク境界値（月跨ぎ・年跨ぎ・gap・重複日）＋ 頻度対応（weekly / custom target_days / daily・オフ日完了の扱い・猶予日） |
| `sync.test.ts` | 13 | 指数バックオフの遅延計算とリトライ可否判定、**processSyncQueue がバックオフ未経過アイテムを実際にスキップすることの統合テスト**（Supabase モック） |
| `habitStore.test.ts` | 10 | Zustand ストアの実挙動（追加・更新・削除・アーカイブ・達成率） |

---

## 技術スタック / Tech Stack

| カテゴリ | 技術 | 選定理由 |
|---------|------|---------|
| フレームワーク | React Native 0.81 | iOS + Android クロスプラットフォーム |
| プラットフォーム | Expo SDK 54 | マネージドワークフロー、OTA アップデート |
| ナビゲーション | Expo Router v6 | ファイルベースルーティング（型安全） |
| 言語 | TypeScript (strict) | 全ソースファイルの型安全性 |
| 状態管理 | Zustand | セレクタベース再レンダリング、Provider 不要 |
| ローカル DB | expo-sqlite | 同期リード、オフライン永続化、ACID |
| バックエンド | Supabase | Auth、PostgreSQL、RLS |
| デザイン | カスタム（Neo-Brutalist） | 手作り 10 コンポーネント、ダークモード |
| 多言語対応 | i18next + react-i18next | 翻訳キー管理、補間、名前空間分離 |
| ロケール検出 | expo-localization | デバイス言語検出でデフォルトロケール決定 |
| フォント | Space Grotesk + Space Mono | ディスプレイ + モノスペースの組み合わせ |

---

## プロジェクト構成 / Project Structure

```
src/
├── app/                        # Expo Router 画面
│   ├── _layout.tsx             # ルートレイアウト + SyncManager
│   ├── (auth)/                 # サインイン / サインアップ
│   ├── (tabs)/                 # 4 タブナビゲーション
│   │   ├── index.tsx           # Today 画面 + FAB
│   │   ├── habits.tsx          # 習慣一覧
│   │   ├── stats.tsx           # 統計 + カレンダーヒートマップ
│   │   └── profile.tsx         # 設定 + テーマトグル
│   └── habit/
│       ├── new.tsx             # 3 ステップ作成ウィザード
│       └── [id].tsx            # 詳細 + 月間カレンダー
├── components/
│   ├── brutal/                 # デザインシステム（10 コンポーネント）
│   ├── habits/                 # BrutalHabitCard, StreakRing
│   └── common/                 # LoadingSpinner, Toast
├── constants/                  # theme.ts, config.ts
├── i18n/                       # i18next 初期化 + 翻訳 JSON（ja / en）
├── stores/                     # Zustand ストア（auth, habit, settings, toast）
├── hooks/                      # useHabits, useStreak, useSync, useNotifications
├── lib/
│   ├── database.ts             # SQLite CRUD + マイグレーション + ストリーク計算
│   ├── sync.ts                 # 同期パイプライン + バックオフ + コンフリクト解決
│   ├── supabase.ts             # クライアント初期化
│   └── errors.ts               # 型付きエラー階層
├── types/index.ts              # TypeScript インターフェース
└── __tests__/                  # Jest テスト（43 件）
```

---

## データベース設計 / Database Design

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
┌────────────────┐     ┌────────────────┐
│  sync_queue     │     │ sync_conflicts  │
│                 │     │                 │
│ table_name      │     │ local_data      │
│ operation       │     │ remote_data     │
│ data (JSONB)    │     │ resolved        │
│ retry_count     │     └─────────────────┘
│ last_attempt_at │
└─────────────────┘
```

| 判断 | 根拠 |
|------|------|
| `UNIQUE(habit_id, completed_date)` | 同じ日の重複完了を防止 — 冪等な同期に不可欠 |
| `streaks` を別テーブルに分離 | 読み取り毎の高コスト再計算を回避、書き込み時に更新 |
| `sync_queue` に JSONB + `last_attempt_at` | どのテーブルの変更でもキューイング可能。失敗時刻から指数バックオフの再試行可否を判定 |
| `habits` に `version` | マルチデバイス対応に向けた楽観的ロック |
| 全 FK に `ON DELETE CASCADE` | ユーザー削除時に関連データを自動クリーンアップ |

---

<a id="security"></a>

## セキュリティ / Security

### セルフ監査結果 / Self-Audit Results

本コードベースに対する静的コードレビューによる**セルフ監査**の結果（第三者監査ではない）:

| カテゴリ | 状態 | 詳細 |
|---------|------|------|
| ハードコードされた秘密鍵 / API キー | **PASS** | 全認証情報は環境変数経由。`.env` はコミットしない設計 |
| SQL インジェクション | **PASS** | 全クエリでパラメータバインド変数（`?`）を使用。PRAGMA のみ整数検証後に代入 |
| XSS | **N/A** | React Native の `Text` は HTML を描画しない |
| Row Level Security | **PASS** | 全 5 テーブルで所有権チェックを PostgreSQL レベルで強制 |
| ID 生成 | **NOTE** | 主経路は `crypto.getRandomValues()`。Web Crypto 非対応環境向けに `Math.random()` フォールバックが残存（既知の制限） |
| 入力バリデーション | **PASS** | 全ユーザー入力に長さ制限（名前 100 / 説明 500 / メール 254 文字） |
| パスワードポリシー | **PASS** | サインアップ時に最小 8 文字 + 大文字 + 数字を要求 |
| デバッグログのサニタイズ | **PASS** | 開発ログでユーザー ID を切り詰め表示 |
| 依存パッケージの脆弱性 | **NOTE** | 開発依存のみ（jest/babel）。本番ビルドへの影響なし |

> **EN:** This is a documented **self-audit** (static code review), not a third-party audit. ID generation uses `crypto.getRandomValues()` on the main path with a known-limitation `Math.random()` fallback for environments without Web Crypto.

### 脅威モデル / Threat Model

| 脅威 | 対策 |
|------|------|
| 不正なデータアクセス | 全 5 テーブルに RLS ポリシー — PostgreSQL レベルで強制 |
| セッションハイジャック | Supabase Auth の JWT リフレッシュトークン、セッション有効期限 |
| SQL インジェクション（ローカル） | expo-sqlite のバインド変数によるパラメータ化クエリ |
| 予測可能な ID | 主経路で `crypto.getRandomValues()`（フォールバックは上記 NOTE 参照） |
| 入力オーバーフロー | バリデーション制限: 名前 100 文字、説明 500 文字、メール 254 文字 |
| 接続不良時のデータ消失 | ローカルファースト SQLite + 指数バックオフ付き非同期 sync queue |

### 本番強化ロードマップ / Production Hardening Roadmap

| 強化項目 | 状況 |
|---------|------|
| 認証エンドポイントのレート制限 | 計画中 — Supabase 組み込み |
| メール認証フロー | 計画中 — Supabase でサポート済み |
| 証明書ピンニング | 計画中 — プロダクションビルド用 |
| 生体認証ロック | 計画中 — expo-local-authentication |

---

## 設計判断 / Design Decisions

| 判断 | 根拠 |
|------|------|
| **SQLite（AsyncStorage ではなく）** | リレーショナルクエリ（ストリーク計算の JOIN）、高速リード、ACID トランザクション |
| **Zustand（Redux/Context ではなく）** | ボイラープレート削減、セレクタベース再レンダリング、Provider ラッパー不要 |
| **Supabase（Firebase ではなく）** | PostgreSQL（RLS、正規リレーショナルモデル）、オープンソース、予測可能な料金体系 |
| **インラインスタイル（NativeWind ではなく）** | Neo-Brutalist のデザイントークンを完全制御。ユーティリティクラスが太ボーダー / シャドウパターンと競合 |
| **useTheme() フック（Context ではなく）** | Zustand セレクタが `themeMode` のみを購読 — テーマ変更でツリー全体の再レンダリングを回避 |
| **キューベース同期（リアルタイムではなく）** | ネットワーク断に対して耐性が高い。失敗はバックオフ付きリトライで回復 |
| **i18next（expo-localization 単体ではなく）** | 翻訳キーの名前空間分離、補間、複数形対応。expo-localization はロケール検出のみ |

---

## 環境変数 / Environment Variables

| 変数 | 必須 | 説明 |
|------|------|------|
| `EXPO_PUBLIC_SUPABASE_URL` | いいえ | Supabase プロジェクト URL（`https://<id>.supabase.co`） |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | いいえ | Supabase 公開 anon キー |

> 両方とも任意。設定なしでもオフラインモードで全機能が利用可能。 / Both optional — the app runs fully offline without them.

---

## ライセンス / License

[MIT](./LICENSE) — 自由に使用・改変・再配布可能。 / Free to use, modify, and distribute.

---

<p align="center">
  Built by <a href="https://github.com/mer-prog">mer-prog</a>
</p>
