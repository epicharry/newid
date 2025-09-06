const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object
let mainWindow;

// Function to clear all cache and storage
async function clearAppCache() {
  if (mainWindow && mainWindow.webContents) {
    const session = mainWindow.webContents.session;
    
    try {
      // Clear all cache
      await session.clearCache();
      
      // Clear all storage data
      await session.clearStorageData({
        storages: [
          'appcache',
          'cookies',
          'filesystem',
          'indexdb',
          'localstorage',
          'shadercache',
          'websql',
          'serviceworkers',
          'cachestorage'
        ]
      });
      
      console.log('✅ App cache and storage cleared successfully');
      
      // Reload the window to apply changes
      mainWindow.reload();
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }
}
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'), // You can place your icon here
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Disable web security for YouTube
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      plugins: true,
      allowDisplayingInsecureContent: true,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready
  });

  // Set user agent to mimic Chrome browser for YouTube compatibility
  const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  mainWindow.webContents.setUserAgent(chromeUserAgent);

  // Enable media playback features
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'geolocation', 'notifications', 'fullscreen'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Override permission checks for media
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media' || permission === 'camera' || permission === 'microphone') {
      return true;
    }
    return false;
  });

  // Intercept requests to modify headers for YouTube
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    // Add/modify headers to make requests look like they're coming from Chrome
    details.requestHeaders['User-Agent'] = chromeUserAgent;
    details.requestHeaders['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8';
    details.requestHeaders['Accept-Language'] = 'en-US,en;q=0.9';
    details.requestHeaders['Accept-Encoding'] = 'gzip, deflate, br';
    details.requestHeaders['DNT'] = '1';
    details.requestHeaders['Connection'] = 'keep-alive';
    details.requestHeaders['Upgrade-Insecure-Requests'] = '1';
    
    // Remove Electron-specific headers
    delete details.requestHeaders['Electron'];
    delete details.requestHeaders['electron'];
    
    callback({ requestHeaders: details.requestHeaders });
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (isDev) {
      mainWindow.webContents.openDevTools();
      
      // Add keyboard shortcut for cache clearing in development
      mainWindow.webContents.on('before-input-event', (event, input) => {
        // Ctrl+Shift+R or Cmd+Shift+R to clear cache and reload
        if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'r') {
          console.log('🧹 Clearing cache and reloading...');
          clearAppCache();
        }
      });
    }
  });

  // Handle media permissions and autoplay
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Override navigator properties to make it look more like Chrome
      Object.defineProperty(navigator, 'userAgent', {
        get: () => '${chromeUserAgent}'
      });
      
      // Enable autoplay for YouTube videos
      navigator.mediaDevices = navigator.mediaDevices || {};
      navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || function() {
        return Promise.resolve({});
      };
      
      // Override webdriver property that YouTube might check
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      // Add Chrome-specific properties
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5] // Fake plugins array
      });
      
      // Override platform if needed
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32'
      });
    `);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// App event listeners
app.whenReady().then(() => {
  // Clear cache on startup in development
  if (isDev) {
    console.log('🧹 Development mode: Clearing cache on startup...');
    setTimeout(() => {
      if (mainWindow) {
        clearAppCache();
      }
    }, 2000); // Wait 2 seconds for window to be ready
  }
  
  createWindow();
  
  // Disable the application menu completely
  Menu.setApplicationMenu(null);

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});