import Layout from '@/components/Layout'
import PastConsultations from '@/components/past-consultations'

export default function PastConsultationsPage() {
  return (
    <Layout 
      title="過去の相談履歴 | ヘルスル（Healthle）" 
      description="ヘルスル（Healthle）の過去の相談履歴ページです。これまでの健康相談や睡眠改善のアドバイスを確認できます。"
    >
      <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
        <PastConsultations />
      </div>
    </Layout>
  )
}