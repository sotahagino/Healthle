import Layout from '@/components/Layout'
import SettingsPage from '@/components/settings'

export default function Settings() {
  return (
    <Layout 
      title="設定 | ヘルスル（Healthle）"
      description="ヘルスル（Healthle）の設定ページです。アカウント情報の管理や通知設定、プライバシー設定などをカスタマイズできます。"
    >
      <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
        <SettingsPage />
      </div>
    </Layout>
  )
}