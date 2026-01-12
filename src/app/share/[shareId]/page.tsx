'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Building2, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import type { Conversation } from '@/types';
import { ChatMessage } from '@/components/ChatMessage';

export default function SharedConversation() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from a database
    // For now, we'll check local storage
    const stored = localStorage.getItem('rtlmac-storage');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const found = data.state?.conversations?.find(
          (c: Conversation) => c.shareId === shareId
        );
        if (found) {
          setConversation(found);
        } else {
          setError('Shared conversation not found');
        }
      } catch (e) {
        setError('Error loading conversation');
      }
    } else {
      setError('Shared conversation not found');
    }
  }, [shareId]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
          <Building2 className="w-8 h-8 text-zinc-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Conversation Not Found</h1>
        <p className="text-zinc-500 text-center max-w-md mb-8">
          This shared conversation may have been deleted or the link is invalid.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to RTLMAC
        </Link>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-white">RTLMAC</h1>
                <p className="text-xs text-zinc-500">Shared Conversation</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-500">
            <Share2 className="w-4 h-4" />
            <span className="text-sm">
              Shared on {format(new Date(conversation.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-white mb-2">{conversation.title}</h2>
          <p className="text-zinc-500 text-sm mb-8">
            {conversation.messages.length} messages
          </p>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {conversation.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-12 text-center border-t border-zinc-800">
          <p className="text-zinc-500 text-sm mb-4">
            Want to explore Fannie Mae data yourself?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl transition-all"
          >
            <Building2 className="w-4 h-4" />
            Start Using RTLMAC
          </Link>
        </div>
      </main>
    </div>
  );
}
