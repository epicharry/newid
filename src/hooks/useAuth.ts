import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabaseService, UserProfile } from '../lib/supabase';

const AUTH_STORAGE_KEY = 'mediavault_auth_session';
const SESSION_EXPIRY_DAYS = 365; // 1 year for permanent login

interface AuthSession {
  user: UserProfile;
  timestamp: number;
  expiresAt: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSession = (userData: UserProfile) => {
    const now = Date.now();
    const session: AuthSession = {
      user: userData,
      timestamp: now,
      expiresAt: now + (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
    
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      console.log('✅ Session saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save session:', error);
    }
  };

  const loadSession = (): UserProfile | null => {
    try {
      const sessionData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!sessionData) {
        console.log('📝 No existing session found');
        return null;
      }

      const session: AuthSession = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session has expired
      if (now > session.expiresAt) {
        console.log('⏰ Session expired, clearing...');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      // Extend session expiry when restored
      session.expiresAt = now + (SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      
      console.log('✅ Session restored and extended');
      return session.user;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('✅ Session cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  };

  useEffect(() => {
    // Check for existing persistent session
    const getInitialUser = async () => {
      try {
        const userData = loadSession();
        if (userData) {
          setUser(userData);
          setUserProfile(userData);
          console.log('🔐 User automatically logged in from persistent session');
        } else {
          console.log('👤 No valid session found, user needs to log in');
        }
      } catch (error) {
        console.error('❌ Error restoring session:', error);
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    getInitialUser();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const data = await supabaseService.signIn(username, password);
      if (data.user) {
        setUser(data.user);
        setUserProfile(data.user);
        // Save persistent session
        saveSession(data.user);
        console.log('🔐 User signed in with persistent session:', data.user.username);
      }
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      console.log('📝 Starting signup process...');
      const data = await supabaseService.signUp(username, password);
      console.log('✅ Signup completed:', data);
      
      if (data.user) {
        setUser(data.user);
        setUserProfile(data.user);
        // Save persistent session
        saveSession(data.user);
        console.log('🔐 New user signed up with persistent session:', data.user.username);
      }
      
      return data;
    } catch (error) {
      console.error('Signup error in hook:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabaseService.signOut();
    setUser(null);
    setUserProfile(null);
    // Clear persistent session
    clearSession();
    console.log('👋 User signed out, session cleared');
  };

  return {
    user,
    userProfile,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}