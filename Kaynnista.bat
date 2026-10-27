@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  node tools\start-game.cjs
) else (
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools\start-game.cjs
)
if errorlevel 1 pause
