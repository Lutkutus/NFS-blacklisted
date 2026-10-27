@echo off
cd /d "%~dp0"
set "GAME_NODE="
for /f "delims=" %%i in ('where node 2^>nul') do if not defined GAME_NODE set "GAME_NODE=%%i"
if not defined GAME_NODE set "GAME_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-multiplayer.ps1" -NodePath "%GAME_NODE%"
if errorlevel 1 pause
