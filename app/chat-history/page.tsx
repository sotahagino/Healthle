import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ヘルスル（Healthle）',
  description: 'ヘルスル（Healthle）のチャット履歴ページです。過去の健康相談や睡眠改善のアドバイスを確認できます。',
  openGraph: {
    title: 'ヘルスル（Healthle）',
    description: 'ヘルスル（Healthle）のチャット履歴ページです。過去の健康相談や睡眠改善のアドバイスを確認できます。',
    images: [
      {
        url: 'https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/healthlesocialshare_v2_1017.png?t=2024-10-17T02%3A47%3A07.795Z',
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