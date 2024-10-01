'use client'

import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'

const ChatHistory = dynamic(() => import('@/components/chat-history'), {
  ssr: false,
  loading: () => <p>Loading chat history...</p>
})

export default function ChatHistoryPage() {
  return (
    <Layout 
      title="チャット履歴 | ヘルスル（Healthle）" 
      description="ヘルスル（Healthle）のチャット履歴ページです。過去の健康相談や睡眠改善のアドバイスを確認できます。"
    >
      <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
        <ChatHistory />
      </div>
    </Layout>
  )
}