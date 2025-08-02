const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log("Electron main process started");

function createWindow() {
  console.log("Creating Electron window...");
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;
  const startUrl = isDev
    ? process.env.ELECTRON_START_URL || 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build', 'index.html')}`;
  console.log("Loading URL:", startUrl);
  win.loadURL(startUrl);

  win.on('ready-to-show', () => {
    console.log("Window ready to show");
    win.show();
  });

  win.on('closed', () => {
    console.log("Window closed");
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