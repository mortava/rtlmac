'use client';

import { Sidebar } from '@/components/Sidebar';
import { ChatContainer } from '@/components/ChatContainer';

export default function Home() {
  return (
    <main className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar />
      <ChatContainer />
    </main>
  );
}
