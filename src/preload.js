import { contextBridge, ipcRenderer } from "electron";

contextBridge.executeInMainWorld("ipc", {
    send: (channel) => ipcRenderer.invoke(channel)
})