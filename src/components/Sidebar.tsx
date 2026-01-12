'use client';

import { format } from 'date-fns';
import {
  MessageSquarePlus,
  Trash2,
  Search,
  BookmarkIcon,
  Settings,
  ChevronLeft,
  Share2,
  Database,
  Building2,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    savedSearches,
    sidebarOpen,
    createConversation,
    deleteConversation,
    setActiveConversation,
    toggleSidebar,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'saved'>('chats');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!sidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>
    );
  }

  return (
    <aside className="w-80 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">RTLMAC</h1>
              <p className="text-[10px] text-zinc-500 -mt-0.5">Real-Time Lending Machine AI</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'chats'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'saved'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Saved Data
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <div className="p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                <MessageSquarePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    activeConversationId === conv.id
                      ? 'bg-zinc-800/80'
                      : 'hover:bg-zinc-900'
                  }`}
                  onClick={() => setActiveConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {format(new Date(conv.updatedAt), 'MMM d, h:mm a')}
                    </p>
                    {conv.shared && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                        <Share2 className="w-3 h-3" />
                        Shared
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No saved data yet</p>
                <p className="text-xs mt-1">Save query results for quick access</p>
              </div>
            ) : (
              savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-900 cursor-pointer transition-all"
                >
                  <BookmarkIcon className="w-4 h-4 text-emerald-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {search.name}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {search.query}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {format(new Date(search.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <button className="w-full flex items-center gap-2 p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>

        <div className="mt-3 px-2 py-2 bg-zinc-900/50 rounded-lg">
          <p className="text-[10px] text-zinc-600 text-center">
            Powered by Fannie Mae APIs
          </p>
          <p className="text-[10px] text-zinc-700 text-center mt-0.5">
            v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
}
