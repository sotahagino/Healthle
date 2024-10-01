'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Calendar, Clock, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Consultation {
  id: string
  concern: string
  created_at: string
  consultation_id: string
}

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
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{isLogin ? 'ログイン' : 'アカウント登録'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2C4179] focus:border-[#2C4179]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2C4179] focus:border-[#2C4179]"
            />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">パスワード（確認）</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#2C4179] focus:border-[#2C4179]"
              />
            </div>
          )}
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2C4179] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C4179]"
          >
            {isLogin ? 'ログイン' : '登録'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-[#2C4179] hover:underline"
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

  const checkLoginStatus = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)
    if (user) {
      fetchPastConsultations()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkLoginStatus()
  }, [checkLoginStatus])

  async function fetchPastConsultations() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('ユーザーが認証されていません。')
      }

      const { data, error } = await supabase
        .from('consultation_data')
        .select('id, concern, created_at, consultation_id')
        .eq('uid', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setConsultations(data || [])
    } catch (error) {
      console.error('Error fetching past consultations:', error)
      setError('過去の相談履歴の取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleConsultationClick = (consultationId: string) => {
    router.push(`/chathistory?id=${consultationId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const handleAuth = () => {
    setShowAuthModal(false)
    setIsLoggedIn(true)
    fetchPastConsultations()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-800 font-sans flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#2C4179] text-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-6">
        <header className="flex items-center mb-6">
          <button
            onClick={() => router.push('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="戻る"
          >
            <ChevronLeft className="w-6 h-6 text-[#2C4179]" />
          </button>
          <div className="flex items-center">
            <Image 
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle_image/aicon100.png`}
              alt="Healthle Logo" 
              width={40} 
              height={40} 
            />
            <h1 className="text-2xl font-bold text-[#2C4179] ml-2">過去の相談履歴</h1>
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C4179]"></div>
            </div>
          ) : !isLoggedIn ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">過去の相談履歴を表示するにはログインが必要です。</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-2 bg-[#2C4179] text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                ログイン / アカウント登録
              </button>
            </div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">過去の相談履歴がありません。</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {consultations.map((consultation) => (
                <li 
                  key={consultation.id}
                  onClick={() => handleConsultationClick(consultation.consultation_id)}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-semibold text-[#2C4179] mb-2">{consultation.concern}</h2>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span className="mr-4">{formatDate(consultation.created_at)}</span>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatTime(consultation.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
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