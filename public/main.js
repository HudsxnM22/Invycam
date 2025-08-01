const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
  // Create the browser window
  win = new BrowserWindow({
    transparent: true,
    frame: false, //gotta make an X button
    fullscreen: true,
    minimizable: false,
    alwaysOnTop: true,
    resizable: false
  });

  win.setIgnoreMouseEvents(true); //TEST
  // Load the React app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // In development, load from the dev server
    win.loadURL('http://localhost:3000');
  } else {
    // In production, load the built files
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

ipcMain.handle('enable-focus', async () => {
  if(win.isDestroyed() || !win)
    return {success: false}
  win.setFocusable(true)

  return {success: true}
})

ipcMain.handle('disable-focus', async () => {
  if(win.isDestroyed() || !win)
    return {success: false}
  win.setFocusable(false)

  return {success: true}
})

ipcMain.handle('close-app', async () => {
  app.quit()
})

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
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