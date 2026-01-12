'use client';

import { format } from 'date-fns';
import { Bot, User, Copy, Check, Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import type { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  onSave?: () => void;
  onShare?: () => void;
}

export function ChatMessage({ message, onSave, onShare }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isLoading = message.isLoading;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering
    let html = content;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-white">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-white">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-white">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-900 p-3 rounded-lg my-2 overflow-x-auto"><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`(.*?)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400">$1</code>');

    // Tables
    html = html.replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => c.trim().match(/^-+$/))) {
        return ''; // Skip separator row
      }
      const isHeader = cells[0] && !match.includes('$');
      const cellTag = isHeader ? 'th' : 'td';
      const cellClass = isHeader
        ? 'px-4 py-2 text-left font-semibold text-zinc-300 border-b border-zinc-700'
        : 'px-4 py-2 text-zinc-300 border-b border-zinc-800';
      const row = cells.map(c => `<${cellTag} class="${cellClass}">${c.trim()}</${cellTag}>`).join('');
      return `<tr>${row}</tr>`;
    });

    // Wrap tables
    if (html.includes('<tr>')) {
      html = html.replace(/(<tr>[\s\S]*?<\/tr>)+/g, '<table class="w-full my-4 border-collapse bg-zinc-900/50 rounded-lg overflow-hidden">$&</table>');
    }

    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 text-zinc-300">$1</li>');
    html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc list-inside my-2 space-y-1">$&</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p class="my-3 text-zinc-300">');
    html = html.replace(/\n/g, '<br/>');

    // Links (basic)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-emerald-400 hover:text-emerald-300 underline" target="_blank">$1</a>');

    return `<div class="prose prose-invert max-w-none"><p class="text-zinc-300">${html}</p></div>`;
  };

  return (
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-zinc-900/30' : 'bg-zinc-900/60'} ${!isUser ? 'border-l-2 border-emerald-500/50' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-white">
            {isUser ? 'You' : 'RTLMAC'}
          </span>
          <span className="text-xs text-zinc-500">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
            </div>
            <span>Analyzing your request...</span>
          </div>
        ) : (
          <>
            <div
              className="text-zinc-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />

            {/* Action buttons for assistant messages */}
            {!isUser && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {message.data && onSave && (
                  <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Data</span>
                  </button>
                )}

                {onShare && (
                  <button
                    onClick={onShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {message.error && (
          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
}
