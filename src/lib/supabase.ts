import { MediaItem, MediaFolder } from '../types/app';

// Remove Supabase client since we're using custom auth
export const supabase = null;

export interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  custom_thumbnail?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseFolderMedia {
  id: string;
  folder_id: string;
  media_id: string;
  media_data: MediaItem;
  created_at: string;
}

// Simple hash function for passwords (in production, use bcrypt or similar)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mediavault_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class SupabaseService {
  private supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  private supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  constructor() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('Supabase environment variables not found');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.supabaseUrl}/rest/v1/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Database request failed:', error);
      throw new Error(`Database error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // Auth methods
  async signUp(username: string, password: string) {
    console.log('Creating user:', username);
    
    try {
      const hashedPassword = await hashPassword(password);
      
      const userData = {
        username: username.trim(),
        access_key: hashedPassword,
      };

      const result = await this.makeRequest('user_profiles', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log('User created successfully:', result);
      
      const user = Array.isArray(result) ? result[0] : result;
      return {
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        session: null,
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async signIn(username: string, password: string) {
    console.log('Signing in user:', username);
    
    try {
      const hashedPassword = await hashPassword(password);
      
      const result = await this.makeRequest(
        `user_profiles?username=eq.${encodeURIComponent(username.trim())}&access_key=eq.${hashedPassword}&select=*`
      );

      if (!result || result.length === 0) {
        throw new Error('Invalid username or password');
      }

      const user = result[0];
      console.log('User signed in successfully:', user);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        session: null,
      };
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  async signOut() {
    // Just clear local storage since we're using custom auth
    return Promise.resolve();
  }

  async getCurrentUser() {
    // Not applicable with custom auth
    return null;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const result = await this.makeRequest(`user_profiles?id=eq.${userId}&select=*`);
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Favorites methods
  async getFavoriteMedia(userId: string): Promise<string[]> {
    try {
      const result = await this.makeRequest(`user_favorites?user_id=eq.${userId}&select=media_id`);
      return result ? result.map((item: any) => item.media_id) : [];
    } catch (error) {
      console.error('Error fetching favorite media:', error);
      return [];
    }
  }

  async addFavoriteMedia(userId: string, mediaId: string, mediaData: MediaItem) {
    try {
      await this.makeRequest('user_favorites', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          media_id: mediaId,
          media_data: mediaData,
        }),
      });
    } catch (error) {
      console.error('Error adding favorite media:', error);
      throw error;
    }
  }

  async removeFavoriteMedia(userId: string, mediaId: string) {
    try {
      await this.makeRequest(`user_favorites?user_id=eq.${userId}&media_id=eq.${mediaId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing favorite media:', error);
      throw error;
    }
  }

  async getFavoriteMediaItems(userId: string): Promise<MediaItem[]> {
    try {
      const result = await this.makeRequest(
        `user_favorites?user_id=eq.${userId}&select=media_data&order=created_at.desc`
      );
      return result ? result.map((item: any) => item.media_data) : [];
    } catch (error) {
      console.error('Error fetching favorite media items:', error);
      return [];
    }
  }

  // Favorite subreddits methods
  async getFavoriteSubreddits(userId: string): Promise<string[]> {
    try {
      const result = await this.makeRequest(
        `user_favorite_subreddits?user_id=eq.${userId}&select=subreddit&order=created_at.desc`
      );
      return result ? result.map((item: any) => item.subreddit) : [];
    } catch (error) {
      console.error('Error fetching favorite subreddits:', error);
      return [];
    }
  }

  async addFavoriteSubreddit(userId: string, subreddit: string) {
    try {
      await this.makeRequest('user_favorite_subreddits', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          subreddit,
        }),
      });
    } catch (error) {
      console.error('Error adding favorite subreddit:', error);
      throw error;
    }
  }

  async removeFavoriteSubreddit(userId: string, subreddit: string) {
    try {
      await this.makeRequest(`user_favorite_subreddits?user_id=eq.${userId}&subreddit=eq.${encodeURIComponent(subreddit)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing favorite subreddit:', error);
      throw error;
    }
  }

  // Folders methods
  async getFolders(userId: string): Promise<MediaFolder[]> {
    try {
      const folders = await this.makeRequest(
        `user_folders?user_id=eq.${userId}&select=*&order=created_at.desc`
      );

      if (!folders) return [];

      // Get media items for each folder
      const foldersWithMedia = await Promise.all(
        folders.map(async (folder: any) => {
          const mediaData = await this.makeRequest(
            `user_folder_media?folder_id=eq.${folder.id}&select=media_data&order=created_at.desc`
          );

          return {
            id: folder.id,
            name: folder.name,
            color: folder.color,
            customThumbnail: folder.custom_thumbnail,
            mediaItems: mediaData ? mediaData.map((item: any) => item.media_data) : [],
            createdAt: new Date(folder.created_at),
          };
        })
      );

      return foldersWithMedia;
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }

  async createFolder(userId: string, name: string, color: string): Promise<string> {
    try {
      const result = await this.makeRequest('user_folders', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          name,
          color,
        }),
      });

      const folder = Array.isArray(result) ? result[0] : result;
      return folder.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async deleteFolder(userId: string, folderId: string) {
    try {
      await this.makeRequest(`user_folders?id=eq.${folderId}&user_id=eq.${userId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  async renameFolder(userId: string, folderId: string, newName: string) {
    try {
      await this.makeRequest(`user_folders?id=eq.${folderId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      });
    } catch (error) {
      console.error('Error renaming folder:', error);
      throw error;
    }
  }

  async setFolderThumbnail(userId: string, folderId: string, thumbnailUrl: string) {
    try {
      await this.makeRequest(`user_folders?id=eq.${folderId}&user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ custom_thumbnail: thumbnailUrl }),
      });
    } catch (error) {
      console.error('Error setting folder thumbnail:', error);
      throw error;
    }
  }

  async addMediaToFolder(folderId: string, mediaId: string, mediaData: MediaItem) {
    try {
      await this.makeRequest('user_folder_media', {
        method: 'POST',
        body: JSON.stringify({
          folder_id: folderId,
          media_id: mediaId,
          media_data: mediaData,
        }),
      });
    } catch (error) {
      console.error('Error adding media to folder:', error);
      throw error;
    }
  }

  async removeMediaFromFolder(folderId: string, mediaId: string) {
    try {
      await this.makeRequest(`user_folder_media?folder_id=eq.${folderId}&media_id=eq.${mediaId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing media from folder:', error);
      throw error;
    }
  }

  // Sync methods for migrating localStorage data
  async syncLocalStorageToCloud(userId: string, localData: {
    favoriteMedia: string[];
    favoriteSubreddits: string[];
    mediaFolders: MediaFolder[];
  }, allMediaItems: MediaItem[]) {
    try {
      // Sync favorite subreddits
      for (const subreddit of localData.favoriteSubreddits) {
        try {
          await this.addFavoriteSubreddit(userId, subreddit);
        } catch (error) {
          console.warn('Subreddit already exists:', subreddit);
        }
      }

      // Sync favorite media
      for (const mediaId of localData.favoriteMedia) {
        const mediaItem = allMediaItems.find(item => item.id === mediaId);
        if (mediaItem) {
          try {
            await this.addFavoriteMedia(userId, mediaId, mediaItem);
          } catch (error) {
            console.warn('Media already favorited:', mediaId);
          }
        }
      }

      // Sync folders
      for (const folder of localData.mediaFolders) {
        try {
          const folderId = await this.createFolder(userId, folder.name, folder.color);
          
          // Add custom thumbnail if exists
          if (folder.customThumbnail) {
            await this.setFolderThumbnail(userId, folderId, folder.customThumbnail);
          }

          // Add media items to folder
          for (const mediaItem of folder.mediaItems) {
            try {
              await this.addMediaToFolder(folderId, mediaItem.id, mediaItem);
            } catch (error) {
              console.warn('Error adding media to folder:', error);
            }
          }
        } catch (error) {
          console.warn('Error creating folder:', folder.name, error);
        }
      }
    } catch (error) {
      console.error('Error syncing localStorage to cloud:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();