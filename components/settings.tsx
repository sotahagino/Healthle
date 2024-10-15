'use client'

import React, { useState, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronRight, Users, Mail, FileText, X, ChevronLeft, LogOut, LogIn, UserPlus } from 'lucide-react'

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SettingsItem = ({ onClick, icon: Icon, text }: { onClick: () => void; icon: React.ElementType; text: string }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
    <div className="flex items-center">
      <Icon className="w-6 h-6 mr-4 text-[#2C4179]" />
      <span className="text-lg text-gray-700">{text}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-400" />
  </button>
)

export default function SettingsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkLoginStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkLoginStatus()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    router.push('/')
  }

  const fetchLegalDocument = async (type: string) => {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('content')
      .eq('type', type)
      .single()

    if (error) {
      console.error('Error fetching document:', error)
      return
    }

    setModalContent(data.content)
    setModalTitle(type === 'terms_of_service' ? '利用規約' : 'プライバシーポリシー')
    setShowModal(true)
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setShowRegistrationModal(false)
      setIsLoggedIn(true)
      router.push('/') // Redirect to home page
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      setShowLoginModal(false)
      setIsLoggedIn(true)
      router.push('/') // Redirect to home page
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-6 flex items-center">
        <button onClick={() => router.back()} className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#2C4179]" />
        </button>
        <h1 className="text-2xl font-bold text-[#2C4179]">設定</h1>
      </header>
      <main className="max-w-3xl mx-auto mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="divide-y divide-gray-200">
          <a href="https://timerex.net/s/wataru.sato_a334_a73a/88fdf23c" target="_blank" rel="noopener noreferrer" className="block hover:bg-gray-50 transition-colors">
            <SettingsItem onClick={() => {}} icon={Users} text="インタビュー協力" />
          </a>
          <a href="https://lin.ee/AlseMHV" target="_blank" rel="noopener noreferrer" className="block hover:bg-gray-50 transition-colors">
            <SettingsItem onClick={() => {}} icon={Mail} text="問い合わせ" />
          </a>
          <SettingsItem onClick={() => fetchLegalDocument('privacy_policy')} icon={FileText} text="プライバシーポリシー" />
          <SettingsItem onClick={() => fetchLegalDocument('terms_of_service')} icon={FileText} text="利用規約" />
        </div>
        
        <div className="p-6 bg-gray-50 mt-6">
          <div className="flex items-center mb-6">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle/aicon100_1010.png`}
              alt="Healthle Logo"
              width={48}
              height={48}
              className="mr-4"
            />
            <div>
              <h2 className="text-2xl font-bold text-[#2C4179]">Healthle</h2>
              <p className="text-sm text-gray-500">ヘルスル</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6 bg-white p-4 rounded-lg shadow-sm">
            本サービスは、ヘルスケアに関する情報提供を行うものであり、医師や専門家が特定の疾病や病気、障害を診断・治療・予防・医療アドバイスをする医療行為ではありません。
          </p>
          <div className="space-y-3">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-gray-200 text-[#2C4179] rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 mr-2" />
                ログアウト
              </button>
            ) : (
              <>
                <button onClick={() => setShowRegistrationModal(true)} className="w-full py-3 px-4 bg-[#2C4179] text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium flex items-center justify-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  アカウント登録
                </button>
                <button onClick={() => setShowLoginModal(true)} className="w-full py-3 px-4 bg-white text-[#2C4179] border border-[#2C4179] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center">
                  <LogIn className="w-5 h-5 mr-2" />
                  ログイン
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#2C4179]">{modalTitle}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{modalContent}</pre>
            </div>
          </div>
        </div>
      )}

      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#2C4179]">アカウント登録</h2>
              <button onClick={() => setShowRegistrationModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#2C4179] text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                登録
              </button>
            </form>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#2C4179]">ログイン</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  id="loginEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
                <input
                  type="password"
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#2C4179] focus:border-transparent transition-all"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#2C4179] text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                ログイン
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}