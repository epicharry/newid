// Preload script for security
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you need to expose to the renderer process here
  platform: process.platform,
  versions: process.versions,
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  // Add error reporting
  reportError: (error) => {
    console.error('Renderer process error:', error);
  }
});

// Prevent the renderer process from accessing Node.js
delete window.require;
delete window.exports;
delete window.module;

// Add global error handler for the renderer process
window.addEventListener('error', (event) => {
  console.error('Global error in renderer:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in renderer:', event.reason);
});