@echo off
setlocal
cd /d "%~dp0"
title Raahat Portal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-raahat.ps1"
if errorlevel 1 pause
endlocal
exit /b
