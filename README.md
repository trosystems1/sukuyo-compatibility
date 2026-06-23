# 宿曜相性占いツール

竹本光晴堂（kosei-do.co.jp）の宿曜占星術サイト用、相性診断ツールです。

## ファイル構成
```
.
├── index.html       ← ツール本体（HTML/CSS/JS単一ファイル）
├── middleware.js     ← Basic認証（Vercel Routing Middleware）
├── package.json      ← ESモジュール指定のための設定
└── vercel.json       ← Vercel設定（検索エンジン非表示など）
```

## ロジックの要点

- 本命宿の計算は新暦→旧暦変換（`lunar-javascript`をCDN経由で読み込み）をベースにしている
- 旧暦の各月1日の宿は固定（1月=室、2月=奎…12月=虚）、月内は+1で進む
- 検証済み確定値：1962/3/22→底宿、1975/8/11→亢宿、1973/1/1→箕宿

## ローカル開発（Cursor等での編集）

`index.html` を直接ブラウザで開いて確認できます（CDN読み込みのため要インターネット接続）。
変更したら git commit → push するだけで、Vercel側が自動的に再デプロイします。

```bash
git add .
git commit -m "変更内容"
git push
```

## Basic認証

`middleware.js` にデフォルト値がありますが、本番では必ずVercelダッシュボードの
環境変数で上書きしてください：

- Settings → Environment Variables
- `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` を設定 → 再デプロイ

## 動作確認用テストケース

- 1962/3/22 → 底宿
- 1975/8/11 → 亢宿
- 1973/1/1 → 箕宿
