@echo off
REM Puja TOTA la carpeta a GitHub. Doble clic i llest.
cd /d "%~dp0"
set MSG=%*
if "%MSG%"=="" set MSG=Actualitzacio web
git add -A
git commit -m "%MSG%"
git push origin main
echo.
echo ==== FET. La web s'actualitza en 1-2 minuts ====
pause
