'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, Sparkles } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useAppStore } from '@/lib/store';

export function ChatContainer() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    saveSearch,
    shareConversation,
    setLoading,
    isLoading,
  } = useAppStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSend = async (content: string) => {
    let conversationId = activeConversationId;

    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = createConversation();
    }

    // Add user message
    addMessage(conversationId, {
      role: 'user',
      content,
    });

    // Add loading message
    const loadingMessageId = addMessage(conversationId, {
      role: 'assistant',
      content: '',
      isLoading: true,
    });

    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: activeConversation?.messages || [],
        }),
      });

      const result = await response.json();

      if (result.success) {
        updateMessage(conversationId, loadingMessageId, {
          content: result.content,
          data: result.data,
          isLoading: false,
        });
      } else {
        updateMessage(conversationId, loadingMessageId, {
          content: 'I encountered an error processing your request. Please try again.',
          error: result.error,
          isLoading: false,
        });
      }
    } catch (error) {
      updateMessage(conversationId, loadingMessageId, {
        content: 'Unable to connect to the server. Please check your connection and try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveData = (messageContent: string, data: any, apiType?: string) => {
    saveSearch({
      name: messageContent.slice(0, 50),
      query: messageContent,
      apiType: (apiType as any) || 'general',
      results: data,
    });
  };

  const handleShare = () => {
    if (activeConversationId) {
      const shareId = shareConversation(activeConversationId);
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      navigator.clipboard.writeText(shareUrl);
      setShareToast('Share link copied to clipboard!');
      setTimeout(() => setShareToast(null), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-zinc-400">
              {activeConversation ? activeConversation.title : 'New Chat'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600 bg-zinc-900 px-3 py-1.5 rounded-full">
            Fannie Mae APIs Connected
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {!activeConversation || activeConversation.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to RTLMAC</h2>
            <p className="text-zinc-400 text-center max-w-md mb-8">
              Your AI-powered gateway to Fannie Mae property and lending data.
              Ask about loan limits, housing markets, eligibility, and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
              {[
                {
                  title: 'Loan Limits',
                  description: 'Get conforming loan limits by state/county',
                  prompt: 'What are the conforming loan limits in California?',
                },
                {
                  title: 'Housing Pulse',
                  description: 'Real-time market data and trends',
                  prompt: 'Show me the current housing market data',
                },
                {
                  title: 'HomeReady Check',
                  description: 'Check AMI-based program eligibility',
                  prompt: 'Is $65,000 income eligible for HomeReady in Texas?',
                },
                {
                  title: 'Market Insights',
                  description: 'Manufactured housing statistics',
                  prompt: 'Show manufactured housing data for Florida',
                },
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleSend(item.prompt)}
                  className="group p-4 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 hover:border-emerald-500/30 rounded-2xl text-left transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {activeConversation.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onSave={
                  message.data
                    ? () => handleSaveData(message.content, message.data)
                    : undefined
                }
                onShare={handleShare}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-full shadow-lg animate-fade-in">
          {shareToast}
        </div>
      )}
    </div>
  );
}
