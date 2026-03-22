const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;

console.log("Electron main process started");
console.log("Is dev mode:", isDev);
console.log("App path:", app.getAppPath());
console.log("User data path:", app.getPath('userData'));

function createWindow() {
  console.log("Creating Electron window...");
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'build', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    show: false, // Don't show until ready
  });

  // Determine the start URL
  let startUrl;
  if (isDev) {
    startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  } else {
    // In production, use the built files
    startUrl = `file://${path.join(__dirname, 'build', 'index.html')}`;
  }

  console.log("Loading URL:", startUrl);
  win.loadURL(startUrl);

  win.once('ready-to-show', () => {
    console.log("Window ready to show");
    win.show();

    // Open DevTools in development
    if (isDev) {
      win.webContents.openDevTools();
    }
  });

  win.on('closed', () => {
    console.log("Window closed");
  });

  // Handle navigation errors
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (!isDev) {
      console.error('Make sure you have built the React app first with: npm run build');
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});