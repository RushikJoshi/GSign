@echo off
echo ==========================================
echo SignFlow RDP Deployment Setup
echo ==========================================

echo [1/4] Installing Root Dependencies...
call npm install

echo [2/4] Installing Client and Server Dependencies...
call npm run install:all

echo [3/4] Building Client for Production...
call npm run build:client

echo [4/4] Setup Complete!
echo.
echo To start the server, run: npm start
echo.
echo IMPORTANT: Make sure to update your server/.env file:
echo - Set PORT (default 5000)
echo - Set MONGO_URI
echo - Set CLIENT_URL and APP_BASE_URL to your Server IP/Domain
echo.
pause
