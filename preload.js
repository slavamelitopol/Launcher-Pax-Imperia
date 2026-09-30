const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setRam: ram => ipcRenderer.invoke('settings:ram', ram),
  getAccount: () => ipcRenderer.invoke('account:get'),
  login: () => ipcRenderer.invoke('account:login'),
  logout: () => ipcRenderer.invoke('account:logout'),
  launch: () => ipcRenderer.invoke('game:launch'),
  openFolder: () => ipcRenderer.send('open:folder'),
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  on: (channel, cb) => ipcRenderer.on(channel, (_e, data) => cb(data))
});
