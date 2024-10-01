'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

const ChatInterfaceComponent = dynamic(() => import("@/components/chat-interface"), {
  loading: () => <p>Loading chat interface...</p>
})

export const metadata: Metadata = {
  title: 'チャット | ヘルスル（Healthle）',
  description: 'ヘルスル（Healthle）のチャットインターフェースで、24時間いつでも無料で健康相談や睡眠改善のアドバイスを受けられます。',
  openGraph: {
    title: 'チャット | ヘルスル（Healthle）',
    description: 'ヘルスル（Healthle）のチャットインターフェースで、24時間いつでも無料で健康相談や睡眠改善のアドバイスを受けられます。',
    images: [
      {
        url: 'https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlesocialshare.png',
        width: 1200,
        height: 630,
        alt: 'ヘルスル（Healthle）チャットインターフェース',
      },
    ],
  },
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <Suspense fallback={<p>Loading chat interface...</p>}>
        <ChatInterfaceComponent />
      </Suspense>
    </div>
  )
}