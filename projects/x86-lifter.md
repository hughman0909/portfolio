---
title: x86 Deobfuscation Lifter
number: 02
label: TOOL
subtitle: A lifter that makes obfuscated x86 binaries easier to analyze.
---
## Overview
難読化されたx86バイナリを解析しやすくするためのリフターです。

## Why
難読化に興味があり、難読化を解くツールに関して情報収集をしていると、リフターという存在がありました。これはx86等における機械語をLLVM IR等の中間言語に変換することで、難読化解除やリコンパイルし、解析をより簡単にしてくれるツールのことです。

詳しいものは以下の資料がわかりやすいです。
https://github.com/gmh5225/awesome-llvm-security/blob/main/.claude/skills/binary-lifting/SKILL.md

難読化解除ヘルパーが欲しいと感じていたので、作成しています。
公開予定はありません。

## Photos