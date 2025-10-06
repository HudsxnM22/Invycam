const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipc", {
    closeApp: () => ipcRenderer.invoke("close-app"),
    enterOperationMode: () => ipcRenderer.invoke("disable-focus"),
    exitOperationMode: () => ipcRenderer.invoke("enable-focus"),
    openMenu: (callbackEvent) => {
        ipcRenderer.on('open-menu', () => {
            ipcRenderer.invoke("enable-focus")
            callbackEvent()
        })
    }
})
