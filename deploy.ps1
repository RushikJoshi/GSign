# GSign Deployment Script for Windows RDP
Write-Host "------------------------------------------" -ForegroundColor Cyan
Write-Host "      GSign Deployment Script (RDP)       " -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# 1. Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed. Please install Node.js (v18 or higher)." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2. Setup Server .env
if (!(Test-Path "server/.env")) {
    Write-Host "[INFO] Creating server/.env from .env.example..." -ForegroundColor Yellow
    Copy-Item "server/.env.example" "server/.env"
    Write-Host "[WARNING] Please check server/.env and update your Database/Cloudinary credentials!" -ForegroundColor Magenta
}

# 3. Install Root Dependencies
Write-Host "[1/3] Installing root dependencies..." -ForegroundColor Yellow
npm install --no-audit --no-fund

# 4. Install Server Dependencies
Write-Host "[2/3] Installing server dependencies..." -ForegroundColor Yellow
Push-Location server
npm install --no-audit --no-fund
Pop-Location

# 5. Install Client Dependencies and Build
Write-Host "[3/3] Installing client dependencies and building frontend..." -ForegroundColor Yellow
Push-Location client
npm install --no-audit --no-fund
npm run build
Pop-Location

# 6. PM2 setup
if (!(Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "[INFO] Installing PM2 globally for process management..." -ForegroundColor Cyan
    npm install -g pm2
}

# 7. Start/Restart with PM2
Write-Host "[DONE] Starting GSign Server on port 4001..." -ForegroundColor Green
pm2 stop gsign-server 2>$null
pm2 delete gsign-server 2>$null
pm2 start server/src/server.js --name gsign-server --cwd .

# 8. Save PM2 list for auto-restart on reboot
pm2 save

Write-Host "------------------------------------------" -ForegroundColor Green
Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "Your project is now live on port 4001." -ForegroundColor Green
Write-Host "Local URL: http://localhost:4001" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Green
