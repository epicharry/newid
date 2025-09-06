// Preload script for security
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you need to expose to the renderer process here
  platform: process.platform,
  versions: process.versions,
});

// Prevent the renderer process from accessing Node.js
delete window.require;
delete window.exports;
delete window.module;