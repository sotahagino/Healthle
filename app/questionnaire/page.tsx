'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QuestionnaireComponentBase from "../../components/pages-questionnaire";

interface QuestionnaireComponentBaseProps {
  concern: string;
}

export default function QuestionnairePage({ concern: initialConcern }: { concern: string }) {
  const [concern, setConcern] = useState<string | null>(initialConcern);
  const searchParams = useSearchParams();

  useEffect(() => {
    const concernParam = searchParams.get('concern');
    if (concernParam) {
      setConcern(concernParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#333333] font-sans">
      {concern && <QuestionnaireComponentBase concern={concern} />}
    </div>
  );
}