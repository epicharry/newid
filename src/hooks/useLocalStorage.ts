import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      
      const parsed = JSON.parse(item);
      
      // Ensure array properties are always arrays for AppSettings
      if (key === 'mediaVault_settings' && parsed && typeof parsed === 'object') {
        // Migrate old folder format to new format
        const migratedFolders = Array.isArray(parsed.mediaFolders) 
          ? parsed.mediaFolders.map((folder: any) => ({
              ...folder,
              mediaItems: folder.mediaItems || [], // Use new format or empty array
            }))
          : [];
        
        return {
          ...parsed,
          favoriteMedia: Array.isArray(parsed.favoriteMedia) ? parsed.favoriteMedia : [],
          favoriteSubreddits: Array.isArray(parsed.favoriteSubreddits) ? parsed.favoriteSubreddits : [],
          mediaFolders: migratedFolders,
          selectedYouTubeVideos: Array.isArray(parsed.selectedYouTubeVideos) ? parsed.selectedYouTubeVideos : []
        } as T;
      }
      
      return parsed;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}