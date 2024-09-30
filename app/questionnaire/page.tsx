import { Suspense } from 'react';
import QuestionnaireComponentBase from "../../components/pages-questionnaire";

interface QuestionnairePageProps {
  searchParams: { concern?: string };
}

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