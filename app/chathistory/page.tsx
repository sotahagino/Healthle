import dynamic from 'next/dynamic'

const ChatHistory = dynamic(() => import('@/components/chat-history'), {
  ssr: false
})

export default function ChatHistoryPage() {
  return <ChatHistory />
}