@echo off
rem ===========================================================================
rem  見ながら書く（Windows）
rem  --------------------------------------------------------------------------
rem  **これをダブルクリックするだけ。** 3 つが一度に立ち上がる。
rem
rem    1. 作り直し（--watch）… content/ と themes/ を見ていて、保存のたびに作る
rem    2. サーバ           … http://127.0.0.1:5199/
rem    3. ブラウザ
rem
rem  止めるときは、開いた 2 つの黒い窓をそれぞれ閉じるか Ctrl+C。
rem
rem  **日本語を出すために chcp 65001 を先に打っている。**
rem  これが無いと、この窓の字が化ける（このファイルは UTF-8 で置いてある）。
rem ===========================================================================
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js が見つかりません。
  echo   https://nodejs.org/ja から「推奨版」を入れてください（v20 以上）。
  echo.
  pause
  exit /b 1
)

echo.
echo   まず一度、ぜんぶ作ります…
echo.
call node tools\build.mjs
if errorlevel 1 (
  echo.
  echo   × 作れませんでした。上に出ている理由を見てください。
  echo.
  pause
  exit /b 1
)

rem **窓を分ける。** 作り直しのほうは、足りない字などを教えてくるので、
rem サーバの記録に混ぜると読み落とす
start "sawaya studio - 作り直し" cmd /k node tools\build.mjs --watch
start "sawaya studio - サーバ"   cmd /k node tools\serve.mjs

rem サーバが立ち上がるまで少し待ってから開く
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:5199/

echo.
echo   立ち上がりました。
echo.
echo     見るところ : http://127.0.0.1:5199/
echo     書くところ : content\ の中の .md
echo     手順       : content\_手順.md
echo.
echo   保存するたびに作り直されます。ブラウザを読み直してください。
echo   止めるときは、開いた 2 つの窓を閉じてください。
echo.
timeout /t 6 /nobreak >nul
