@echo off
setlocal EnableExtensions
chcp 65001 >nul
title 金鸢尾堡 · 启动器
cd /d "%~dp0"

set "PORT=4173"
set "URL=http://127.0.0.1:%PORT%/"
set "OPEN_BROWSER=1"
if /I "%~1"=="--no-browser" set "OPEN_BROWSER=0"

echo.
echo   ==============================================
echo    CASTELLUM AURELIAE   ·   金鸢尾堡
echo    本地 3D 城堡观览台 · 一键启动
echo   ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 goto :no_node

if not exist "node_modules\three\build\three.module.js" goto :no_deps

netstat -ano | findstr ":%PORT%" | findstr "LISTENING" >nul
if not errorlevel 1 goto :already_running

if "%OPEN_BROWSER%"=="1" goto :launch_with_browser

echo   以无浏览器模式启动（Ctrl+C 可停止）：
echo   %URL%
echo.
goto :run_server

:launch_with_browser
echo   正在启动本地服务，浏览器将在服务就绪后自动打开：
echo   %URL%
echo.
echo   关闭当前窗口即可停止本地服务。
echo.
goto :run_server

:run_server
node server.mjs
if errorlevel 1 goto :server_error
exit /b 0

:already_running
echo   检测到端口 %PORT% 已在监听。
echo   服务似乎已经启动，无需重复运行。
if "%OPEN_BROWSER%"=="1" (
  echo   正在打开浏览器……
  start "" "%URL%"
)
echo.
timeout /t 2 /nobreak >nul
exit /b 0

:no_node
echo   [错误] 未找到 Node.js。
echo   请先安装 Node.js 18 或更高版本，然后重试。
echo   https://nodejs.org/
echo.
pause
exit /b 1

:no_deps
echo   [错误] 未找到项目依赖。
echo   请在本目录执行以下命令安装依赖：
echo.
echo       pnpm install
echo.
pause
exit /b 1

:server_error
echo.
echo   [错误] 服务器异常退出。请检查上方日志。
echo.
pause
exit /b 1
