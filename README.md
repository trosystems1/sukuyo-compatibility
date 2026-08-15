# 宿曜相性占いツール

竹本光晴堂（kosei-do.co.jp）の宿曜占星術サイト用、相性診断ツールです。

## ファイル構成
```
.
├── index.html          ← ツール本体（HTML/CSS/JS単一ファイル）
├── senseiban.html      ← 占星盤の補助ページ
├── sukuyo-about.html   ← 宿曜占星術の解説ページ
├── assets/             ← フォント・画像などの静的アセット
├── www/                ← Capacitor/iOS用に同期された静的ファイル
├── middleware.js       ← Basic認証（Vercel Routing Middleware）
├── capacitor.config.json
├── package.json        ← Capacitor同期・iOS起動用スクリプト
└── vercel.json         ← Vercel静的配信設定（検索エンジン非表示など）
```

Next.js/Reactアプリではなく、ビルドなしで動く静的HTML/JSアプリです。

## 公開こよみ（今日の宿曜）

`index.html#daily` で、今日めぐる27宿、その日の過ごし方、向く行動、注意点を確認できます。日付は新暦を大きく表示し、同じ計算ロジックから取得した旧暦日付も併記します。
本番でログインなしに共有する公開URLは、middleware から判別できる query route を使います。今日の宿曜は `index.html?daily=today`、各宿の公開リファレンスは `index.html?daily=昴宿` のように開けます。画面内ナビゲーション用の `#daily` / `#daily=昴宿` も同じテンプレートとデータを使います。

この公開こよみは、その日の宿の一般的な空気を示すものです。各宿の公開リファレンスは「○○宿とは」として宿そのものの性質を説明し、日々の吉凶や個人運は断定しません。個人にとっての吉凶は本人の本命宿との関係で変わるため、生年月日入力なしには断定しません。

## ロジックの要点

- 本命宿の計算は新暦→日本の旧暦（JST基準）変換をベースにしている
- 旧暦は `index.html` 内の朔テーブル（1899–2100年）で算出する。中国農暦（UTC+8）ライブラリは使わない（朔がJST 0時台の月で1日ずれるため）
- 旧暦の各月1日の宿は固定（1月=室、2月=奎…12月=虚）、月内は+1で進む
- 検証済み確定値：1962/3/22→底宿、1975/8/11→亢宿、1973/1/1→箕宿、1976/12/8→井宿

## ローカル開発（Cursor等での編集）

`index.html` を直接ブラウザで開いて確認できます（外部計算ライブラリ不要）。
補助ページは `senseiban.html` と `sukuyo-about.html` です。

iOS/Capacitor側へ反映する場合は、ルートの静的ファイルを `www/` に同期します。

```bash
npm run sync:www
```

変更したら git commit → push するだけで、Vercel側が静的サイトとして自動的に再デプロイします。

```bash
git add .
git commit -m "変更内容"
git push
```

## 自動テスト

宿曜計算の回帰テストは Node.js で実行できます。`index.html` の計算ロジックを読み込み、README記載の確定値と公開こよみ用27宿データの網羅性を検証します。

```bash
npm test
```

## Basic認証

`middleware.js` が通常パスにBasic認証を適用します。公開こよみ用の `?daily` query route だけはログインなしで閲覧できる例外です。認証情報はVercelの環境変数
`BASIC_AUTH_USER` / `BASIC_AUTH_PASS` で上書きする運用です。コード内にはローカル用の
フォールバック値がありますが、ドキュメントには値を書かず、本番では環境変数を必ず設定してください。

- Settings → Environment Variables
- `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` を設定 → 再デプロイ

## 動作確認用テストケース

- 1962/3/22 → 底宿
- 1976/12/8 → 井宿（中国農暦だと鬼宿になり誤る境界日）
- 1975/8/11 → 亢宿
- 1973/1/1 → 箕宿
