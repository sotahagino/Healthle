import type { Metadata } from 'next'
import SettingsPage from '@/components/settings'

export const metadata: Metadata = {
  title: 'ヘルスル（Healthle）',
  description: 'ヘルスル（Healthle）の設定ページです。アカウント情報の管理や通知設定、プライバシー設定などをカスタマイズできます。',
  openGraph: {
    title: 'ヘルスル（Healthle）',
    description: 'ヘルスル（Healthle）の設定ページです。アカウント情報の管理や通知設定、プライバシー設定などをカスタマイズできます。',
    images: [
      {
        url: 'https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/healthlesocialshare_v2_1017.png?t=2024-10-17T02%3A47%3A07.795Z',
        width: 1200,
        height: 630,
        alt: 'ヘルスル（Healthle）設定ページ',
      },
    ],
  },
}

export default function Settings() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <SettingsPage />
    </div>
  )
}