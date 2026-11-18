writeups の書き方
==================

このフォルダと writeups.html・article.html は、サイト内で記事を表示するための保留中の仕組みです。
現在のトップページからは別サイト https://hughman0909.github.io/notes/ に遷移します。

1. このフォルダに .md ファイルを置くと writeups.html の一覧に出ます（一覧の編集は不要）。
   - Projects と同じく、記事ごとのフラットな一覧で表示します: writeups/<ファイル名>.md
   - 英語版は同じ場所に <ファイル名>.en.md を置きます（なければ日本語版を表示）。
   - 新しい日付ほど上に並びます。

2. ファイルの先頭に次のブロック（front matter）を書きます。英語版では省略した項目は日本語版の値を使います。

---
title: Sample
summary: 一行の要約
---

3. 本文で使える Markdown:
   # / ## / ### 見出し、- 箇条書き、1. 番号付きリスト、``` コードブロック、
   `code`、**太字**、[リンク](https://...)、![画像の説明](images/foo.png)
   画像は .md と同じフォルダからの相対パスで書けます。
   画像ファイルは writeups/images/ に置きます。
   例: writeups/images/analysis.png を本文に表示する場合:
   ![解析画面](images/analysis.png)
   記事ごとに images/my-writeup/ のようなサブフォルダを作っても使えます。

他のサイトで公開済みの記事は転載せず、このサイトで公開する記事だけを追加します。
現在の sample.md / sample.en.md は表示確認用です。

確認のしかた
-----------
- ローカル: `node dev.mjs` を実行して http://localhost:8000 を開く。保存すると自動で再読み込みされます。
  （index.html をダブルクリックして file:// で開くと writeups は読み込めません）
- 本番: main に push すれば GitHub Pages に反映されます（反映まで1分ほどかかることがあります）。

静的ホスティングで公開する前に node scripts/index-content.mjs を実行し、
index.json を更新してください。node dev.mjs では一覧が自動生成されます。
sample.md / sample.en.md はGit管理せず、ローカル確認時だけ表示されます。

Markdown対応範囲
----------------
見出し（1〜6）、太字・斜体・取り消し線、入れ子のリスト、引用、表、
チェックボックス、区切り線、リンク、画像、言語名付きコードの色分けに対応。
details / summary / kbd / mark / img などのHTMLも使えます。
スクリプト、iframe、任意のstyleやイベント属性は除去されます。
数式・Mermaidなどの独自拡張は未対応です。
使い方と表示例は sample.md / sample.en.md にまとめています（Git管理対象外）。
