# Deployment Guide for RDP (Windows Server)

This project is configured to run on port **4001** and serve both the backend API and the frontend client from a single process.

## Prerequisites
- **Node.js** (v18 or higher) installed on the server.
- **Git** installed on the server.

## Steps to Deploy

1. **Pull the latest code**:
   ```powershell
   git pull origin main
   ```

2. **Run the deployment script**:
   Open PowerShell as Administrator in the project root and run:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope Process
   ./deploy.ps1
   ```

3. **Configure Environment Variables**:
   If this is the first time, the script will create a `server/.env` file. Open it and update your credentials:
   - `MONGO_URI`: Your MongoDB connection string.
   - `CLOUDINARY_*`: Your Cloudinary credentials.
   - `SMTP_*`: Your email server credentials.

4. **Restart the server**:
   After updating `.env`, restart the process using PM2:
   ```powershell
   pm2 restart gsign-server
   ```

## Managing the Process
- **Check Status**: `pm2 status`
- **View Logs**: `pm2 logs gsign-server`
- **Stop Server**: `pm2 stop gsign-server`
- **Start Server**: `pm2 start gsign-server`

## Port Configuration
The backend is set to run on port **4001** as requested. Ensure this port is open in the Windows Firewall on your RDP server.
