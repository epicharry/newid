import { MediaItem } from '../types/app';

interface Rule34Post {
  id: number;
  file_url: string;
  preview_url: string;
  sample_url: string;
  width: number;
  height: number;
  rating: string;
  tags: string;
  directory: number;
  hash: string;
  image: string;
  change: number;
  owner: string;
  parent_id: number;
  sample: boolean;
  sample_height: number;
  sample_width: number;
  score: number;
  source: string;
  status: string;
  has_notes: boolean;
  comment_count: number;
}

class Rule34ApiService {
  private baseUrl = 'https://api.rule34.xxx/index.php';
  private apiKey = '5112b2c9608d7d1b3c550b7bc63f007289ba0e3a74f437763cdafe68c1aca6611923e629cf59e07883cda0877f04921bc56b79efe00c489eef7f53b1f47e882a';
  private userId = '5263157';

  async fetchPosts(tags: string, pid: number = 0): Promise<{ items: MediaItem[], nextPage: number | null }> {
    try {
      const url = `${this.baseUrl}?page=dapi&s=post&q=index&json=1&limit=100&tags=${encodeURIComponent(tags)}&pid=${pid}&api_key=${this.apiKey}&user_id=${this.userId}`;
      
      console.log('Fetching Rule34 posts:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Rule34 API error: ${response.status} ${response.statusText}`);
      }
      
      const posts: Rule34Post[] = await response.json();
      
      if (!Array.isArray(posts)) {
        throw new Error('Invalid response format from Rule34 API');
      }
      
      console.log(`Fetched ${posts.length} posts from Rule34`);
      
      const mediaItems = posts.map(post => this.transformToMediaItem(post));
      
      return {
        items: mediaItems,
        nextPage: posts.length === 100 ? pid + 1 : null
      };
    } catch (error) {
      console.error('Rule34 API error:', error);
      throw error;
    }
  }

  private transformToMediaItem(post: Rule34Post): MediaItem {
    const isVideo = this.isVideoFile(post.file_url);
    
    console.log('Checking file URL:', post.file_url);
    console.log('Is video?', isVideo);
    
    const baseItem = {
      id: post.id.toString(),
      title: `Rule34 Post #${post.id}`,
      source: 'rule34' as const,
      score: post.score,
      author: post.owner,
      permalink: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`,
      thumbnail: post.file_url,
      url: post.file_url,
      created: new Date(post.change * 1000),
      numComments: post.comment_count || 0,
      nsfw: true, // Rule34 content is always NSFW
    };

    if (isVideo) {
      return {
        ...baseItem,
        type: 'video' as const,
        videoData: {
          fallback_url: post.file_url,
          has_audio: true, // Assume videos have audio
          duration: 0, // Duration not provided by API
          width: post.width,
          height: post.height,
        },
      };
    } else {
      return {
        ...baseItem,
        type: 'image' as const,
      };
    }
  }

  private isVideoFile(url: string): boolean {
    if (!url) return false;
    
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    
    return videoExtensions.some(ext => lowerUrl.endsWith(ext));
  }
}

export const rule34Api = new Rule34ApiService();