'use client'

import { Suspense } from 'react';
import QuestionnaireComponentBase from "@/components/pages-questionnaire";
import type { Metadata } from 'next'

interface QuestionnairePageProps {
  searchParams: { concern?: string };
}

export const generateMetadata = ({ searchParams }: QuestionnairePageProps): Metadata => {
  const concern = searchParams.concern ?? null;
  return {
    title: `健康質問票 | ヘルスル（Healthle）${concern ? ` - ${concern}` : ''}`,
    description: "ヘルスル（Healthle）の健康質問票ページです。あなたの健康状態や悩みについて詳しく教えてください。専門家からのアドバイスに役立てます。",
    openGraph: {
      title: `健康質問票 | ヘルスル（Healthle）${concern ? ` - ${concern}` : ''}`,
      description: "ヘルスル（Healthle）の健康質問票ページです。あなたの健康状態や悩みについて詳しく教えてください。専門家からのアドバイスに役立てます。",
      images: [
        {
          url: 'https://qqaqarsktglvbenfigek.supabase.co/storage/v1/object/public/Healthle_image/healthlesocialshare.png',
          width: 1200,
          height: 630,
          alt: 'ヘルスル（Healthle）健康質問票',
        },
      ],
    },
  };
};

export default function QuestionnairePage({ searchParams }: QuestionnairePageProps) {
  const concern = searchParams.concern ?? null;

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      <Suspense fallback={<div>Loading...</div>}>
        {concern && <QuestionnaireComponentBase concern={concern} />}
      </Suspense>
    </div>
  );
}