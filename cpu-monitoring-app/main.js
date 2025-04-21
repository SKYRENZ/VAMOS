const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 800,
    resizable: false, // Make the window non-resizable
    icon: 'Logo.ico', // Path to your icon file
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Ensure isolation is disabled if needed
      zoomFactor: 1.0 // Prevent scaling issues
    }
  });

  mainWindow.loadURL('http://localhost:5173'); // Or your React URL

  // Disable the default menu
  Menu.setApplicationMenu(null);
});

// Ensure DPI scaling is consistent
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');