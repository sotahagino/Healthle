import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Script from 'next/script'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ホーム | ヘルスル（Healthle）",
  description: "「ヘルスル (Healthle)」は、健康相談と睡眠改善に特化した無料サービスです。簡単なタップ操作で、自分に合った情報やアドバイスを素早く得られ、健康をサポートします。",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-54LRK465');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <noscript>
          <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-54LRK465"
            height="0" width="0" style={{display: 'none', visibility: 'hidden'}}></iframe>
        </noscript>
        {children}
      </body>
    </html>
  );
}
