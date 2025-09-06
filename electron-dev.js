const { spawn } = require('child_process');
const { app } = require('electron');

// Development script to run Vite dev server and Electron together
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  process.env.NODE_ENV = 'development';
  
  // Start Vite dev server
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  // Wait for Vite to be ready, then start Electron
  setTimeout(() => {
    const electronProcess = spawn('electron', ['.'], {
      stdio: 'inherit',
      shell: true
    });

    electronProcess.on('close', () => {
      viteProcess.kill();
      process.exit();
    });
  }, 3000);

  viteProcess.on('close', () => {
    process.exit();
  });
}