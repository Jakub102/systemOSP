@echo off
cd /d "%~dp0OSPmobilka_App"
echo Instalowanie zaleznosci...
call npm install
echo Uruchamianie aplikacji...
call npx expo start
pause
