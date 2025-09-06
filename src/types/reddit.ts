export interface RedditPost {
  id: string;
  title: string;
  url: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
  thumbnail: string;
  is_video: boolean;
  is_gallery?: boolean;
  over_18: boolean;
  
  // Video data
  secure_media?: {
    reddit_video?: {
      fallback_url: string;
      has_audio: boolean;
      height: number;
      width: number;
      duration: number;
      hls_url: string;
    };
  };
  
  // Embed data
  media_embed?: {
    content: string;
    width: number;
    height: number;
    scrolling: boolean;
  };
  
  // Image preview data
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
      resolutions: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    }>;
  };
  
  // Gallery data
  media_metadata?: Record<string, {
    status: string;
    e: string;
    m: string;
    s: {
      y: number;
      x: number;
    };
    id: string;
  }>;
  
  gallery_data?: {
    items: Array<{
      media_id: string;
      id: number;
    }>;
  };
}

export interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after: string | null;
    before: string | null;
    dist: number;
  };
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'gallery';
  title: string;
  url: string;
  thumbnail: string;
  source: 'reddit';
  subreddit: string;
  score: number;
  author: string;
  permalink: string;
  
  // Video specific
  videoData?: {
    fallback_url: string;
    has_audio: boolean;
    height: number;
    width: number;
    duration: number;
    hls_url: string;
  };
  
  // Gallery specific
  galleryImages?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}