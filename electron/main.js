// Electron desktop wrapper for offline mode.
// Runs the Express API as a background process inside the Electron app,
// talking to a local MongoDB instance, and serves the built React frontend
// from the local filesystem. Same Mongoose models and API routes are reused
// unchanged — only MONGODB_URI differs from the cloud deployment.

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let apiProcess;

function startApiServer() {
  const backendEntry = path.join(__dirname, '..', 'backend', 'src', 'server.js');
  apiProcess = fork(backendEntry, [], {
    env: {
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_attendance',
      PORT: '5000',
      CORS_ORIGIN: 'file://'
    },
    silent: false
  });

  apiProcess.on('error', (err) => {
    console.error('[electron] Failed to start API process:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Serve the built frontend (run `npm run build` in /frontend first)
  const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  startApiServer();
  // Give the API a moment to bind before loading the UI
  setTimeout(createWindow, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (apiProcess) apiProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (apiProcess) apiProcess.kill();
});
