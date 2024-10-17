'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Calendar, Clock, ChevronRight, X, LogIn } from 'lucide-react'
import Image from 'next/image'

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChatSession {
  id: string;
  thread_id: string;
  created_at: string;
  initial_consultations: {
    consultation_text: string;
  } | null;
}

type Consultation = {
  id: string;
  thread_id: string;
  created_at: string;
  initial_consultation: string;
};

function AuthModal({ onClose, onAuth }: { onClose: () => void, onAuth: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)

    if (!isLogin && password !== confirmPassword) {
      setAuthError('パスワードが一致しません。')
      return
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      onAuth()
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(isLogin ? `ログインに失敗しました: ${error.message}` : `登録に失敗しました: ${error.message}`)
      } else {
        setAuthError(isLogin ? 'ログインに失敗しました。' : '登録に失敗しました。')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{isLogin ? 'ログイン' : 'アカウント登録'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
            />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
              />
            </div>
          )}
          {authError && <p className="text-red-500 text-xs">{authError}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2C4179] hover:bg-[#1E2F5C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C4179] transition-colors"
          >
            {isLogin ? 'ログイン' : '登録'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[#2C4179] hover:underline transition-all"
          >
            {isLogin ? 'アカウントを作成' : 'ログインする'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PastConsultations() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()

  const fetchPastConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          thread_id,
          created_at,
          initial_consultations (consultation_text)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched data:', JSON.stringify(data, null, 2));

      const processedData = (data as unknown as ChatSession[]).map((session): Consultation => ({
        id: session.id,
        thread_id: session.thread_id,
        created_at: session.created_at,
        initial_consultation: truncateText(session.initial_consultations?.consultation_text || '初期相談なし', 30),
      }));

      setConsultations(processedData);
    } catch (error) {
      console.error('過去の相談履歴の取得に失敗しました:', error);
      setError('過去の相談履歴の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkLoginStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)
    if (user) {
      fetchPastConsultations()
    } else {
      setLoading(false)
    }
  }, [fetchPastConsultations])

  useEffect(() => {
    checkLoginStatus()
  }, [checkLoginStatus])

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }

  const handleConsultationClick = (threadId: string) => {
    router.push(`/chat-history?thread_id=${threadId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const handleAuth = () => {
    setShowAuthModal(false);
    setIsLoggedIn(true);
    fetchPastConsultations();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-4 text-[#2C4179]">エラーが発生しました</h1>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#2C4179] text-white rounded-md hover:bg-[#1E2F5C] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C4179] text-sm"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C4179]"
              aria-label="戻る"
            >
              <ChevronLeft className="w-5 h-5 text-[#2C4179]" />
            </button>
            <Image 
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle/aicon_v3_100_1017.png?t=2024-10-17T02%3A45%3A47.798Z`}
              alt="Healthle Logo" 
              width={32} 
              height={32} 
              className="mr-3"
            />
            <h1 className="text-2xl font-bold text-[#2C4179]">過去の相談履歴</h1>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm"
            >
              ログアウト
            </button>
          )}
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2C4179]"></div>
            </div>
          ) : !isLoggedIn ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <LogIn className="w-12 h-12 text-[#2C4179] mx-auto mb-4" />
              <p className="text-lg text-gray-600 mb-6">過去の相談履歴を表示するにはログインが必要です。</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-[#2C4179] text-white rounded-md hover:bg-[#1E2F5C] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C4179] text-sm"
              >
                ログイン / アカウント登録
              </button>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-md">
              <p className="text-lg text-gray-600">過去の相談履歴がありません。</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {consultations.map((consultation) => (
                <li 
                  key={consultation.id}
                  onClick={() => handleConsultationClick(consultation.thread_id)}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="p-4 flex justify-between items-center">
                    <div className="flex-grow">
                      <h2 className="text-base font-semibold text-[#2C4179] mb-2 group-hover:text-[#1E2F5C] transition-colors">{consultation.initial_consultation}</h2>
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className="mr-3">{formatDate(consultation.created_at)}</span>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatTime(consultation.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#2C4179] transition-colors" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      )}
    </div>
  )
}