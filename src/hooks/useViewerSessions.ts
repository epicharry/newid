import { useState, useCallback, useEffect } from 'react';
import { ViewerSession, MediaItem, RedditSortType, MediaFilter, YouTubeVideo } from '../types/app';

export function useViewerSessions() {
  const [sessions, setSessions] = useState<ViewerSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Generate unique session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create a new session
  const createSession = useCallback((
    type: 'reddit' | 'rule34' | 'youtube',
    data: ViewerSession['data'],
    title?: string
  ): string => {
    const sessionId = generateSessionId();
    const now = new Date();
    
    const newSession: ViewerSession = {
      id: sessionId,
      type,
      title: title || type,
      icon: type,
      data,
      state: {
        mediaItems: [],
        isLoading: false,
        error: null,
        nextPageToken: null,
        currentPid: 0,
        hasMore: true,
        selectedMediaIndex: null,
      },
      createdAt: now,
      lastActiveAt: now,
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(sessionId);
    
    return sessionId;
  }, []);

  // Update session state
  const updateSession = useCallback((sessionId: string, updates: Partial<ViewerSession['state']>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            state: { ...session.state, ...updates },
            lastActiveAt: new Date()
          }
        : session
    ));
  }, []);

  // Update session data
  const updateSessionData = useCallback((sessionId: string, data: Partial<ViewerSession['data']>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            data: { ...session.data, ...data },
            lastActiveAt: new Date()
          }
        : session
    ));
  }, []);

  // Close a session
  const closeSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(session => session.id !== sessionId);
      
      // If we're closing the active session, switch to another one
      if (sessionId === activeSessionId) {
        const currentIndex = prev.findIndex(s => s.id === sessionId);
        const nextSession = filtered[currentIndex] || filtered[currentIndex - 1] || filtered[0];
        setActiveSessionId(nextSession?.id || null);
      }
      
      return filtered;
    });
  }, [activeSessionId]);

  // Switch to a session
  const switchToSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    
    // Update last active time
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, lastActiveAt: new Date() }
        : session
    ));
  }, []);

  // Get active session
  const getActiveSession = useCallback(() => {
    return sessions.find(session => session.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Get session by ID
  const getSession = useCallback((sessionId: string) => {
    return sessions.find(session => session.id === sessionId) || null;
  }, [sessions]);

  // Cycle through sessions (for Tab hotkey)
  const cycleToNextSession = useCallback(() => {
    if (sessions.length <= 1) return;
    
    const currentIndex = sessions.findIndex(s => s.id === activeSessionId);
    const nextIndex = (currentIndex + 1) % sessions.length;
    const nextSession = sessions[nextIndex];
    
    if (nextSession) {
      setActiveSessionId(nextSession.id);
    }
  }, [sessions, activeSessionId]);

  // Find existing session by criteria
  const findSession = useCallback((
    type: 'reddit' | 'rule34' | 'youtube',
    criteria: Partial<ViewerSession['data']>
  ) => {
    return sessions.find(session => {
      if (session.type !== type) return false;
      
      switch (type) {
        case 'reddit':
          return session.data.subreddit === criteria.subreddit &&
                 session.data.searchQuery === criteria.searchQuery &&
                 session.data.isSearchMode === criteria.isSearchMode;
        case 'rule34':
          return session.data.tags === criteria.tags;
        case 'youtube':
          return session.data.showViewer === criteria.showViewer;
        default:
          return false;
      }
    });
  }, [sessions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab to cycle sessions
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only handle if not in an input field
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          cycleToNextSession();
        }
      }
      
      // Ctrl+W to close active session
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeSessionId) {
        e.preventDefault();
        closeSession(activeSessionId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleToNextSession, closeSession, activeSessionId]);

  return {
    sessions,
    activeSessionId,
    createSession,
    updateSession,
    updateSessionData,
    closeSession,
    switchToSession,
    getActiveSession,
    getSession,
    findSession,
    cycleToNextSession,
  };
}