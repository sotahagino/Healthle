'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronRight, Loader2, Menu } from 'lucide-react';
import Image from 'next/image';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Question {
  id: number;
  text: string;
  type: 'number' | 'select' | 'multiline' | 'select-with-other';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  allowNone?: boolean;
}

interface Answer {
  question: string;
  answer: string | number | string[];
}

const staticQuestions: Question[] = [
  { id: 1, text: '年代', type: 'select', options: ['10代', '20代', '30代', '40代', '50代', '60代', '70代以上'] },
  { id: 2, text: '喫煙していますか？', type: 'select', options: ['はい', 'いいえ', '過去に喫煙していた'] },
  { id: 3, text: '飲酒の頻度', type: 'select', options: ['飲まない', '月1回以下', '月2〜4回', '週2〜3回', '週4回以上'] },
  { id: 4, text: '週にどれくらい運動していますか？', type: 'select', options: ['運動していない', '週1-2回', '週3回以上'] },
  { id: 5, text: '現在のストレスレベルを教えてください。', type: 'select', options: ['低い', 'やや低い', 'やや高い', '高い'] },
  { id: 6, text: '1日の平均睡眠時間', type: 'number', min: 0, max: 24, step: 0.5, unit: '時間' },
  { id: 7, text: '食生活について教えてください。', type: 'select', options: ['バランスの取れた食事', '偏った食事', '不規則な食事', '外食が多い', '自炊が多い'] },
  { id: 8, text: '普段の活動レベルを教えてください。', type: 'select', options: ['座り仕事が多い', '立ち仕事が多い', '歩き回ることが多い', '肉体労働が多い', '不規則'] },
];

interface QuestionnaireComponentBaseProps {
  concern: string;
}

