const { app, BrowserWindow, ipcMain, desktopCapturer, session } = require('electron');
const path = require('path');
const { startListenForKeys, updateKeyBinding } = require('./keyEventListener')
const util = require("./util");

let win;

function createWindow() {
  // Create the browser window
  win = new BrowserWindow({
    show: false,
    transparent: true,
    frame: false,
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

  // Show and activate the window only once its first frame is ready.
  win.once('ready-to-show', () => {
    win.setFocusable(true)
    win.setIgnoreMouseEvents(false)
    win.show()
    win.setAlwaysOnTop(true, 'screen-saver')
    win.moveTop()
    win.focus()
    win.webContents.focus()
  })

  //for screen recording
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' })
    })
  }, { useSystemPicker: false });

  //win.setIgnoreMouseEvents(true); //TEST
  //win.webContents.openDevTools()
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
  if(!win || win.isDestroyed())
    return {success: false}
  win.setFocusable(true)
  win.setIgnoreMouseEvents(false, {forward: false})
  win.show()
  win.setAlwaysOnTop(true, 'screen-saver')
  win.moveTop()
  win.focus()
  win.webContents.focus()

  return {success: true}
})

ipcMain.handle('disable-focus', async () => {
  if(!win || win.isDestroyed())
    return {success: false}
  win.setFocusable(false)
  win.setIgnoreMouseEvents(true, {forward: true})
  win.setAlwaysOnTop(true, 'screen-saver')
  win.moveTop()

  return {success: true}
})

ipcMain.handle('close-app', async () => {
  app.quit()
})

ipcMain.handle("get-key-bindings", () => {
    return util.getKeyBindings();
});

ipcMain.handle("set-key-binding", (event, action, key) => {
    util.setKeyBinding(action, key);
    if (action === "changeMode") {
        updateKeyBinding(key);
    }
    return { success: true };
});

ipcMain.handle("save-security-token", (event, token) => {
    util.saveSecurityToken(token);
    return { success: true };
});

ipcMain.handle("get-security-token", () => {
    const token = util.getSecurityToken();
    return { token };
});

ipcMain.handle("clear-security-token", () => {
    util.clearSecurityToken();
    return { success: true };
});

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
