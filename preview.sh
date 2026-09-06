#!/bin/sh
# ===========================================================================
#  見ながら書く（Mac / Linux）
#  --------------------------------------------------------------------------
#      chmod +x preview.sh     ← はじめの 1 回だけ
#      ./preview.sh
#
#  3 つが一度に立ち上がる。
#
#    1. 作り直し（--watch）… content/ と themes/ を見ていて、保存のたびに作る
#    2. サーバ           … http://127.0.0.1:5199/
#    3. ブラウザ
#
#  **止めるのは Ctrl+C 一回だけ。** サーバも一緒に落ちる（trap で始末している）。
# ===========================================================================
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js が見つかりません。"
  echo "  https://nodejs.org/ja から「推奨版」を入れてください（v20 以上）。"
  echo
  exit 1
fi

echo
echo "  まず一度、ぜんぶ作ります…"
echo
node tools/build.mjs

# サーバを後ろで動かす。**この窓を閉じるときは一緒に落とすこと。**
# 落とし忘れると 5199 番が塞がったままになり、次に立ち上げられなくなる
node tools/serve.mjs &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null; echo; echo "  止めました。"; exit 0' INT TERM EXIT

# 立ち上がるまで少し待ってから開く
sleep 1
URL="http://127.0.0.1:5199/"
if command -v open >/dev/null 2>&1; then open "$URL"          # Mac
elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" # Linux
else echo "  ブラウザで開いてください: $URL"
fi

cat <<EOS

  立ち上がりました。

    見るところ : $URL
    書くところ : content/ の中の .md
    手順       : content/_手順.md

  保存するたびに作り直されます。ブラウザを読み直してください。
  止めるときは Ctrl+C。

EOS

# 作り直しを前で動かす。ここで待つので、Ctrl+C が効く
node tools/build.mjs --watch