export default function QuestionnaireComponentBase({ concern }: QuestionnaireComponentBaseProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>(staticQuestions);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();
  const hasCalledApi = useRef(false);
  const hasCalledNewApi = useRef(false);

  const totalQuestions = 13; // 静的質問8個 + 動的質問5個

  const fetchLogoUrl = useCallback(async () => {
    try {
      const { data } = await supabase
        .storage
        .from('Healthle_image')
        .getPublicUrl('aicon100.png');

      if (data && 'publicUrl' in data) {
        setLogoUrl(data.publicUrl);
      } else {
        throw new Error('Failed to fetch logo URL');
      }
    } catch (error) {
      console.error('Error fetching logo URL:', error);
      setError('ロゴの取得に失敗しました。');
    }
  }, []);

  const addDynamicQuestions = useCallback(async (apiData: Record<string, unknown>) => {
    try {
      const { result, resultq1, resultq2, resultq3, resultq4, resultq5 } = apiData as {
        result: { q1: string; q2: string; q3: string; q4: string; q5: string };
        resultq1: { choices: string[] };
        resultq2: { choices: string[] };
        resultq3: { choices: string[] };
        resultq4: { choices: string[] };
        resultq5: { choices: string[] };
      };
      
      const dynamicQuestions: Question[] = [
        {
          id: staticQuestions.length + 1,
          text: result.q1,
          type: 'select-with-other',
          options: resultq1.choices,
        },
        {
          id: staticQuestions.length + 2,
          text: result.q2,
          type: 'select-with-other',
          options: resultq2.choices,
        },
        {
          id: staticQuestions.length + 3,
          text: result.q3,
          type: 'select-with-other',
          options: resultq3.choices,
        },
        {
          id: staticQuestions.length + 4,
          text: result.q4,
          type: 'select-with-other',
          options: resultq4.choices,
        },
        {
          id: staticQuestions.length + 5,
          text: result.q5,
          type: 'select-with-other',
          options: resultq5.choices,
        },
      ];

      setQuestions(prevQuestions => [...prevQuestions, ...dynamicQuestions]);
      console.log('Dynamic questions added successfully');
    } catch (error) {
      console.error('Error adding dynamic questions:', error);
      setError('動的質問の追加に失敗しました。');
    }
  }, []);

  const callApi = useCallback(async () => {
    const concernParam = searchParams.get('concern');
    if (!concernParam) {
      console.error('No concern found in URL parameters');
      setError('相談内容が見つかりません。');
      return;
    }

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SITUMONNHYOUWEB_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: concernParam
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      await addDynamicQuestions(data);
    } catch (error) {
      console.error('Error calling API:', error);
      setError('APIの呼び出しに失敗しました。');
      hasCalledApi.current = false;
    }
  }, [searchParams, setError, addDynamicQuestions]);

  const processBackgroundTasks = useCallback(async () => {
    if (hasCalledApi.current) return;

    hasCalledApi.current = true;

    try {
      await callApi();
    } catch (error) {
      console.error('Error in background tasks:', error);
      setError('バックグラウンド処理中にエラーが発生しました。');
      hasCalledApi.current = false;
    }
  }, [callApi, setError]);

  const callNewApi = useCallback(async () => {
    if (hasCalledNewApi.current) return;

    hasCalledNewApi.current = true;

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SISTEMPROMPT_API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: concern
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('New API response:', data);
      setApiResponse(data.message);
    } catch (error) {
      console.error('Error calling new API:', error);
      setError('予期せぬエラーが発生しました。リロードをお願いします。');
      hasCalledNewApi.current = false;
    }
  }, [concern]);

  useEffect(() => {
    fetchLogoUrl();
    processBackgroundTasks();
    callNewApi();
  }, [fetchLogoUrl, processBackgroundTasks, callNewApi]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answer: string | number | string[]) => {
    setAnswers(prevAnswers => {
      const newAnswer: Answer = {
        question: currentQuestion.text,
        answer: answer
      };
      const existingIndex = prevAnswers.findIndex(a => a.question === currentQuestion.text);
      if (existingIndex !== -1) {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingIndex] = newAnswer;
        return updatedAnswers;
      } else {
        return [...prevAnswers, newAnswer];
      }
    });

    if (currentQuestionIndex === 4 && answer === '特になし') {
      handleNext();
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const unansweredQuestions = questions.filter(
      (question) => !answers.some(answer => answer.question === question.text)
    );

    if (unansweredQuestions.length > 0) {
      const unansweredNumbers = unansweredQuestions.map(q => q.id);
      setError(`以下の質問に回答してください: ${unansweredNumbers.join(', ')}番`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const consultationId = searchParams.get('id');
      if (!consultationId) {
        throw new Error('Consultation ID not found');
      }

      const spromptValue = typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse);
      
      const insertData: { [key: string]: string | null } = {
        consultation_id: consultationId,
        concern: concern,
        sprompt: spromptValue || 'No system prompt available'
      };

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        insertData.uid = user.id;
      } else {
        insertData.uid = null;
      }

      answers.forEach((answer, index) => {
        insertData[`question_${index + 1}`] = answer.question;
        insertData[`answer_${index + 1}`] = answer.answer.toString();
      });

      for (let i = answers.length + 1; i <= 15; i++) {
        insertData[`question_${i}`] = '';
        insertData[`answer_${i}`] = '';
      }

      console.log('Preparing to insert data:', insertData);

      const { data, error } = await supabase
        .from('consultation_data')
        .insert([insertData])
        .select();

      console.log('Supabase insert response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`データの保存に失敗しました: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('No data returned from insert operation');
        throw new Error('データが正常に挿入されませんでした。');
      }

      console.log('Data inserted successfully:', data);
      router.push(`/chat?id=${consultationId}&concern=${encodeURIComponent(concern)}`);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      if (error instanceof Error) {
        setError(`データの保存に失敗しました: ${error.message}`);
      } else {
        setError('データの保存中に予期せぬエラーが発生しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentQuestion.type === 'select') {
        const target = (e.target as HTMLSelectElement).value;
        handleAnswer(target);
        handleNext();
      }
    }
  };

  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
      case 'number':
        return (
          <div className="flex items-center">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="number"
              value={answers.find(a => a.question === currentQuestion.text)?.answer || ''}
              onChange={(e) => handleAnswer(Number(e.target.value))}
              onKeyPress={handleKeyPress}
              min={currentQuestion.min}
              max={currentQuestion.max}
              step={currentQuestion.step}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C4179]"
            />
            {currentQuestion.unit && (
              <span className="ml-2 text-gray-600">{currentQuestion.unit}</span>
            )}
          </div>
        );
      case 'select':
        return (
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  handleAnswer(option);
                  handleNext();
                }}
                className={`w-full text-center px-4 py-3 rounded-lg transition-colors ${
                  answers.find(a =>a.question === currentQuestion.text)?.answer === option
                    ? 'bg-[#2C4179] text-white'
                    : 'bg-[#F8FBFF] text-[#293753] hover:bg-[#E6F3FF]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );
      case 'multiline':
        return (
          <div>
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={answers.find(a => a.question === currentQuestion.text)?.answer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C4179]"
            />
            {currentQuestion.allowNone && (
              <button
                onClick={() => handleAnswer('特になし')}
                className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                特になし
              </button>
            )}
          </div>
        );
      case 'select-with-other':
        return (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleAnswer(option);
                    handleNext();
                  }}
                  className={`w-full text-center px-4 py-3 rounded-lg transition-colors ${
                    answers.find(a => a.question === currentQuestion.text)?.answer === option
                      ? 'bg-[#2C4179] text-white'
                      : 'bg-[#F8FBFF] text-[#293753] hover:bg-[#E6F3FF]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label htmlFor={`other-${currentQuestion.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                その他（自由記述）
              </label>
              <textarea
                id={`other-${currentQuestion.id}`}
                value={typeof answers.find(a => a.question === currentQuestion.text)?.answer === 'string' && !currentQuestion.options?.includes(answers.find(a => a.question === currentQuestion.text)?.answer as string) ? answers.find(a => a.question === currentQuestion.text)?.answer as string : ''}
                onChange={(e) => handleAnswer(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C4179]"
                placeholder="その他の回答を入力してください"
              />
              {currentQuestionIndex < questions.length - 1 && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-[#2C4179] text-white rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    次へ <ChevronRight className="inline-block w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSettingsNavigation = () => {
    router.push('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E6F3FF] to-[#F8FBFF] text-[#293753] font-sans">
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="flex justify-between items-start mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="p-2 rounded-full hover:bg-white transition-colors disabled:opacity-50"
            aria-label="前の質問"
          >
            <ArrowLeft className="w-6 h-6 text-[#293753]" />
          </button>
          <div className="flex items-center">
            {logoUrl && (
              <div className="relative w-10 h-10 mr-3">
                <Image
                  src={logoUrl}
                  alt="Healthle Logo"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">Healthle</h1>
              <p className="text-sm">ヘルスル</p>
            </div>
          </div>
          <button
            onClick={handleSettingsNavigation}
            className="p-2 rounded-full hover:bg-white transition-colors"
            aria-label="設定"
          >
            <Menu className="w-6 h-6 text-[#293753]" />
          </button>
        </div>

        <main className="mt-8">
          {error && (
            <div className="mb-4 text-center text-red-500">
              {error}
            </div>
          )}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">質問 {currentQuestionIndex + 1} / {totalQuestions}</h2>
            <p className="text-lg mb-6">{currentQuestion.text}</p>
            {renderQuestionInput()}
            {(currentQuestion.type === 'number' || currentQuestion.type === 'multiline') && currentQuestionIndex < questions.length - 1 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-[#2C4179] text-white rounded-md hover:bg-opacity-90 transition-colors"
                >
                  次へ <ChevronRight className="inline-block w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-[#293753] whitespace-nowrap mr-2">
            進捗: {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
          </span>
          <div className="flex-grow bg-[#E6F3FF] rounded-full h-2 mx-2">
            <div
              className="bg-[#2C4179] h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
          <span className="text-[#293753] whitespace-nowrap ml-2">
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
        {currentQuestionIndex === questions.length - 1 && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full bg-[#2C4179] text-white rounded-lg py-3 mt-4 font-semibold text-lg hover:bg-opacity-90 transition-colors shadow-md flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                処理中...
              </>
            ) : (
              '回答を送信'
            )}
          </button>
        )}
      </div>
    </div>
  );
}