'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const ChatInterfaceComponent = dynamic(() => import("@/components/chat-interface"), {
  loading: () => <p>Loading chat interface...</p>
})

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <Suspense fallback={<p>Loading chat interface...</p>}>
        <ChatInterfaceComponent />
      </Suspense>
    </div>
  );
}