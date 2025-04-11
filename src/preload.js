const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readCard: () => ipcRenderer.invoke('read-card')
});
