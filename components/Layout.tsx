import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ヘルスル（Healthle）-無料の健康相談サービス',
    template: '%s | ヘルスル（Healthle）'
  },
  description: '「ヘルスル (Healthle)」は、健康相談と睡眠改善に特化した無料サービスです。簡単なタップ操作で、自分に合った情報やアドバイスを素早く得られ、健康をサポートします。健康の悩みを24時間いつでも無料で解決する「ヘルスル」で、より良い睡眠と生活を手に入れましょう。',
  icons: {
    icon: 'https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlefavicon32.png?t=2024-10-01T05%3A16%3A21.255Z',
    apple: 'https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlefavicon32.png?t=2024-10-01T05%3A16%3A21.255Z',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://healthle.jp',
    siteName: 'ヘルスル（Healthle）',
    title: '「ヘルスル(Healthle)」 健康相談・睡眠改善を24時間いつでも無料で',
    description: '「ヘルスル (Healthle)」は、健康相談と睡眠改善に特化した無料サービスです。簡単なタップ操作で、自分に合った情報やアドバイスを素早く得られ、健康をサポートします。健康の悩みを24時間いつでも無料で解決する「ヘルスル」で、より良い睡眠と生活を手に入れましょう。',
    images: [{
      url: 'https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlesocialshare.png',
      width: 1200,
      height: 630,
      alt: 'ヘルスル（Healthle）ソーシャルシェア画像',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '「ヘルスル(Healthle)」 健康相談・睡眠改善を24時間いつでも無料で',
    description: '「ヘルスル (Healthle)」は、健康相談と睡眠改善に特化した無料サービスです。簡単なタップ操作で、自分に合った情報やアドバイスを素早く得られ、健康をサポートします。',
    images: ['https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlesocialshare.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  //verification: {
    //google: 'あなたのGoogle Search Console確認コード',
    //yandex: 'あなたのYandex確認コード',
   // yahoo: 'あなたのYahoo確認コード',
 // },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  )
}