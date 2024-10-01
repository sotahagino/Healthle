'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Layout from '@/components/Layout'

const ChatInterfaceComponent = dynamic(() => import("@/components/chat-interface"), {
  loading: () => <p>Loading chat interface...</p>
})

export default function ChatPage() {
  return (
    <Layout title="チャット | ヘルスル（Healthle）" description="ヘルスル（Healthle）のチャットインターフェースで、24時間いつでも無料で健康相談や睡眠改善のアドバイスを受けられます。">
      <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
        <Suspense fallback={<p>Loading chat interface...</p>}>
          <ChatInterfaceComponent />
        </Suspense>
      </div>
    </Layout>
  );
}