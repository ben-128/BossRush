@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:menu
echo.
echo ============================
echo  Git Helper - Boss Rush
echo ============================
echo  [1] Pull all (fetch + pull main)
echo  [2] Commit and push to main
echo  [Q] Quitter
echo ============================
set /p choice="Choix : "

if /i "%choice%"=="1" goto pull
if /i "%choice%"=="2" goto push
if /i "%choice%"=="q" goto end
echo Choix invalide.
goto menu

:pull
echo.
echo --- git fetch --all ---
git fetch --all --prune
echo.
echo --- git pull ---
git pull
echo.
pause
goto menu

:push
echo.
echo --- git status ---
git status
echo.
set /p msg="Message de commit : "
if "!msg!"=="" (
  echo Message vide, abandon.
  pause
  goto menu
)
echo.
echo --- git add -A ---
git add -A
echo.
echo --- git commit ---
git commit -m "!msg!"
if errorlevel 1 (
  echo Commit echoue ou rien a committer.
  pause
  goto menu
)
echo.
echo --- git push origin main ---
git push origin main
echo.
pause
goto menu

:end
endlocal
