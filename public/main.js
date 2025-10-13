const { app, BrowserWindow, ipcMain, desktopCapturer, session } = require('electron');
const path = require('path');
const { startListenForKeys } = require('./keyEventListener')

let win;

function createWindow() {
  // Create the browser window
  win = new BrowserWindow({
    transparent: true,
    frame: false, //gotta make an X button
    fullscreen: true,
    minimizable: false,
    alwaysOnTop: true,
    resizable: false,
    titleBarOverlay: false,
    titleBarStyle: 'hidden',

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      //to use the recording cropping
      additionalArguments: [
        '--enable-experimental-web-platform-features',
        '--enable-features=RegionCapture',
        '--disable-features=VizDisplayCompositor'
      ]
    }
  });

  //for screen recording
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' })
    })
  }, { useSystemPicker: false });

  //win.setIgnoreMouseEvents(true); //TEST
  win.webContents.openDevTools()
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
  win.setIgnoreMouseEvents(false, {forward: false})

  return {success: true}
})

ipcMain.handle('disable-focus', async () => {
  if(win.isDestroyed() || !win)
    return {success: false}
  win.setFocusable(false)
  win.setIgnoreMouseEvents(true, {forward: true})

  return {success: true}
})

ipcMain.handle('close-app', async () => {
  app.quit()
})

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()
  startListenForKeys(win)
});

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