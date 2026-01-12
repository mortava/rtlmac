import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Conversation, Message, SavedSearch, UserPreferences } from '@/types';

interface AppState {
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;

  // Saved Data
  savedSearches: SavedSearch[];

  // UI State
  sidebarOpen: boolean;
  isLoading: boolean;

  // User Preferences
  preferences: UserPreferences;

  // Actions
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  updateConversationTitle: (id: string, title: string) => void;

  // Saved Searches
  saveSearch: (search: Omit<SavedSearch, 'id' | 'createdAt'>) => void;
  deleteSavedSearch: (id: string) => void;

  // Share
  shareConversation: (id: string) => string;

  // UI Actions
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;

  // Preferences
  updatePreferences: (prefs: Partial<UserPreferences>) => void;

  // Get current conversation
  getCurrentConversation: () => Conversation | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      conversations: [],
      activeConversationId: null,
      savedSearches: [],
      sidebarOpen: true,
      isLoading: false,
      preferences: {
        theme: 'dark',
        notifications: true,
        autoSave: true,
      },

      // Conversation Actions
      createConversation: () => {
        const id = uuidv4();
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId: state.activeConversationId === id
            ? (state.conversations[0]?.id ?? null)
            : state.activeConversationId,
        }));
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, message) => {
        const messageId = uuidv4();
        const fullMessage: Message = {
          ...message,
          id: messageId,
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, fullMessage],
                  updatedAt: new Date(),
                  title: conv.messages.length === 0 && message.role === 'user'
                    ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                    : conv.title,
                }
              : conv
          ),
        }));

        return messageId;
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
          ),
        }));
      },

      // Saved Searches
      saveSearch: (search) => {
        const newSearch: SavedSearch = {
          ...search,
          id: uuidv4(),
          createdAt: new Date(),
        };

        set((state) => ({
          savedSearches: [newSearch, ...state.savedSearches],
        }));
      },

      deleteSavedSearch: (id) => {
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id),
        }));
      },

      // Share
      shareConversation: (id) => {
        const shareId = uuidv4().slice(0, 8);

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, shared: true, shareId } : conv
          ),
        }));

        return shareId;
      },

      // UI Actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Preferences
      updatePreferences: (prefs) => {
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }));
      },

      // Get current conversation
      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.activeConversationId) ?? null;
      },
    }),
    {
      name: 'rtlmac-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        savedSearches: state.savedSearches,
        preferences: state.preferences,
      }),
    }
  )
);
