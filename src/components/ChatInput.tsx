'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const QUICK_PROMPTS = [
  { label: 'Loan Limits', prompt: 'What are the conforming loan limits in California?' },
  { label: 'Housing Market', prompt: 'Show me the housing market pulse data' },
  { label: 'HomeReady', prompt: 'Is $70,000 income eligible for HomeReady in Texas?' },
  { label: 'Manufactured Housing', prompt: 'Show manufactured housing statistics' },
];

export function ChatInput({ onSend, disabled, placeholder = 'Ask about loan limits, housing data, eligibility...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!disabled) {
      onSend(prompt);
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      {/* Quick prompts */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => handleQuickPrompt(item.prompt)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-full whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 pt-0">
        <div className="relative flex items-end gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-zinc-500 resize-none focus:outline-none px-3 py-2 max-h-[200px] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-teal-500"
          >
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-zinc-600 text-center mt-2">
          RTLMAC connects to Fannie Mae APIs for real-time property and lending data
        </p>
      </form>
    </div>
  );
}
