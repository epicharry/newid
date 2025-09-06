import React, { useState, useEffect } from 'react';
import { MediaItem, MediaSource, ThemeMode, AppSettings, RedditSortType, SubredditInfo, MediaFilter, MediaFolder, ViewerSession } from './types/app';
import { redditApi } from './services/redditApi';
import { rule34Api } from './services/rule34Api';
import { SourceSelector } from './components/SourceSelector';
import { SubredditInput } from './components/SubredditInput';
import { Rule34Input } from './components/Rule34Input';
import { MediaGrid } from './components/MediaGrid';
import { MediaViewer } from './components/MediaViewer';
import { Header } from './components/Header';
import { FavoritesView } from './components/FavoritesView';
import { FoldersView } from './components/FoldersView';
import { FeedPage } from './components/FeedPage';
import { YouTubeInput } from './components/YouTubeInput';
import { YouTubeMultiViewer } from './components/YouTubeMultiViewer';
import { AuthModal } from './components/AuthModal';
import { GlobalSidebar } from './components/GlobalSidebar';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { useCloudSync } from './hooks/useCloudSync';
import { useViewerSessions } from './hooks/useViewerSessions';
import { AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settings, setSettings] = useLocalStorage<AppSettings>('mediaVault_settings', {
    theme: 'light',
    selectedSource: null,
    favoriteSubreddits: [],
    favoriteMedia: [],
    mediaFolders: [],
    defaultSort: 'hot',
    mediaFilter: 'all',
    youtubeApiKey: 'AIzaSyB1t40Vu0QDO1bqhnK76sByujGr0NIFH8g',
    selectedYouTubeVideos: [],
  });
  
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [favoriteMediaItems, setFavoriteMediaItems] = useState<MediaItem[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [currentSearchSort, setCurrentSearchSort] = useState<string>('relevance');
  const [shouldSyncLocalDataToCloud, setShouldSyncLocalDataToCloud] = useState(false);
  const [feedMediaItems, setFeedMediaItems] = useState<MediaItem[]>([]);

  // Session management
  const {
    sessions,
    activeSessionId,
    createSession,
    updateSession,
    updateSessionData,
    closeSession,
    switchToSession,
    getActiveSession,
    findSession,
  } = useViewerSessions();

  // Auth and cloud sync
  const { user, userProfile, isLoading: authLoading, signIn, signUp, signOut, isAuthenticated } = useAuth();
  const cloudSync = useCloudSync();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasLoadedCloudData, setHasLoadedCloudData] = useState(false);

  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'light':
        return {
          bg: 'bg-gradient-to-br from-pink-50 via-white to-rose-50',
          card: 'bg-white/70 backdrop-blur-xl border-white/20',
          text: 'text-gray-800',
          subtext: 'text-gray-600',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
        };
      case 'dark':
        return {
          bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-pink-900/20',
          card: 'bg-gray-800/70 backdrop-blur-xl border-gray-700/20',
          text: 'text-white',
          subtext: 'text-gray-300',
          button: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-100 via-gray-50 to-pink-50',
          card: 'bg-gray-50/70 backdrop-blur-xl border-gray-200/20',
          text: 'text-gray-700',
          subtext: 'text-gray-500',
          button: 'bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600',
        };
    }
  };

  // Load favorite media items
  useEffect(() => {
    // Load favorite media items from all sources
    const loadFavoriteMedia = async () => {
      const favoriteItems: MediaItem[] = [];
      
      // Add logic to load favorite media items
      for (const mediaId of settings.favoriteMedia) {
        // Find the media item in current mediaItems or load from storage
        const existingItem = mediaItems.find(item => item.id === mediaId);
        if (existingItem) {
          favoriteItems.push(existingItem);
        }
      }
      
      setFavoriteMediaItems(favoriteItems);
    };
    
    loadFavoriteMedia();
  }, [settings.favoriteMedia, mediaItems]);

  // Load cloud data when user signs in
  useEffect(() => {
    const loadCloudData = async () => {
      if (isAuthenticated && user) {
        try {
          console.log('🔄 Loading cloud data for user:', user.username);
          const cloudData = await cloudSync.loadFromCloud();
          
          // Replace local data with cloud data when signed in
          setSettings(prev => ({
            ...prev,
            favoriteMedia: cloudData.favoriteMedia,
            favoriteSubreddits: cloudData.favoriteSubreddits,
            mediaFolders: cloudData.mediaFolders,
          }));
          
          // Replace favorite media items with cloud data
          setFavoriteMediaItems(cloudData.favoriteMediaItems);
          
          console.log('✅ Cloud data loaded successfully');
        } catch (error) {
          console.error('Error loading cloud data:', error);
        }
      }
    };

    if (!authLoading) {
      loadCloudData();
    }
  }, [isAuthenticated, user, authLoading]);

  // Reset cloud data flag when user signs out
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('👋 User signed out, reverting to local data');
      // Clear cloud-specific data and revert to localStorage defaults
      const savedSettings = localStorage.getItem('mediaVault_settings');
      if (savedSettings) {
        try {
          const localSettings = JSON.parse(savedSettings);
          setSettings(prev => ({
            ...prev,
            favoriteMedia: localSettings.favoriteMedia || [],
            favoriteSubreddits: localSettings.favoriteSubreddits || [],
            mediaFolders: localSettings.mediaFolders || [],
          }));
        } catch (error) {
          console.error('Error loading localStorage settings:', error);
          // Fallback to empty arrays
          setSettings(prev => ({
            ...prev,
            favoriteMedia: [],
            favoriteSubreddits: [],
            mediaFolders: [],
          }));
        }
      }
      setFavoriteMediaItems([]);
    }
  }, [isAuthenticated]);

  // Sync local data to cloud after successful authentication
  useEffect(() => {
    const syncLocalData = async () => {
      if (isAuthenticated && user && shouldSyncLocalDataToCloud) {
        try {
          await cloudSync.syncToCloud(settings, allMediaItems);
          setShouldSyncLocalDataToCloud(false);
        } catch (error) {
          console.error('Error syncing to cloud:', error);
          setShouldSyncLocalDataToCloud(false);
        }
      }
    };

    syncLocalData();
  }, [isAuthenticated, user, shouldSyncLocalDataToCloud]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className={`min-h-screen ${getThemeClasses().bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className={`${getThemeClasses().text} text-lg font-medium`}>
            Checking authentication...
          </p>
          <p className={`${getThemeClasses().subtext} text-sm mt-2`}>
            Restoring your session
          </p>
        </div>
      </div>
    );
  }

  // Get current session data
  const activeSession = getActiveSession();
  const mediaItems = activeSession?.state.mediaItems || [];
  const isLoading = activeSession?.state.isLoading || false;
  const error = activeSession?.state.error || null;
  const hasMore = activeSession?.state.hasMore || false;
  const selectedMediaIndex = activeSession?.state.selectedMediaIndex || null;
  
  // Derived state from active session
  const currentSubreddit = activeSession?.data.subreddit || '';
  const currentTags = activeSession?.data.tags || '';
  const currentSearchQuery = activeSession?.data.searchQuery || '';
  const isSearchMode = activeSession?.data.isSearchMode || false;
  const currentSort = activeSession?.data.sort || settings.defaultSort;
  const currentMediaFilter = activeSession?.data.mediaFilter || settings.mediaFilter;
  const selectedYouTubeVideos = activeSession?.data.selectedVideos || settings.selectedYouTubeVideos;
  const showYouTubeViewer = activeSession?.data.showViewer || false;

  // Filter media items based on current filter
  const filteredMediaItems = mediaItems.filter(item => {
    switch (currentMediaFilter) {
      case 'images':
        return item.type === 'image';
      case 'videos':
        return item.type === 'video' || item.type === 'embed';
      case 'galleries':
        return item.type === 'gallery';
      default:
        return true;
    }
  });

  // Filter favorite media items
  const filteredFavoriteMediaItems = favoriteMediaItems.filter(item => {
    switch (currentMediaFilter) {
      case 'images':
        return item.type === 'image';
      case 'videos':
        return item.type === 'video' || item.type === 'embed';
      case 'galleries':
        return item.type === 'gallery';
      default:
        return true;
    }
  });
  
  // Combine all available media items
  const allMediaItems = [...mediaItems, ...favoriteMediaItems, ...feedMediaItems];

  // Helper function to get or create session
  const getOrCreateSession = (
    type: 'reddit' | 'rule34' | 'youtube',
    data: ViewerSession['data']
  ) => {
    const existing = findSession(type, data);
    if (existing) {
      switchToSession(existing.id);
      return existing.id;
    }
    return createSession(type, data);
  };

  const loadSubreddit = async (subreddit: string, sort: RedditSortType, isNewSubreddit = false) => {
    if (!activeSessionId) return;
    
    if (!isNewSubreddit && isLoading) return;
    
    try {
      updateSession(activeSessionId, { isLoading: true, error: null });
      
      const after = isNewSubreddit ? undefined : activeSession?.state.nextPageToken;
      const result = await redditApi.fetchSubreddit(subreddit, sort, after);
      
      const newItems = isNewSubreddit 
        ? result.items 
        : [...(activeSession?.state.mediaItems || []), ...result.items];
      
      updateSession(activeSessionId, {
        mediaItems: newItems,
        nextPageToken: result.nextPage,
        hasMore: !!result.nextPage,
        isLoading: false,
      });
    } catch (err) {
      updateSession(activeSessionId, {
        error: err instanceof Error ? err.message : 'Failed to load content',
        isLoading: false,
      });
    }
  };

  const loadSearchResults = async (query: string, subreddit?: string, sort?: string, isNewSearch = false) => {
    if (!activeSessionId) return;
    
    if (!isNewSearch && isLoading) return;
    
    try {
      updateSession(activeSessionId, { isLoading: true, error: null });
      
      const after = isNewSearch ? undefined : activeSession?.state.nextPageToken;
      const result = subreddit 
        ? await redditApi.searchSubreddit(subreddit, query, after)
        : await redditApi.searchAllReddit(query, sort || 'relevance', after);
      
      const newItems = isNewSearch 
        ? result.items 
        : [...(activeSession?.state.mediaItems || []), ...result.items];
      
      updateSession(activeSessionId, {
        mediaItems: newItems,
        nextPageToken: result.nextPage,
        hasMore: !!result.nextPage,
        isLoading: false,
      });
    } catch (err) {
      updateSession(activeSessionId, {
        error: err instanceof Error ? err.message : 'Failed to load search results',
        isLoading: false,
      });
    }
  };

  const loadRule34Posts = async (tags: string, pid: number, isNewSearch = false) => {
    if (!activeSessionId) return;
    
    if (!isNewSearch && isLoading) return;
    
    try {
      updateSession(activeSessionId, { isLoading: true, error: null });
      
      const result = await rule34Api.fetchPosts(tags, pid);
      
      const newItems = isNewSearch 
        ? result.items 
        : [...(activeSession?.state.mediaItems || []), ...result.items];
      
      updateSession(activeSessionId, {
        mediaItems: newItems,
        currentPid: result.nextPage || pid,
        hasMore: !!result.nextPage,
        isLoading: false,
      });
    } catch (err) {
      updateSession(activeSessionId, {
        error: err instanceof Error ? err.message : 'Failed to load content',
        isLoading: false,
      });
    }
  };

  const handleSourceSelect = (source: MediaSource) => {
    setSettings(prev => ({ ...prev, selectedSource: source }));
  };

  const handleSubredditSelect = (subreddit: string) => {
    // Create or switch to Reddit session
    const sessionId = getOrCreateSession('reddit', {
      subreddit,
      sort: settings.defaultSort,
      mediaFilter: settings.mediaFilter,
      isSearchMode: false,
    });
    
    setShowFavorites(false);
    setSelectedFolderId(null);
    
    // Load content for the session
    setTimeout(() => loadSubreddit(subreddit, settings.defaultSort, true), 0);
  };

  const handleSearchAllReddit = (query: string, sort: string = 'relevance') => {
    // Create or switch to Reddit search session
    const sessionId = getOrCreateSession('reddit', {
      searchQuery: query,
      isSearchMode: true,
      mediaFilter: settings.mediaFilter,
    });
    
    setShowFavorites(false);
    setSelectedFolderId(null);
    
    // Load search results for the session
    setTimeout(() => loadSearchResults(query, undefined, 'relevance', true), 0);
  };

  const handleSearchSortChange = (sort: string) => {
    if (!activeSessionId || !activeSession) return;
    
    if (isSearchMode && currentSearchQuery && !currentSubreddit) {
      updateSession(activeSessionId, {
        mediaItems: [],
        nextPageToken: null,
        hasMore: true,
      });
      setTimeout(() => loadSearchResults(currentSearchQuery, undefined, sort, true), 0);
    }
  };

  const handleSubredditSearch = (query: string) => {
    if (!currentSubreddit || !activeSessionId) return;
    
    updateSessionData(activeSessionId, {
      searchQuery: query,
      isSearchMode: true,
    });
    
    updateSession(activeSessionId, {
      selectedMediaIndex: null,
      nextPageToken: null,
      hasMore: true,
      mediaItems: [],
    });
    
    setTimeout(() => loadSearchResults(query, currentSubreddit, undefined, true), 0);
  };

  const handleTagsSelect = (tags: string) => {
    // Create or switch to Rule34 session
    const sessionId = getOrCreateSession('rule34', {
      tags,
      mediaFilter: settings.mediaFilter,
    });
    
    setShowFavorites(false);
    setSelectedFolderId(null);
    
    // Load Rule34 posts for the session
    setTimeout(() => loadRule34Posts(tags, 0, true), 0);
  };

  const handleBack = () => {
    if (showYouTubeViewer && activeSessionId) {
      updateSessionData(activeSessionId, { showViewer: false });
    } else if (showFeed) {
      setShowFeed(false);
    } else if (selectedFolderId) {
      setSelectedFolderId(null);
    } else if (showFavorites) {
      setShowFavorites(false);
    } else if (activeSessionId) {
      // Close the active session
      closeSession(activeSessionId);
    } else {
      // Go back to source selection
      setSettings(prev => ({ ...prev, selectedSource: null }));
    }
  };

  const handleThemeChange = (theme: ThemeMode) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleSortChange = (sort: RedditSortType) => {
    if (!activeSessionId) return;
    
    updateSessionData(activeSessionId, { sort });
    setSettings(prev => ({ ...prev, defaultSort: sort }));
    
    if (currentSubreddit && !isSearchMode) {
      updateSession(activeSessionId, {
        mediaItems: [],
        nextPageToken: null,
        hasMore: true,
      });
      setTimeout(() => loadSubreddit(currentSubreddit, sort, true), 0);
    }
  };

  const handleMediaFilterChange = (filter: MediaFilter) => {
    if (activeSessionId) {
      updateSessionData(activeSessionId, { mediaFilter: filter });
    }
    setSettings(prev => ({ ...prev, mediaFilter: filter }));
    
    if (activeSessionId) {
      updateSession(activeSessionId, { selectedMediaIndex: null });
    }
  };
  
  const handleToggleFavoriteSubreddit = (subreddit: string) => {
    const isCurrentlyFavorited = settings.favoriteSubreddits.includes(subreddit);
    
    // Update local state immediately (this will sync to localStorage)
    setSettings(prev => ({
      ...prev,
      favoriteSubreddits: prev.favoriteSubreddits.includes(subreddit)
        ? prev.favoriteSubreddits.filter(s => s !== subreddit)
        : [...prev.favoriteSubreddits, subreddit]
    }));
    
    // Sync to cloud if authenticated
    if (isAuthenticated) {
      if (isCurrentlyFavorited) {
        cloudSync.removeFavoriteSubreddit(subreddit).catch(console.error);
      } else {
        cloudSync.addFavoriteSubreddit(subreddit).catch(console.error);
      }
    }
  };

  const handleToggleFavoriteMedia = (mediaId: string) => {
    const mediaItem = allMediaItems.find(item => item.id === mediaId);
    const isCurrentlyFavorited = settings.favoriteMedia.includes(mediaId);
    
    // Update local state immediately (this will sync to localStorage)
    setSettings(prev => ({
      ...prev,
      favoriteMedia: prev.favoriteMedia.includes(mediaId)
        ? prev.favoriteMedia.filter(id => id !== mediaId)
        : [...prev.favoriteMedia, mediaId]
    }));
    
    // Update favorite media items list
    if (mediaItem) {
      setFavoriteMediaItems(prev => 
        isCurrentlyFavorited 
          ? prev.filter(item => item.id !== mediaId)
          : [...prev, mediaItem]
      );
    }
    
    // Sync to cloud if authenticated
    if (isAuthenticated && mediaItem) {
      if (isCurrentlyFavorited) {
        cloudSync.removeFavoriteMedia(mediaId).catch(console.error);
      } else {
        cloudSync.addFavoriteMedia(mediaId, mediaItem).catch(console.error);
      }
    }
  };

  const handleLoadMore = async () => {
    return new Promise<void>((resolve) => {
      const originalLoadMore = () => {
        if (hasMore && activeSession) {
          if (activeSession.type === 'reddit' && activeSession.state.nextPageToken) {
            if (isSearchMode && currentSearchQuery) {
              if (currentSubreddit) {
                // Subreddit-specific search
                setTimeout(() => loadSearchResults(currentSearchQuery, currentSubreddit, undefined, false), 0);
              } else {
                // Global Reddit search
                setTimeout(() => loadSearchResults(currentSearchQuery, undefined, 'relevance', false), 0);
              }
            } else if (currentSubreddit) {
              setTimeout(() => loadSubreddit(currentSubreddit, currentSort, false), 0);
            }
          } else if (activeSession.type === 'rule34' && activeSession.state.currentPid !== null) {
            setTimeout(() => loadRule34Posts(currentTags, activeSession.state.currentPid, false), 0);
          }
        }
      };

      // Small delay to ensure the promise resolves after the state updates
      setTimeout(originalLoadMore, 0);
      resolve();
    });
  };

  const handleToggleFavorites = () => {
    setSelectedFolderId(null);
    setShowFeed(false);
    setShowFavorites(!showFavorites);
  };

  const handleShowFolders = () => {
    setShowFavorites(false);
    setShowFeed(false);
    setSelectedFolderId('__folders_list__'); // Special ID to show folders list
  };

  const handleCreateFolder = (name: string, color: string, mediaId?: string) => {
    if (isAuthenticated) {
      // Create folder in cloud
      cloudSync.createFolder(name, color).then(folderId => {
        // Add initial media item if provided
        if (mediaId) {
          const mediaItem = allMediaItems.find(item => item.id === mediaId) || 
                           favoriteMediaItems.find(item => item.id === mediaId);
          if (mediaItem) {
            cloudSync.addToFolder(folderId, mediaId, mediaItem).catch(console.error);
          }
        }
        
        // Reload cloud data to update local state
        return cloudSync.loadFromCloud().then(cloudData => {
          setSettings(prev => ({
            ...prev,
            mediaFolders: cloudData.mediaFolders,
          }));
        }).catch(console.error);
      }).catch(console.error);
    } else {
      // Local storage fallback
      let initialMediaItems: MediaItem[] = [];
      
      if (mediaId) {
        const mediaItem = allMediaItems.find(item => item.id === mediaId) || 
                         favoriteMediaItems.find(item => item.id === mediaId);
        if (mediaItem) {
          initialMediaItems = [mediaItem];
        }
      }
      
      const newFolder: MediaFolder = {
        id: Date.now().toString(),
        name,
        color,
        mediaItems: initialMediaItems,
        createdAt: new Date(),
      };
      
      setSettings(prev => ({
        ...prev,
        mediaFolders: [...prev.mediaFolders, newFolder]
      }));
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (isAuthenticated) {
      cloudSync.deleteFolder(folderId).then(() => {
        // Reload cloud data to update local state
        return cloudSync.loadFromCloud().then(cloudData => {
          setSettings(prev => ({
            ...prev,
            mediaFolders: cloudData.mediaFolders,
          }));
        }).catch(console.error);
      }).catch(console.error);
    } else {
      // Local storage fallback
      setSettings(prev => ({
        ...prev,
        mediaFolders: prev.mediaFolders.filter(folder => folder.id !== folderId)
      }));
    }
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    if (isAuthenticated) {
      cloudSync.renameFolder(folderId, newName).then(() => {
        // Reload cloud data to update local state
        return cloudSync.loadFromCloud().then(cloudData => {
          setSettings(prev => ({
            ...prev,
            mediaFolders: cloudData.mediaFolders,
          }));
        }).catch(console.error);
      }).catch(console.error);
    } else {
      // Local storage fallback
      setSettings(prev => ({
        ...prev,
        mediaFolders: prev.mediaFolders.map(folder =>
          folder.id === folderId ? { ...folder, name: newName } : folder
        )
      }));
    }
  };

  const handleAddToFolder = (folderId: string, mediaId: string) => {
    // Handle multiple media items if in multi-select mode
    const mediaIdsToAdd = isMultiSelectMode && selectedMediaIds.size > 0 
      ? Array.from(selectedMediaIds) 
      : [mediaId];
    
    const mediaItemsToAdd = mediaIdsToAdd
      .map(id => {
        // First try to find in allMediaItems, then in favoriteMediaItems, then in current mediaItems
        const found = allMediaItems.find(item => item.id === id) || 
                     favoriteMediaItems.find(item => item.id === id) ||
                     mediaItems.find(item => item.id === id);
        return found;
      })
      .filter(Boolean) as MediaItem[];
    
    if (mediaItemsToAdd.length === 0) return;
    
    if (isAuthenticated) {
      // Add to cloud
      Promise.all(
        mediaItemsToAdd.map(mediaItem => 
          cloudSync.addToFolder(folderId, mediaItem.id, mediaItem)
        )
      ).then(() => {
        // Reload cloud data to update local state
        return cloudSync.loadFromCloud().then(cloudData => {
          setSettings(prev => ({
            ...prev,
            mediaFolders: cloudData.mediaFolders,
          }));
        }).catch(console.error);
      }).catch(error => {
        console.error('Error adding to cloud:', error);
      });
    } else {
      // Local storage fallback
      setSettings(prev => ({
        ...prev,
        mediaFolders: prev.mediaFolders.map(folder => {
          if (folder.id !== folderId) return folder;
          
          const newMediaItems = [...folder.mediaItems];
          mediaItemsToAdd.forEach(mediaItem => {
            if (!newMediaItems.some(item => item.id === mediaItem.id)) {
              newMediaItems.push(mediaItem);
            }
          });
          
          return { ...folder, mediaItems: newMediaItems };
        })
      }));
    }
    
    // Clear selection after adding
    if (isMultiSelectMode) {
      setSelectedMediaIds(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleRemoveFromFolder = (folderId: string, mediaId: string) => {
    if (isAuthenticated) {
      cloudSync.removeFromFolder(folderId, mediaId).then(() => {
        // Reload cloud data to update local state
        return cloudSync.loadFromCloud().then(cloudData => {
          setSettings(prev => ({
            ...prev,
            mediaFolders: cloudData.mediaFolders,
          }));
        }).catch(console.error);
      }).catch(console.error);
    } else {
      // Local storage fallback
      setSettings(prev => ({
        ...prev,
        mediaFolders: prev.mediaFolders.map(folder =>
          folder.id === folderId
            ? { ...folder, mediaItems: folder.mediaItems.filter(item => item.id !== mediaId) }
            : folder
        )
      }));
    }
  };

  const handleSetFolderThumbnail = (folderId: string, thumbnailUrl: string) => {
    if (isAuthenticated) {
      cloudSync.setFolderThumbnail(folderId, thumbnailUrl).then(() => {
        // Reload cloud data to update local state
        return cloudSync.loadFromCloud().then(cloudData => {
          setSettings(prev => ({
            ...prev,
            mediaFolders: cloudData.mediaFolders,
          }));
        }).catch(console.error);
      }).catch(console.error);
    } else {
      // Local storage fallback
      setSettings(prev => ({
        ...prev,
        mediaFolders: prev.mediaFolders.map(folder =>
          folder.id === folderId
            ? { ...folder, customThumbnail: thumbnailUrl }
            : folder
        )
      }));
    }
  };

  const handleAddToFolderLegacy = (folderId: string, mediaId: string) => {
    // Handle multiple media items if in multi-select mode
    const mediaIdsToAdd = isMultiSelectMode && selectedMediaIds.size > 0 
      ? Array.from(selectedMediaIds) 
      : [mediaId];
    
    const mediaItemsToAdd = mediaIdsToAdd
      .map(id => allMediaItems.find(item => item.id === id))
      .filter(Boolean) as MediaItem[];
    
    if (mediaItemsToAdd.length === 0) return;
    
    setSettings(prev => ({
      ...prev,
      mediaFolders: prev.mediaFolders.map(folder => {
        if (folder.id !== folderId) return folder;
        
        const newMediaItems = [...folder.mediaItems];
        mediaItemsToAdd.forEach(mediaItem => {
          if (!newMediaItems.some(item => item.id === mediaItem.id)) {
            newMediaItems.push(mediaItem);
          }
        });
        
        return { ...folder, mediaItems: newMediaItems };
      })
    }));
    
    // Clear selection after adding
    if (isMultiSelectMode) {
      setSelectedMediaIds(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleRemoveFromFolderLegacy = (folderId: string, mediaId: string) => {
    setSettings(prev => ({
      ...prev,
      mediaFolders: prev.mediaFolders.map(folder =>
        folder.id === folderId
          ? { ...folder, mediaItems: folder.mediaItems.filter(item => item.id !== mediaId) }
          : folder
      )
    }));
  };

  const handleSetFolderThumbnailLegacy = (folderId: string, thumbnailUrl: string) => {
    setSettings(prev => ({
      ...prev,
      mediaFolders: prev.mediaFolders.map(folder =>
        folder.id === folderId
          ? { ...folder, customThumbnail: thumbnailUrl }
          : folder
      )
    }));
  };

  const handleMediaSelect = (mediaId: string, ctrlKey: boolean) => {
    if (ctrlKey) {
      setIsMultiSelectMode(true);
      setSelectedMediaIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(mediaId)) {
          newSet.delete(mediaId);
        } else {
          newSet.add(mediaId);
        }
        return newSet;
      });
    } else {
      // Clear selection if not holding ctrl
      setSelectedMediaIds(new Set());
      setIsMultiSelectMode(false);
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setShowFeed(false);
  };

  const handleShowFeed = () => {
    setShowFavorites(false);
    setSelectedFolderId(null);
    setShowYouTubeViewer(false);
    setShowFeed(true);
  };

  const handleYouTubeApiKeyChange = (key: string) => {
    setSettings(prev => ({ ...prev, youtubeApiKey: key }));
  };

  const handleToggleYouTubeVideo = (video: YouTubeVideo) => {
    setSettings(prev => ({
      ...prev,
      selectedYouTubeVideos: prev.selectedYouTubeVideos.some(v => v.id === video.id)
        ? prev.selectedYouTubeVideos.filter(v => v.id !== video.id)
        : [...prev.selectedYouTubeVideos, video]
    }));
  };

  const handleWatchYouTubeVideos = (videos: YouTubeVideo[]) => {
    // Create or switch to YouTube session
    const sessionId = getOrCreateSession('youtube', {
      selectedVideos: videos,
      showViewer: true,
    });
    
    setSettings(prev => ({ ...prev, selectedYouTubeVideos: videos }));
  };

  const handleCloseYouTubeViewer = () => {
    if (activeSessionId) {
      updateSessionData(activeSessionId, { showViewer: false });
    }
  };

  const handleRemoveYouTubeVideo = (videoId: string) => {
    const updatedVideos = selectedYouTubeVideos.filter(v => v.id !== videoId);
    
    if (activeSessionId) {
      updateSessionData(activeSessionId, { selectedVideos: updatedVideos });
    }
    
    setSettings(prev => ({
      ...prev,
      selectedYouTubeVideos: updatedVideos
    }));
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const handleSignIn = async (username: string, password: string) => {
    try {
      await signIn(username, password);
      setShowAuthModal(false);
    } catch (error) {
      console.error('Sign in error:', error);
      // Error will be handled by the AuthModal component
    }
  };

  const handleSignUp = async (username: string, password: string) => {
    try {
      await signUp(username, password);
      setShowAuthModal(false);
      setShouldSyncLocalDataToCloud(true);
    } catch (error) {
      console.error('Sign up error:', error);
      // Error will be handled by the AuthModal component
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // Clear any cloud-specific data and reset to localStorage defaults
    setFavoriteMediaItems([]);
    // Settings will automatically revert to localStorage values
    // since the useLocalStorage hook manages this
    setHasLoadedCloudData(false);
    setShouldSyncLocalDataToCloud(false);
  };

  const handleMediaClick = (item: MediaItem, index: number) => {
    if (showFeed) {
      // For feed view, we need to create a temporary media array for the viewer
      // Find the item in the current media items or create a new array
      const feedItems = [...mediaItems];
      const actualIndex = feedItems.findIndex(mediaItem => mediaItem.id === item.id);
      if (actualIndex === -1) {
        // If item not found, add it to the beginning
        feedItems.unshift(item);
        if (activeSessionId) {
          updateSession(activeSessionId, { 
            mediaItems: feedItems,
            selectedMediaIndex: 0 
          });
        }
      } else {
        if (activeSessionId) {
          updateSession(activeSessionId, { selectedMediaIndex: actualIndex });
        }
      }
    } else if (selectedFolderId && selectedFolderId !== '__folders_list__') {
      // When viewing a specific folder, use the folder's media items
      const folder = settings.mediaFolders.find(f => f.id === selectedFolderId);
      if (folder) {
        if (activeSessionId) {
          updateSession(activeSessionId, { selectedMediaIndex: index });
        }
        // Temporarily set the media items to the folder's items for the viewer
        if (activeSessionId) {
          updateSession(activeSessionId, { mediaItems: folder.mediaItems });
        }
      }
    } else {
      // For regular subreddit view, find the actual index in the unfiltered array
      const actualIndex = mediaItems.findIndex(mediaItem => mediaItem.id === item.id);
      if (activeSessionId) {
        updateSession(activeSessionId, { selectedMediaIndex: actualIndex });
      }
    }
  };

  const handleCloseViewer = () => {
    if (activeSessionId) {
      updateSession(activeSessionId, { selectedMediaIndex: null });
    }
  };

  const handleNavigateMedia = (index: number) => {
    if (index >= 0 && index < mediaItems.length && activeSessionId) {
      updateSession(activeSessionId, { selectedMediaIndex: index });
    }
  };

  const themeClasses = getThemeClasses();

  // Source selection screen
  if (!settings.selectedSource && sessions.length === 0) {
    return (
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <Header 
          theme={settings.theme} 
          onThemeChange={handleThemeChange}
          currentSort={currentSort}
          subredditInfo={subredditInfo}
          user={userProfile}
          onShowAuth={handleShowAuth}
          onSignOut={handleSignOut}
          isSyncing={cloudSync.isSyncing}
        />
        <SourceSelector 
          onSourceSelect={handleSourceSelect} 
          theme={settings.theme}
        />
      </div>
    );
  }

  // Subreddit selection screen (for Reddit)
  if (settings.selectedSource === 'reddit' && !activeSession && !showFavorites && !selectedFolderId && !showFeed) {
    return (
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <Header 
          theme={settings.theme} 
          onThemeChange={handleThemeChange}
          onBack={handleBack}
          currentSource={settings.selectedSource}
          currentSort={currentSort}
          subredditInfo={subredditInfo}
          onShowFolders={handleShowFolders}
          folderCount={settings.mediaFolders.length}
          onShowFeed={handleShowFeed}
          favoriteSubredditsCount={settings.favoriteSubreddits.length}
          onSearchAllReddit={handleSearchAllReddit}
          showGlobalSearch={true}
          user={userProfile}
          onShowAuth={handleShowAuth}
          onSignOut={handleSignOut}
          isSyncing={cloudSync.isSyncing}
        />
        <SubredditInput
          onSubredditSelect={handleSubredditSelect}
          favoriteSubreddits={settings.favoriteSubreddits}
          onToggleFavorite={handleToggleFavoriteSubreddit}
          theme={settings.theme}
          defaultSort={currentSort}
          onSortChange={handleSortChange}
        />
        
        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          theme={settings.theme}
        />
      </div>
    );
  }

  // Tags selection screen (for Rule34)
  if (settings.selectedSource === 'rule34' && !activeSession && !showFavorites && !selectedFolderId && !showFeed && !showYouTubeViewer) {
    return (
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <Header 
          theme={settings.theme} 
          onThemeChange={handleThemeChange}
          onBack={handleBack}
          currentSource={settings.selectedSource}
          currentSort={currentSort}
          subredditInfo={subredditInfo}
          onShowFolders={handleShowFolders}
          folderCount={settings.mediaFolders.length}
          showFeed={showFeed}
          onShowFeed={handleShowFeed}
          favoriteSubredditsCount={settings.favoriteSubreddits.length}
          user={userProfile}
          onShowAuth={handleShowAuth}
          onSignOut={handleSignOut}
          isSyncing={cloudSync.isSyncing}
        />
        <Rule34Input
          onTagsSelect={handleTagsSelect}
          theme={settings.theme}
        />
      </div>
    );
  }

  // YouTube selection screen
  if (settings.selectedSource === 'youtube' && !activeSession && !showFavorites && !selectedFolderId && !showFeed) {
    return (
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <Header 
          theme={settings.theme} 
          onThemeChange={handleThemeChange}
          onBack={handleBack}
          currentSource={settings.selectedSource}
          onShowFolders={handleShowFolders}
          folderCount={settings.mediaFolders.length}
          showFeed={showFeed}
          onShowFeed={handleShowFeed}
          favoriteSubredditsCount={settings.favoriteSubreddits.length}
          user={userProfile}
          onShowAuth={handleShowAuth}
          onSignOut={handleSignOut}
          isSyncing={cloudSync.isSyncing}
        />
        <YouTubeInput
          onVideosSelect={handleWatchYouTubeVideos}
          theme={settings.theme}
          apiKey={settings.youtubeApiKey || ''}
          onApiKeyChange={handleYouTubeApiKeyChange}
          selectedVideos={settings.selectedYouTubeVideos}
          onToggleVideo={handleToggleYouTubeVideo}
        />
      </div>
    );
  }

  // YouTube Multi-Viewer
  if (showYouTubeViewer && selectedYouTubeVideos.length > 0) {
    return (
      <div className="flex h-screen">
        <GlobalSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={switchToSession}
          onSessionClose={closeSession}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={settings.theme}
        />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-12' : 'ml-80'}`}>
          <YouTubeMultiViewer
            videos={selectedYouTubeVideos}
            onClose={handleCloseYouTubeViewer}
            theme={settings.theme}
            onRemoveVideo={handleRemoveYouTubeVideo}
          />
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="flex h-screen">
        <GlobalSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={switchToSession}
          onSessionClose={closeSession}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={settings.theme}
        />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-12' : 'ml-80'}`}>
          <div className={`min-h-screen ${themeClasses.bg}`}>
            <Header 
              theme={settings.theme} 
              onThemeChange={handleThemeChange}
              onBack={handleBack}
              currentSource={activeSession?.type}
              currentSubreddit={currentSubreddit}
              currentTags={currentTags}
              currentSearchQuery={currentSearchQuery}
              isSearchMode={isSearchMode}
              currentSort={currentSort}
              favoriteSubreddits={settings.favoriteSubreddits}
              onToggleFavoriteSubreddit={handleToggleFavoriteSubreddit}
              onSortChange={handleSortChange}
              onShowFolders={handleShowFolders}
              folderCount={settings.mediaFolders.length}
              onShowFeed={handleShowFeed}
              favoriteSubredditsCount={settings.favoriteSubreddits.length}
              onSubredditSearch={handleSubredditSearch}
              currentSearchSort={'relevance'}
              onSearchSortChange={handleSearchSortChange}
              user={userProfile}
              onShowAuth={handleShowAuth}
              onSignOut={handleSignOut}
              isSyncing={cloudSync.isSyncing}
            />
            <div className="flex items-center justify-center min-h-[60vh] p-6">
              <div className={`${themeClasses.card} border rounded-2xl p-8 max-w-md w-full text-center`}>
                <AlertCircle className={`w-12 h-12 text-red-400 mx-auto mb-4`} />
                <h2 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>Error Loading Content</h2>
                <p className={`${themeClasses.subtext} mb-6`}>{error}</p>
                <button
                  onClick={() => {
                    if (isSearchMode && currentSearchQuery) {
                      loadSearchResults(currentSearchQuery, currentSubreddit || undefined, 'relevance', true);
                    } else if (currentSubreddit) {
                      loadSubreddit(currentSubreddit, currentSort, true);
                    }
                  }}
                  className={`${themeClasses.button} text-white px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app screen
  return (
    <div className="flex h-screen">
      <GlobalSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={switchToSession}
        onSessionClose={closeSession}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        theme={settings.theme}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-12' : 'ml-80'} ${themeClasses.bg}`}>
        <Header 
          theme={settings.theme} 
          onThemeChange={handleThemeChange}
          onBack={handleBack}
          currentSource={activeSession?.type}
          currentSubreddit={currentSubreddit}
          currentTags={currentTags}
          currentSearchQuery={currentSearchQuery}
          isSearchMode={isSearchMode}
          currentSort={currentSort}
          favoriteSubreddits={settings.favoriteSubreddits}
          onToggleFavoriteSubreddit={handleToggleFavoriteSubreddit}
          onSortChange={handleSortChange}
          showFavorites={showFavorites}
          onToggleFavorites={handleToggleFavorites}
          favoriteCount={settings.favoriteMedia.length}
          mediaFilter={currentMediaFilter}
          onMediaFilterChange={handleMediaFilterChange}
          onShowFolders={handleShowFolders}
          folderCount={settings.mediaFolders.length}
          onSubredditSearch={handleSubredditSearch}
          currentSearchSort={'relevance'}
          onSearchSortChange={handleSearchSortChange}
          user={userProfile}
          onShowAuth={handleShowAuth}
          onSignOut={handleSignOut}
          isSyncing={cloudSync.isSyncing}
        />
        
        <main>
          {showFeed ? (
            <FeedPage
              favoriteSubreddits={settings.favoriteSubreddits}
              theme={settings.theme}
              onSubredditSelect={handleSubredditSelect}
              onItemClick={handleMediaClick}
              folders={settings.mediaFolders}
              onAddToFolder={handleAddToFolder}
              onCreateFolder={handleCreateFolder}
              selectedMediaIds={selectedMediaIds}
              onMediaSelect={handleMediaSelect}
              isMultiSelectMode={isMultiSelectMode}
              onFeedMediaUpdate={setFeedMediaItems}
            />
          ) : selectedFolderId === '__folders_list__' ? (
            <FoldersView
              folders={settings.mediaFolders}
              mediaItems={[...mediaItems, ...favoriteMediaItems]}
              onItemClick={handleMediaClick}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onRenameFolder={handleRenameFolder}
              theme={settings.theme}
              selectedFolderId={null}
              onFolderSelect={handleFolderSelect}
            />
          ) : selectedFolderId && selectedFolderId !== '__folders_list__' ? (
            <FoldersView
              folders={settings.mediaFolders}
              mediaItems={[...mediaItems, ...favoriteMediaItems]}
              onItemClick={handleMediaClick}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              onRenameFolder={handleRenameFolder}
              onRemoveFromFolder={handleRemoveFromFolderLegacy}
              onSetFolderThumbnail={isAuthenticated ? handleSetFolderThumbnail : handleSetFolderThumbnailLegacy}
              theme={settings.theme}
              selectedFolderId={selectedFolderId}
              onFolderSelect={handleFolderSelect}
            />
          ) : showFavorites ? (
            <FavoritesView
              favoriteMedia={filteredFavoriteMediaItems}
              onItemClick={handleMediaClick}
              theme={settings.theme}
              folders={settings.mediaFolders}
              onAddToFolder={handleAddToFolder}
              onCreateFolder={handleCreateFolder}
              selectedMediaIds={selectedMediaIds}
              onMediaSelect={handleMediaSelect}
              isMultiSelectMode={isMultiSelectMode}
            />
          ) : filteredMediaItems.length > 0 ? (
            <MediaGrid
              items={filteredMediaItems}
              onItemClick={handleMediaClick}
              isLoading={isLoading}
              theme={settings.theme}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              folders={settings.mediaFolders}
              onAddToFolder={handleAddToFolder}
              onCreateFolder={handleCreateFolder}
              selectedMediaIds={selectedMediaIds}
              onMediaSelect={handleMediaSelect}
              isMultiSelectMode={isMultiSelectMode}
            />
          ) : isLoading ? (
            <MediaGrid
              items={[]}
              onItemClick={handleMediaClick}
              isLoading={true}
              theme={settings.theme}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[60vh] p-6">
              <div className="text-center">
                <p className={`${themeClasses.subtext} text-lg`}>
                  {isSearchMode && currentSearchQuery
                    ? currentSubreddit
                      ? `No ${currentMediaFilter === 'all' ? 'media content' : currentMediaFilter} found for "${currentSearchQuery}" in r/${currentSubreddit}`
                      : `No ${currentMediaFilter === 'all' ? 'media content' : currentMediaFilter} found for "${currentSearchQuery}" on Reddit`
                    : currentMediaFilter === 'all' 
                      ? settings.selectedSource === 'rule34'
                        ? `No media content found for tags: ${currentTags}`
                        : currentSubreddit.includes('+') 
                          ? `No media content found in multi-subreddit feed`
                          : `No media content found for r/${currentSubreddit}`
                      : settings.selectedSource === 'rule34'
                        ? `No ${currentMediaFilter} found for tags: ${currentTags}`
                        : currentSubreddit.includes('+')
                          ? `No ${currentMediaFilter} found in multi-subreddit feed`
                          : `No ${currentMediaFilter} found for r/${currentSubreddit}`
                  }
                </p>
              </div>
            </div>
          )}
        </main>

        {selectedMediaIndex !== null && (
          <MediaViewer
            items={mediaItems}
            currentIndex={selectedMediaIndex}
            onClose={handleCloseViewer}
            onNavigate={handleNavigateMedia}
            theme={settings.theme}
            favoriteMedia={settings.favoriteMedia}
            onToggleFavorite={handleToggleFavoriteMedia}
          />
        )}
      </div>
    </div>
  );
}

export default App;