const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Splash screen listens for real server startup progress (0–100)
  onProgress: (callback) => {
    ipcRenderer.on('splash-progress', (_event, percent) => callback(percent));
  },
});
