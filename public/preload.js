const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipc", {
    closeApp: () => ipcRenderer.invoke("close-app")
})
