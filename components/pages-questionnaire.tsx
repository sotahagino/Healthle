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
  type: 'select' | 'multi-select-with-other';
  options: string[];
}

interface Answer {
  question: string;
  answer: string | string[];
}

const staticQuestions: Question[] = [
  { id: 1, text: '（対象者）の年代', type: 'select', options: ['乳幼児', '小学生', '10代', '20代', '30代', '40代', '50代', '60代', '70代以上'] },
  { id: 2, text: '相談の目的を教えてください。', type: 'multi-select-with-other', options: ['症状に関する情報が欲しい', '対策が知りたい', '原因が知りたい'] },
  { id: 3, text: '悩み始めたのはいつ頃ですか？', type: 'select', options: ['最近1週間以内', '1ヶ月以内', '3ヶ月以内', '1年以上前'] },
  { id: 4, text: 'あなたの生活習慣で取り組めていないと思うものを選択してください。', type: 'multi-select-with-other', options: ['睡眠', '飲酒', '喫煙', '食生活', '運動', 'ストレス'] },
  { id: 5, text: '今回の相談以外に、健康に関する悩みや不調はありますか。', type: 'multi-select-with-other', options: ['睡眠不足', '頭痛', '過度なストレス', '特定の疾患・疾病', '悩みはない'] },
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
  const [questions] = useState<Question[]>(staticQuestions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  const totalQuestions = questions.length;

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

  useEffect(() => {
    fetchLogoUrl();
  }, [fetchLogoUrl]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answer: string | string[]) => {
    setAnswers(prevAnswers => {
      const existingAnswer = prevAnswers.find(a => a.question === currentQuestion.text);
      if (existingAnswer) {
        if (currentQuestion.type === 'multi-select-with-other') {
          const newAnswer = Array.isArray(existingAnswer.answer) ? existingAnswer.answer : [existingAnswer.answer];
          if (Array.isArray(answer)) {
            return prevAnswers.map(a => 
              a.question === currentQuestion.text 
                ? { ...a, answer: answer }
                : a
            );
          } else {
            if (newAnswer.includes(answer)) {
              return prevAnswers.map(a => 
                a.question === currentQuestion.text 
                  ? { ...a, answer: newAnswer.filter(item => item !== answer) }
                  : a
              );
            } else {
              return prevAnswers.map(a => 
                a.question === currentQuestion.text 
                  ? { ...a, answer: [...newAnswer, answer] }
                  : a
              );
            }
          }
        } else {
          return prevAnswers.map(a => 
            a.question === currentQuestion.text 
              ? { ...a, answer: answer }
              : a
          );
        }
      } else {
        return [...prevAnswers, { question: currentQuestion.text, answer: currentQuestion.type === 'multi-select-with-other' ? [answer as string] : answer }];
      }
    });
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
      
      const insertData: { [key: string]: string | null } = {
        consultation_id: consultationId,
        concern: concern,
      };

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        insertData.uid = user.id;
      } else {
        insertData.uid = null;
      }

      answers.forEach((answer, index) => {
        insertData[`question_${index + 1}`] = answer.question;
        insertData[`answer_${index + 1}`] = Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer.toString();
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

  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
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
                  answers.find(a => a.question === currentQuestion.text)?.answer === option
                    ? 'bg-[#2C4179] text-white'
                    : 'bg-[#F8FBFF] text-[#293753] hover:bg-[#E6F3FF]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );
      case 'multi-select-with-other':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-2">※複数選択可能です</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-center px-4 py-3 rounded-lg transition-colors ${
                    Array.isArray(answers.find(a => a.question === currentQuestion.text)?.answer) &&
                    (answers.find(a => a.question === currentQuestion.text)?.answer as string[]).includes(option)
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
                value={
                  Array.isArray(answers.find(a => a.question === currentQuestion.text)?.answer)
                    ? (answers.find(a => a.question === currentQuestion.text)?.answer as string[]).find(item => !currentQuestion.options.includes(item)) || ''
                    : ''
                }
                onChange={(e) => {
                  const otherAnswer = e.target.value;
                  if (otherAnswer) {
                    const currentAnswers = answers.find(a => a.question === currentQuestion.text)?.answer as string[] || [];
                    const filteredAnswers = currentAnswers.filter(item => currentQuestion.options.includes(item));
                    handleAnswer([...filteredAnswers, otherAnswer]);
                  }
                }}
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