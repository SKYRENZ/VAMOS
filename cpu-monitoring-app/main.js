const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL('http://localhost:5173'); // Or your React URL

  // Disable the default menu
  Menu.setApplicationMenu(null);
});
