import { RedditResponse, RedditPost } from '../types/reddit';
import { MediaItem, RedditSortType, SubredditInfo } from '../types/app';

class RedditApiService {
  private baseUrl = 'https://oauth.reddit.com';
  private authUrl = 'https://www.reddit.com/api/v1/access_token';
  private clientId = 'nJ5ygiagwTRz1_SKp-6nhA';
  private clientSecret = 'Ex_oFhs1TIIkBMOysNuqNjByAtd3sw';
  private userAgent = 'ValRadiant-WebApp/0.1';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    
    try {
      const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
      
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: 'grant_type=client_credentials',
      });
      
      if (!response.ok) {
        throw new Error(`OAuth failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get OAuth token:', error);
      throw new Error('Failed to authenticate with Reddit API');
    }
  }
  
  private async makeAuthenticatedRequest(url: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': this.userAgent,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async fetchSubredditInfo(subreddit: string): Promise<SubredditInfo | null> {
    try {
      const cleanSubreddit = subreddit.trim().replace(/^r\//, '');
      const url = `${this.baseUrl}/r/${cleanSubreddit}/about`;
      
      const data = await this.makeAuthenticatedRequest(url);
      
      if (!data.data) {
        return null;
      }
      
      const subredditData = data.data;
      const iconUrl = subredditData.community_icon || subredditData.icon_img;
      
      return {
        name: subredditData.display_name,
        icon: iconUrl ? iconUrl.split('?')[0] : undefined,
        subscribers: subredditData.subscribers,
        description: subredditData.public_description,
      };
    } catch (error) {
      console.error('Failed to fetch subreddit info:', error);
      return null;
    }
  }
  
  async fetchSubreddit(subreddit: string, sort: RedditSortType = 'hot', after?: string): Promise<{ items: MediaItem[], nextPage: string | null }> {
    try {
      // Validate and clean subreddit name
      const cleanSubreddit = this.cleanSubredditInput(subreddit);
      
      if (!cleanSubreddit) {
        throw new Error('Subreddit name is required');
      }

      // Build URL
      let url = `${this.baseUrl}/r/${cleanSubreddit}/${sort}?limit=100&include_over_18=on&raw_json=1`;
      if (after) {
        url += `&after=${after}`;
      }
      
      const data = await this.makeAuthenticatedRequest(url);
      
      if (!data.data || !Array.isArray(data.data.children)) {
        throw new Error('Invalid response format from Reddit API');
      }
      
      const posts = data.data.children.map((child: any) => child.data);
      
      // Filter and transform posts to media items
      const mediaItems = posts
        .filter((post: RedditPost) => this.isValidMediaPost(post))
        .map((post: RedditPost) => this.transformToMediaItem(post));
      
      return {
        items: mediaItems,
        nextPage: data.data.after || null
      };
    } catch (error) {
      console.error('Reddit API error:', error);
      throw error;
    }
  }
  
  async searchAllReddit(query: string, sort: string = 'relevance', after?: string): Promise<{ items: MediaItem[], nextPage: string | null }> {
    try {
      if (!query.trim()) {
        throw new Error('Search query is required');
      }

      // Build URL for global Reddit search
      let url = `${this.baseUrl}/search?q=${encodeURIComponent(query.trim())}&sort=${sort}&limit=100&raw_json=1&include_over_18=on&type=link`;
      if (after) {
        url += `&after=${after}`;
      }
      
      const data = await this.makeAuthenticatedRequest(url);
      
      if (!data.data || !Array.isArray(data.data.children)) {
        throw new Error('Invalid response format from Reddit API');
      }
      
      const posts = data.data.children.map((child: any) => child.data);
      
      // Filter and transform posts to media items
      const mediaItems = posts
        .filter((post: RedditPost) => this.isValidMediaPost(post))
        .map((post: RedditPost) => this.transformToMediaItem(post));
      
      return {
        items: mediaItems,
        nextPage: data.data.after || null
      };
    } catch (error) {
      console.error('Reddit search API error:', error);
      throw error;
    }
  }
  
  async searchSubreddit(subreddit: string, query: string, after?: string): Promise<{ items: MediaItem[], nextPage: string | null }> {
    try {
      const cleanSubreddit = this.cleanSubredditInput(subreddit);
      
      if (!cleanSubreddit) {
        throw new Error('Subreddit name is required');
      }
      
      if (!query.trim()) {
        throw new Error('Search query is required');
      }

      // Build URL for subreddit-specific search
      let url = `${this.baseUrl}/r/${cleanSubreddit}/search?q=${encodeURIComponent(query.trim())}&restrict_sr=on&sort=new&limit=100&raw_json=1&include_over_18=on`;
      if (after) {
        url += `&after=${after}`;
      }
      
      const data = await this.makeAuthenticatedRequest(url);
      
      if (!data.data || !Array.isArray(data.data.children)) {
        throw new Error('Invalid response format from Reddit API');
      }
      
      const posts = data.data.children.map((child: any) => child.data);
      
      // Filter and transform posts to media items
      const mediaItems = posts
        .filter((post: RedditPost) => this.isValidMediaPost(post))
        .map((post: RedditPost) => this.transformToMediaItem(post));
      
      return {
        items: mediaItems,
        nextPage: data.data.after || null
      };
    } catch (error) {
      console.error('Reddit subreddit search API error:', error);
      throw error;
    }
  }
  
  async searchSubreddits(query: string, after?: string): Promise<{ subreddits: SubredditSearchResult[], nextPage: string | null }> {
    try {
      if (!query.trim()) {
        throw new Error('Search query is required');
      }

      // Build URL for subreddit search
      let url = `${this.baseUrl}/subreddits/search?q=${encodeURIComponent(query.trim())}&limit=25&raw_json=1&include_over_18=on`;
      if (after) {
        url += `&after=${after}`;
      }
      
      const data = await this.makeAuthenticatedRequest(url);
      
      if (!data.data || !Array.isArray(data.data.children)) {
        throw new Error('Invalid response format from Reddit API');
      }
      
      const subreddits = data.data.children.map((child: any) => this.transformToSubredditSearchResult(child.data));
      
      return {
        subreddits,
        nextPage: data.data.after || null
      };
    } catch (error) {
      console.error('Reddit subreddit search API error:', error);
      throw error;
    }
  }
  
  private cleanSubredditInput(input: string): string {
    // Remove r/ prefix and clean up
    let cleaned = input.trim().replace(/^r\//, '');
    
    // Handle multiple subreddits separated by commas
    if (cleaned.includes(',')) {
      const subreddits = cleaned
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .filter(s => /^[a-zA-Z0-9_-]+$/.test(s)); // Validate each subreddit
      
      if (subreddits.length === 0) {
        throw new Error('No valid subreddit names found');
      }
      
      return subreddits.join('+');
    }
    
    // Single subreddit validation
    if (!/^[a-zA-Z0-9_+-]+$/.test(cleaned)) {
      throw new Error('Invalid subreddit name. Only letters, numbers, underscores, hyphens, and plus signs are allowed.');
    }
    
    return cleaned;
  }
  
  private isValidMediaPost(post: RedditPost): boolean {
    // Check if post has video
    if (post.is_video && post.secure_media?.reddit_video) {
      return true;
    }
    
    // Check if post has embed content
    if (post.media_embed?.content) {
      return true;
    }
    
    // Check if post is a gallery
    if (post.is_gallery && post.gallery_data && post.media_metadata) {
      return true;
    }
    
    // Check if post has image preview
    if (post.preview?.images?.[0]?.source) {
      return true;
    }
    
    // Check if direct image URL
    if (this.isDirectImageUrl(post.url)) {
      return true;
    }
    
    return false;
  }
  
  private isDirectImageUrl(url: string): boolean {
    if (!url) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageDomains = ['i.redd.it', 'i.imgur.com', 'imgur.com'];
    
    // Check for image extensions
    const hasImageExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    
    // Check for image hosting domains
    const isImageDomain = imageDomains.some(domain =>
      url.toLowerCase().includes(domain)
    );
    
    return hasImageExtension || isImageDomain;
  }
  
  private transformToMediaItem(post: RedditPost): MediaItem {
    const baseItem = {
      id: post.id,
      title: post.title,
      source: 'reddit' as const,
      subreddit: post.subreddit,
      score: post.score,
      author: post.author,
      permalink: `https://reddit.com${post.permalink}`,
      thumbnail: this.getHighQualityThumbnail(post),
      created: post.created_utc ? new Date(post.created_utc * 1000) : new Date(),
      numComments: post.num_comments || 0,
      nsfw: post.over_18 || false,
    };
    
    // Handle embed posts (like RedGifs)
    if (post.media_embed?.content) {
      return {
        ...baseItem,
        type: 'embed' as const,
        url: '', // Will be handled by embed content
        embedData: {
          content: post.media_embed.content,
          width: post.media_embed.width,
          height: post.media_embed.height,
        },
      };
    }
    
    // Handle video posts
    if (post.is_video && post.secure_media?.reddit_video) {
      const video = post.secure_media.reddit_video;
      return {
        ...baseItem,
        type: 'video' as const,
        url: video.fallback_url,
        videoData: {
          fallback_url: video.fallback_url,
          has_audio: video.has_audio,
          duration: video.duration,
          width: video.width,
          height: video.height,
          hls_url: video.hls_url,
        },
      };
    }
    
    // Handle gallery posts
    if (post.is_gallery && post.gallery_data && post.media_metadata) {
      const galleryImages = post.gallery_data.items.map(item => {
        const metadata = post.media_metadata![item.media_id];
        const extension = this.extractExtension(metadata.m);
        return {
          url: `https://i.redd.it/${item.media_id}.${extension}`,
          width: metadata.s.x,
          height: metadata.s.y,
        };
      });
      
      return {
        ...baseItem,
        type: 'gallery' as const,
        url: galleryImages[0]?.url || '',
        galleryImages,
      };
    }
    
    // Handle single image posts
    let imageUrl = post.url;
    
    // Always use the highest quality image available
    if (post.preview?.images?.[0]?.source?.url) {
      // Use the original source image (highest quality)
      const sourceImage = post.preview.images[0].source;
      imageUrl = this.decodeHtmlEntities(sourceImage.url);
    } else if (this.isDirectImageUrl(post.url)) {
      imageUrl = post.url;
    }
    
    // Handle Imgur links
    if (post.url.includes('imgur.com') && !post.url.toLowerCase().endsWith('.jpg') && 
        !post.url.toLowerCase().endsWith('.png') && !post.url.toLowerCase().endsWith('.gif')) {
      imageUrl = post.url + '.jpg';
    }
    
    return {
      ...baseItem,
      type: 'image' as const,
      url: imageUrl,
    };
  }
  
  private extractExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };
    return extensions[mimeType] || 'jpg';
  }
  
  private transformToSubredditSearchResult(subreddit: any): SubredditSearchResult {
    return {
      name: subreddit.display_name,
      displayName: subreddit.display_name_prefixed,
      title: subreddit.title,
      description: subreddit.public_description || '',
      subscribers: subreddit.subscribers || 0,
      icon: subreddit.community_icon || subreddit.icon_img || '',
      isNsfw: subreddit.over18 || false,
      url: subreddit.url,
      created: new Date((subreddit.created_utc || 0) * 1000),
    };
  }
  
  private getHighQualityThumbnail(post: RedditPost): string {
    // For images, use the high-quality source image as thumbnail
    if (post.preview?.images?.[0]?.source?.url) {
      return this.decodeHtmlEntities(post.preview.images[0].source.url);
    }
    
    // For direct image URLs, use the URL itself
    if (this.isDirectImageUrl(post.url)) {
      return post.url;
    }
    
    // For galleries, use the first image
    if (post.is_gallery && post.gallery_data && post.media_metadata) {
      const firstItem = post.gallery_data.items[0];
      if (firstItem) {
        const metadata = post.media_metadata[firstItem.media_id];
        const extension = this.extractExtension(metadata.m);
        return `https://i.redd.it/${firstItem.media_id}.${extension}`;
      }
    }
    
    // For videos, try to get a preview image
    if (post.preview?.images?.[0]?.source?.url) {
      return this.decodeHtmlEntities(post.preview.images[0].source.url);
    }
    
    // Fallback to Reddit's thumbnail if available and valid
    if (post.thumbnail && 
        post.thumbnail !== 'self' && 
        post.thumbnail !== 'default' && 
        post.thumbnail !== 'nsfw' && 
        post.thumbnail !== 'image' &&
        post.thumbnail.startsWith('http')) {
      return this.decodeHtmlEntities(post.thumbnail);
    }
    
    return '';
  }
  
  private decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
}

export const redditApi = new RedditApiService();