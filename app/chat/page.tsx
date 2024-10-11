import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'チャット | ヘルスル（Healthle）',
  description: 'ヘルスル（Healthle）のチャットインターフェースで、24時間いつでも無料で健康相談や睡眠改善のアドバイスを受けられます。',
  openGraph: {
    title: 'チャット | ヘルスル（Healthle）',
    description: 'ヘルスル（Healthle）のチャットインターフェースで、24時間いつでも無料で健康相談や睡眠改善のアドバイスを受けられます。',
    images: [
      {
        url: 'https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/healthlesocialshare_1010.png',
        width: 1200,
        height: 630,
        alt: 'ヘルスル（Healthle）チャットインターフェース',
      },
    ],
  },
}

const ChatInterfaceComponent = dynamic(() => import("@/components/chat-interface"), {
  loading: () => <p>Loading chat interface...</p>
})

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <ChatInterfaceComponent />
    </div>
  )
}