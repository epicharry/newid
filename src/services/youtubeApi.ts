import { YouTubeVideo } from '../types/app';

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: {
        high: {
          url: string;
        };
      };
      publishedAt: string;
      description: string;
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount: string;
    };
  }>;
}

class YouTubeApiService {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  async searchVideos(
    query: string, 
    apiKey: string, 
    maxResults: number = 25,
    pageToken?: string
  ): Promise<{ videos: YouTubeVideo[], nextPageToken?: string }> {
    try {
      let url = `${this.baseUrl}/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${apiKey}`;
      
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Invalid YouTube API key or quota exceeded');
        }
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data: YouTubeSearchResponse = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return { videos: [], nextPageToken: undefined };
      }

      // Get video IDs for additional details
      const videoIds = data.items.map(item => item.id.videoId).join(',');
      
      // Fetch video details (duration, view count)
      const detailsUrl = `${this.baseUrl}/videos?part=contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      
      let videoDetails: YouTubeVideoDetailsResponse | null = null;
      if (detailsResponse.ok) {
        videoDetails = await detailsResponse.json();
      }

      const videos: YouTubeVideo[] = data.items.map(item => {
        const details = videoDetails?.items.find(detail => detail.id === item.id.videoId);
        
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high.url,
          duration: details?.contentDetails.duration || 'PT0S',
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
          viewCount: details?.statistics.viewCount || '0',
        };
      });

      return {
        videos,
        nextPageToken: data.nextPageToken
      };
    } catch (error) {
      console.error('YouTube API error:', error);
      throw error;
    }
  }

  formatDuration(duration: string): string {
    // Parse ISO 8601 duration format (PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  formatViewCount(viewCount: string): string {
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    } else {
      return `${count} views`;
    }
  }
}

export const youtubeApi = new YouTubeApiService();