@echo off
REM Lance le simulateur Raid Party. Double-clic sur ce fichier = go.
REM
REM Installe les deps si necessaire, sync les JSON Unity, demarre Vite,
REM puis ouvre le navigateur sur http://localhost:5173 .
REM
REM Ctrl+C dans la fenetre pour arreter.

cd /d "%~dp0"

if not exist node_modules (
  echo [lancer-simu] Installation des dependances...
  call npm install
  if errorlevel 1 goto fail
)

echo [lancer-simu] Sync des donnees Unity...
call node scripts/sync-data.mjs
if errorlevel 1 goto fail

echo [lancer-simu] Demarrage du serveur + ouverture du navigateur...
start "" "http://localhost:5173"
call npm run dev

goto end

:fail
echo.
echo [lancer-simu] Echec. Verifie que Node.js est installe.
pause

:end
