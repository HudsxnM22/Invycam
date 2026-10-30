const { app, BrowserWindow, ipcMain, desktopCapturer, session, shell, screen } = require('electron');
const path = require('path');
const { startListenForKeys, updateKeyBinding } = require('./keyEventListener')
const util = require("./util");

let win;

function createWindow() {
  // frameless transparent window sized to cover the whole display instead of real fullscreen.
  // bounds (not workArea) so it covers the taskbar/dock/menu bar too
  const display = screen.getPrimaryDisplay();

  // Create the browser window
  win = new BrowserWindow({
    ...display.bounds, // x, y, width, height
    show: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    movable: false,
    enableLargerThanScreen: true, // macOS otherwise pushes the window below the menu bar
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
    if (process.platform === "darwin") {
      // pre-Lion "simple" fullscreen: covers the whole display including the menu bar,
      // without moving to its own Space or animating. keeps window coords == screen coords.
      win.setSimpleFullScreen(true)
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    }
    win.webContents.focus()
  })

  //for screen recording
  let selectedSourceId = 0;

  ipcMain.handle("get-screens", async () => {
      const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 320, height: 180 } });
      return sources.map((s) => ({ id: s.id, name: s.name, thumbnail: s.thumbnail.toDataURL() }));
  });

  ipcMain.handle("select-screen", (event, sourceId) => {
      selectedSourceId = sourceId;
  });

  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
          const chosen = sources.find((s) => s.id === selectedSourceId) ?? sources[0];  // fall back to the first screen
          callback({ video: chosen, audio: "loopback" });
      });
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

ipcMain.handle("open-external", (event, url) => {
    shell.openExternal(url);
});

// handles invycam:// links (oauth login). shared by windows/linux (second-instance) and macOS (open-url)
function handleDeepLink(deepLinkString) {
  const url = new URL(deepLinkString)
  if (url.pathname.includes('auth') || url.host === 'auth') {
    const token = url.searchParams.get('token')
    util.saveSecurityToken(token)
    if (win && !win.isDestroyed()) win.webContents.send('oauth-login-event')
  }

  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
}

// macOS delivers deep links to the running app through open-url instead of launching a second instance.
app.on('open-url', (event, deepLinkString) => {
  event.preventDefault()
  handleDeepLink(deepLinkString)
})

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // For browser opening events for when opened in browser via invycam:// such as oauth (windows/linux)
  app.on('second-instance', (event, commandLine) => {
    const deepLinkString = commandLine.find(arg => arg.startsWith('invycam://'))
    if (!deepLinkString) return
    handleDeepLink(deepLinkString)
  })

  app.whenReady().then(() => {
    createWindow()
    startListenForKeys(win)
  })
}

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

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('invycam', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('invycam')
}
