import { useState, useEffect } from 'react';
import { MediaItem, MediaFolder, AppSettings } from '../types/app';
import { supabaseService } from '../lib/supabase';
import { useAuth } from './useAuth';

interface CloudSyncHook {
  syncToCloud: (localData: AppSettings, allMediaItems: MediaItem[]) => Promise<void>;
  loadFromCloud: () => Promise<{
    favoriteMedia: string[];
    favoriteSubreddits: string[];
    mediaFolders: MediaFolder[];
    favoriteMediaItems: MediaItem[];
  }>;
  addFavoriteMedia: (mediaId: string, mediaItem: MediaItem) => Promise<void>;
  removeFavoriteMedia: (mediaId: string) => Promise<void>;
  addFavoriteSubreddit: (subreddit: string) => Promise<void>;
  removeFavoriteSubreddit: (subreddit: string) => Promise<void>;
  createFolder: (name: string, color: string, mediaId?: string) => Promise<string>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  addToFolder: (folderId: string, mediaId: string, mediaItem: MediaItem) => Promise<void>;
  removeFromFolder: (folderId: string, mediaId: string) => Promise<void>;
  setFolderThumbnail: (folderId: string, thumbnailUrl: string) => Promise<void>;
  isSyncing: boolean;
}

export function useCloudSync(): CloudSyncHook {
  const { user, isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncToCloud = async (localData: AppSettings, allMediaItems: MediaItem[]) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    setIsSyncing(true);
    try {
      await supabaseService.syncLocalStorageToCloud(user.id, {
        favoriteMedia: localData.favoriteMedia,
        favoriteSubreddits: localData.favoriteSubreddits,
        mediaFolders: localData.mediaFolders,
      }, allMediaItems);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromCloud = async () => {
    if (!isAuthenticated || !user) {
      return {
        favoriteMedia: [],
        favoriteSubreddits: [],
        mediaFolders: [],
        favoriteMediaItems: [],
      };
    }

    try {
      setIsSyncing(true);
      const [favoriteMedia, favoriteSubreddits, mediaFolders, favoriteMediaItems] = await Promise.all([
        supabaseService.getFavoriteMedia(user.id),
        supabaseService.getFavoriteSubreddits(user.id),
        supabaseService.getFolders(user.id),
        supabaseService.getFavoriteMediaItems(user.id),
      ]);

      return {
        favoriteMedia,
        favoriteSubreddits,
        mediaFolders,
        favoriteMediaItems,
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const addFavoriteMedia = async (mediaId: string, mediaItem: MediaItem) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.addFavoriteMedia(user.id, mediaId, mediaItem);
  };

  const removeFavoriteMedia = async (mediaId: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.removeFavoriteMedia(user.id, mediaId);
  };

  const addFavoriteSubreddit = async (subreddit: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.addFavoriteSubreddit(user.id, subreddit);
  };

  const removeFavoriteSubreddit = async (subreddit: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.removeFavoriteSubreddit(user.id, subreddit);
  };

  const createFolder = async (name: string, color: string, mediaId?: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    const folderId = await supabaseService.createFolder(user.id, name, color);
    
    // Add initial media item if provided
    if (mediaId) {
      // Note: We would need the full media item here, but for now we'll handle this in the calling code
    }
    
    return folderId;
  };

  const deleteFolder = async (folderId: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.deleteFolder(user.id, folderId);
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.renameFolder(user.id, folderId, newName);
  };

  const addToFolder = async (folderId: string, mediaId: string, mediaItem: MediaItem) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.addMediaToFolder(folderId, mediaId, mediaItem);
  };

  const removeFromFolder = async (folderId: string, mediaId: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.removeMediaFromFolder(folderId, mediaId);
  };

  const setFolderThumbnail = async (folderId: string, thumbnailUrl: string) => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }

    await supabaseService.setFolderThumbnail(user.id, folderId, thumbnailUrl);
  };

  return {
    syncToCloud,
    loadFromCloud,
    addFavoriteMedia,
    removeFavoriteMedia,
    addFavoriteSubreddit,
    removeFavoriteSubreddit,
    createFolder,
    deleteFolder,
    renameFolder,
    addToFolder,
    removeFromFolder,
    setFolderThumbnail,
    isSyncing,
  };
}