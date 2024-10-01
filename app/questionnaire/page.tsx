import { Suspense } from 'react';
import Layout from '@/components/Layout';
import QuestionnaireComponentBase from "@/components/pages-questionnaire";

interface QuestionnairePageProps {
  searchParams: { concern?: string };
}

export default function QuestionnairePage({ searchParams }: QuestionnairePageProps) {
  const concern = searchParams.concern ?? null;

  return (
    <Layout 
      title={`健康質問票 | ヘルスル（Healthle）${concern ? ` - ${concern}` : ''}`}
      description="ヘルスル（Healthle）の健康質問票ページです。あなたの健康状態や悩みについて詳しく教えてください。専門家からのアドバイスに役立てます。"
    >
      <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          {concern && <QuestionnaireComponentBase concern={concern} />}
        </Suspense>
      </div>
    </Layout>
  );
}