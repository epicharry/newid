/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    platform: string;
    versions: any;
    toggleFullscreen: () => Promise<boolean>;
    isFullscreen: () => Promise<boolean>;
  };
}