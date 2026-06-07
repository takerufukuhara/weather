# Weather

卒業研究用に開発した天候情報を活用した行動提案システムです。

## 概要

<!-- 後で追記予定 -->

## 主な機能

- メールアドレスとパスワードによるユーザー認証
- 家事、持ち物、住環境設備、外出スケジュールの入力
- 入力内容の Supabase への保存
- Open-Meteo API からの天候データ取得
- 天候データとユーザー入力に基づく行動提案の生成
- 生成した提案結果の Supabase への保存

## 使用技術

- React
- TypeScript
- React Router
- React Hook Form
- Supabase
- Open-Meteo API
- OpenAI API

## 公開URL

以下のURLからアプリにアクセスできます。

```text
https://sotuken-evcs.vercel.app/
```

利用にはログインが必要です。

## ディレクトリ構成

```text
.
├── public/
├── src/
│   ├── api/
│   │   └── weather.ts
│   ├── components/
│   │   ├── Auth.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── SlotEditor.tsx
│   │   └── UserInputPage.tsx
│   ├── hooks/
│   │   ├── useActivitySuggestions.ts
│   │   └── useUserInfoForm.ts
│   ├── styles/
│   │   └── index.css
│   ├── App.tsx
│   ├── index.tsx
│   └── supabaseClient.ts
├── package.json
└── README.md
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` を作成し、以下の値を設定します。

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

### 3. 開発サーバーの起動

```bash
npm start
```

起動後、ブラウザで以下にアクセスします。

```text
http://localhost:3000
```

## 利用方法

1. アカウントを作成、またはログインします。
2. 天候に左右される家事、持ち物、住環境設備を入力します。
3. 今日と明日の外出スケジュールを入力します。
4. 提案を生成します。
5. 必要に応じて、生成された提案結果を保存します。

## Supabase で利用するデータ

このシステムでは、主に以下のデータを Supabase に保存します。

- ユーザープロフィール
- 家事設定
- 持ち物設定
- 外出スケジュール
- 住環境設備の有無
- 生成された行動提案

## 利用可能なスクリプト

### `npm start`

開発サーバーを起動します。

### `npm run build`

本番用のビルドを作成します。

### `npm test`

テストランナーを起動します。

## 備考

- 本システムは卒業論文での利用を目的としたアプリケーションです．
- 天候データは Open-Meteo API から取得します。
- 行動提案の生成には OpenAI API を利用します。
