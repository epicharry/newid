# AriPink Desktop Application

A premium multimedia viewer and organizer built with Electron and React.

## 🚀 Development

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Run in development mode (starts both Vite dev server and Electron)
npm run electron:dev

# Or run separately:
npm run dev          # Start Vite dev server
npm run electron     # Start Electron (after dev server is running)
```

## 📦 Building for Production

### Build for Windows (EXE)
```bash
npm run build:win
```
This creates:
- `dist-electron/AriPink Setup 1.0.0.exe` - Installer
- `dist-electron/win-unpacked/` - Unpacked application

### Build for macOS (DMG)
```bash
npm run build:mac
```
This creates:
- `dist-electron/AriPink-1.0.0.dmg` - macOS installer
- `dist-electron/mac/` - Unpacked application

### Build for Linux (AppImage)
```bash
npm run build:linux
```
This creates:
- `dist-electron/AriPink-1.0.0.AppImage` - Linux portable app

### Build for All Platforms
```bash
npm run electron:dist
```

## 🎨 Customization

### App Icon
1. Place your icon file as `electron/assets/icon.png`
2. Recommended sizes: 256x256, 512x512, or 1024x1024 PNG
3. The build process will automatically generate platform-specific icons

### App Information
Edit the following in `package.json`:
- `build.appId` - Unique app identifier
- `build.productName` - Display name
- `build.win.publisherName` - Publisher name for Windows

## 🔧 Configuration

### Window Settings
Edit `electron/main.js` to customize:
- Window size and minimum size
- Window behavior
- Menu structure
- Security settings

### Build Settings
Edit `package.json` under the `build` section to customize:
- Output directory
- Target platforms
- Installer options
- File associations

## 📁 Project Structure
```
├── electron/
│   ├── main.js          # Main Electron process
│   ├── preload.js       # Preload script for security
│   └── assets/          # App icons and resources
├── src/                 # React application source
├── dist/                # Built web application
├── dist-electron/       # Built Electron applications
└── package.json         # Dependencies and build config
```

## 🛡️ Security Features
- Context isolation enabled
- Node integration disabled
- Remote module disabled
- External link handling
- Certificate error handling
- Secure preload script

## 📋 Available Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build web application
- `npm run electron` - Start Electron (production mode)
- `npm run electron:dev` - Start both Vite and Electron (development)
- `npm run electron:pack` - Build and package for current platform
- `npm run electron:dist` - Build for all platforms
- `npm run build:win` - Build Windows executable
- `npm run build:mac` - Build macOS application
- `npm run build:linux` - Build Linux AppImage

## 🚀 Distribution
After building, you'll find the distributable files in the `dist-electron/` directory:
- Windows: `.exe` installer and unpacked folder
- macOS: `.dmg` installer and `.app` bundle
- Linux: `.AppImage` portable executable