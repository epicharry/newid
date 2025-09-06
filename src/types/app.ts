export type ThemeMode = 'light' | 'dark' | 'off';

export type MediaSource = 'reddit' | 'listal' | 'favim' | 'rule34';
export type MediaSource = 'reddit' | 'listal' | 'favim' | 'rule34' | 'youtube';

export type RedditSortType = 'hot' | 'new' | 'top' | 'best' | 'rising';

export type MediaFilter = 'all' | 'images' | 'videos' | 'galleries';

export interface AppSettings {
  theme: ThemeMode;
  selectedSource: MediaSource | null;
  favoriteSubreddits: string[];
  favoriteMedia: string[];
  mediaFolders: MediaFolder[];
  defaultSort: RedditSortType;
  mediaFilter: MediaFilter;
  youtubeApiKey?: string;
  selectedYouTubeVideos: YouTubeVideo[];
}

export interface SubredditInfo {
  name: string;
  icon?: string;
  subscribers?: number;
  description?: string;
}

export interface SubredditSearchResult {
  name: string;
  displayName: string;
  title: string;
  description: string;
  subscribers: number;
  icon: string;
  isNsfw: boolean;
  url: string;
  created: Date;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'gallery' | 'embed';
  title: string;
  url: string;
  thumbnail: string;
  source: MediaSource;
  subreddit?: string;
  score?: number;
  author?: string;
  permalink?: string;
  created: Date;
  numComments: number;
  nsfw: boolean;
  
  // Video specific
  videoData?: {
    duration: number;
    width: number;
    height: number;
    bitrate?: number;
  };
  
  // Embed specific
  embedData?: {
    content: string;
    width: number;
    height: number;
  };
  
  // Video specific
  videoData?: {
    duration: number;
    width: number;
    height: number;
    bitrate?: number;
  };
  
  // Embed specific
  embedData?: {
    content: string;
    width: number;
    height: number;
  };
  
  // Video specific (updated)
  videoData?: {
    fallback_url?: string;
    has_audio: boolean;
    height: number;
    width: number;
    duration: number;
    hls_url?: string;
    bitrate?: number;
  };
  
  // Gallery specific
  galleryImages?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export interface MediaFolder {
  id: string;
  name: string;
  color: string;
  mediaItems: MediaItem[];
  createdAt: Date;
  customThumbnail?: string; // URL of custom thumbnail image
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  description: string;
  viewCount: string;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ViewerSession {
  id: string;
  type: 'reddit' | 'rule34' | 'youtube';
  title: string;
  icon: string;
  data: {
    // Reddit specific
    subreddit?: string;
    searchQuery?: string;
    isSearchMode?: boolean;
    sort?: RedditSortType;
    mediaFilter?: MediaFilter;
    
    // Rule34 specific
    tags?: string;
    
    // YouTube specific
    selectedVideos?: YouTubeVideo[];
    showViewer?: boolean;
  };
  state: {
    mediaItems: MediaItem[];
    isLoading: boolean;
    error: string | null;
    nextPageToken: string | null;
    currentPid: number;
    hasMore: boolean;
    selectedMediaIndex: number | null;
  };
  createdAt: Date;
  lastActiveAt: Date;
}