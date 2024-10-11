import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'チャット履歴 | ヘルスル（Healthle）',
  description: 'ヘルスル（Healthle）のチャット履歴ページです。過去の健康相談や睡眠改善のアドバイスを確認できます。',
  openGraph: {
    title: 'チャット履歴 | ヘルスル（Healthle）',
    description: 'ヘルスル（Healthle）のチャット履歴ページです。過去の健康相談や睡眠改善のアドバイスを確認できます。',
    images: [
      {
        url: 'https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/healthlesocialshare_1010.png',
        width: 1200,
        height: 630,
        alt: 'ヘルスル（Healthle）チャット履歴',
      },
    ],
  },
}

const ChatHistory = dynamic(() => import('@/components/chat-history'), {
  loading: () => <p>Loading chat history...</p>
})

export default function ChatHistoryPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <ChatHistory />
    </div>
  )
}