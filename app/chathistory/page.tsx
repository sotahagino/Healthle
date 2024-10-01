'use client'

import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

const ChatHistory = dynamic(() => import('@/components/chat-history'), {
  ssr: false,
  loading: () => <p>Loading chat history...</p>
})

export const metadata: Metadata = {
  title: 'チャット履歴 | ヘルスル（Healthle）',
  description: 'ヘルスル（Healthle）のチャット履歴ページです。過去の健康相談や睡眠改善のアドバイスを確認できます。',
  openGraph: {
    title: 'チャット履歴 | ヘルスル（Healthle）',
    description: 'ヘルスル（Healthle）のチャット履歴ページです。過去の健康相談や睡眠改善のアドバイスを確認できます。',
    images: [
      {
        url: 'https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlesocialshare.png',
        width: 1200,
        height: 630,
        alt: 'ヘルスル（Healthle）チャット履歴',
      },
    ],
  },
}

export default function ChatHistoryPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <ChatHistory />
    </div>
  )
}