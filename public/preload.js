const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipc", {
    closeApp: () => ipcRenderer.invoke("close-app"),
    enterOperationMode: () => ipcRenderer.invoke("disable-focus"),
    exitOperationMode: () => ipcRenderer.invoke("enable-focus"),
    openMenu: (callbackEvent) => {
        const handler = () => callbackEvent();

        ipcRenderer.on("open-menu", handler);

        return () => {
            ipcRenderer.removeListener("open-menu", handler);
        };
    },
    getKeyBindings: () => ipcRenderer.invoke("get-key-bindings"),
    setKeyBinding: (action, key) => ipcRenderer.invoke("set-key-binding", action, key),
    saveSecurityToken: (token) => ipcRenderer.invoke("save-security-token", token),
    getSecurityToken: () => ipcRenderer.invoke("get-security-token"),
    clearSecurityToken: () => ipcRenderer.invoke("clear-security-token"),
    openExternal: (url) => ipcRenderer.invoke("open-external", url),
    OauthLoginEvent: (callbackEvent) => {
        const handler = () => {
            ipcRenderer.invoke("enable-focus")
            callbackEvent();
        }
        
        ipcRenderer.on("oauth-login-event", handler);

        return () => {
            ipcRenderer.removeListener("oauth-login-event", handler)
        }
    },
    // preload.js: add to your existing window.ipc object
    getScreens: () => ipcRenderer.invoke("get-screens"),
    selectScreen: (sourceId) => ipcRenderer.invoke("select-screen", sourceId),
})
