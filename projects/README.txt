projects の書き方
==================

このフォルダに .md ファイルを置くと Projects の一覧に自動で表示されます。
content.js や一覧の編集は不要です。number の小さい順に並びます。
ファイル名が記事のIDになります。名前を変えると記事URLも変わります。

例: projects/my-project.md

---
title: My Project
number: 04
label: TOOL
subtitle: プロジェクトの短い紹介
repo: https://github.com/example/my-project
---
## Overview
プロジェクトの説明。

## Key work
- 実装したこと
- 工夫したこと

## Notes
補足など。

front matter の項目
------------------
- title: タイトル（省略時はファイル名）
- number: 表示順と記事上部の番号（01、02、03…）
- label: 記事上部の種類（TOOL、LAB、WORKSHOP など。省略可）
- subtitle: 一行の概要（省略可）
- repo: ソースコードのURL（省略可）
- demo: デモのURL（省略可）

本文では見出し、箇条書き、番号付きリスト、コードブロック、
インラインコード、太字、リンク、画像を使えます。
画像は .md と同じフォルダからの相対パスで指定できます。
画像ファイルは projects/images/ に置きます。
例: projects/images/my-project.png を本文に表示する場合:
![プロジェクトの画面](images/my-project.png)
記事ごとに images/my-project/ のようなサブフォルダを作っても使えます。

英語版
------
同じ場所に my-project.en.md を置きます。
英語版で省略したfront matterの項目は日本語版の値を使います。
英語版のファイルがなければ日本語版を表示します。

確認のしかた
------------
node dev.mjs を実行して http://localhost:8000 を開きます。
保存すると自動で再読み込みされます。
本番は main に push すると GitHub Pages に反映されます。

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
