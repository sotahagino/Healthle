import type { Metadata } from 'next'
import ImprovedHealthleDashboardComponent from "@/components/improved-healthle-dashboard"

export const metadata: Metadata = {
  title: 'ヘルスル（Healthle）',
  description: '「ヘルスル (Healthle)」は、健康相談と睡眠改善に特化した無料サービスです。簡単なタップ操作で、自分に合った情報やアドバイスを素早く得られ、健康をサポートします。',
  openGraph: {
    title: '「ヘルスル(Healthle)」 健康相談・睡眠改善を24時間いつでも無料で',
    description: '「ヘルスル (Healthle)」は、健康相談と睡眠改善に特化した無料サービスです。簡単なタップ操作で、自分に合った情報やアドバイスを素早く得られ、健康をサポートします。健康の悩みを24時間いつでも無料で解決する「ヘルスル」で、より良い睡眠と生活を手に入れましょう。',
    images: [
      {
        url: 'https://kqhjzzyaoehlmeileaii.supabase.co/storage/v1/object/public/Healthle/healthlesocialshare_1010.png',
        width: 1200,
        height: 630,
        alt: 'ヘルスル（Healthle）ホームページ',
      },
    ],
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <ImprovedHealthleDashboardComponent />
    </div>
  )
}