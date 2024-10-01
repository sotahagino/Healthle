import Head from 'next/head'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function Layout({
  children,
  title = "ヘルスル（Healthle）-無料の健康相談サービス",
  description = "「ヘルスル (Healthle)」は、健康相談と睡眠改善に特化した無料サービスです。簡単なタップ操作で、自分に合った情報やアドバイスを素早く得られ、健康をサポートします。健康の悩みを24時間いつでも無料で解決する「ヘルスル」で、より良い睡眠と生活を手に入れましょう。"
}: LayoutProps) {
  const seoTitle = "「ヘルスル(Healthle)」 健康相談・睡眠改善を24時間いつでも無料で"
  const siteUrl = "https://healthle.jp" // サイトのURLを適切に設定してください
  const faviconUrl = "https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlefavicon32.png?t=2024-10-01T05%3A16%3A21.255Z"
  const socialShareImage = "https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlesocialshare.png"

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href={faviconUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={socialShareImage} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={siteUrl} />
        <meta property="twitter:title" content={seoTitle} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={socialShareImage} />

        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Japanese" />
        <link rel="canonical" href={siteUrl} />
      </Head>
      {children}
    </>
  )
}