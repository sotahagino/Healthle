import type { Metadata } from 'next'
import PastConsultations from '@/components/past-consultations'

export const metadata: Metadata = {
  title: 'ヘルスル（Healthle）',
  description: 'ヘルスル（Healthle）の過去の相談履歴ページです。これまでの健康相談や睡眠改善のアドバイスを確認できます。',
  openGraph: {
    title: 'ヘルスル（Healthle）',
    description: 'ヘルスル（Healthle）の過去の相談履歴ページです。これまでの健康相談や睡眠改善のアドバイスを確認できます。',
    images: [
      {
        url: 'https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/healthlesocialshare_v2_1017.png?t=2024-10-17T02%3A47%3A07.795Z',
        width: 1200,
        height: 630,
        alt: 'ヘルスル（Healthle）過去の相談履歴',
      },
    ],
  },
}

export default function PastConsultationsPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <PastConsultations />
    </div>
  )
}