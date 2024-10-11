'use client'

import React, { useState, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronRight, Users, Mail, FileText, X } from 'lucide-react'

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SettingsItem = ({ onClick, icon: Icon, text }: { onClick: () => void; icon: React.ElementType; text: string }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 border-b border-gray-200 text-left">
    <div className="flex items-center">
      <Icon className="w-6 h-6 mr-3 text-[#002341]" />
      <span className="text-lg">{text}</span>
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
        <button onClick={() => router.back()} className="mr-4">
          <ChevronRight className="w-6 h-6 transform rotate-180" />
        </button>
        <h1 className="text-2xl font-semibold text-[#002341]">設定</h1>
      </header>
      <main className="max-w-3xl mx-auto mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        <a href="https://timerex.net/s/wataru.sato_a334_a73a/88fdf23c" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Users className="w-6 h-6 mr-3 text-[#002341]" />
            <span className="text-lg">インタビュー協力</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </a>
        <a href="https://lin.ee/AlseMHV" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Mail className="w-6 h-6 mr-3 text-[#002341]" />
            <span className="text-lg">問い合わせ</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </a>
        <SettingsItem onClick={() => fetchLegalDocument('privacy_policy')} icon={FileText} text="プライバシーポリシー" />
        <SettingsItem onClick={() => fetchLegalDocument('terms_of_service')} icon={FileText} text="利用規約" />
        
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle/aicon100_1010.png`}
              alt="Healthle Logo"
              width={40}
              height={40}
              className="mr-3"
            />
            <div>
              <h2 className="text-xl font-semibold text-[#002341]">Healthle</h2>
              <p className="text-sm text-gray-500">ヘルスル</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            本サービスは、ヘルスケアに関する情報提供を行うものであり、医師や専門家が特定の疾病や病気、障害を診断・治療・予防・医療アドバイスをする医療行為ではありません。
          </p>
          <div className="space-y-2">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-40 py-2 px-4 bg-gray-200 text-[#002341] rounded-full hover:bg-gray-300 transition-colors text-sm"
              >
                ログアウト
              </button>
            ) : (
              <>
                <button onClick={() => setShowRegistrationModal(true)} className="block w-40 py-2 px-4 bg-[#002341] text-white text-center rounded-full hover:bg-opacity-90 transition-colors text-sm">
                  アカウント登録
                </button>
                <button onClick={() => setShowLoginModal(true)} className="block w-40 py-2 px-4 bg-gray-200 text-[#002341] text-center rounded-full hover:bg-gray-300 transition-colors text-sm">
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
              <h2 className="text-xl font-semibold">{modalTitle}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">アカウント登録</h2>
              <button onClick={() => setShowRegistrationModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#002341] focus:border-[#002341]"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#002341] focus:border-[#002341]"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">パスワード（確認）</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#002341] focus:border-[#002341]"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#002341] text-white rounded-full hover:bg-opacity-90 transition-colors"
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">ログイン</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                <input
                  type="email"
                  id="loginEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#002341] focus:border-[#002341]"
                />
              </div>
              <div>
                <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700">パスワード</label>
                <input
                  type="password"
                  id="loginPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#002341] focus:border-[#002341]"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#002341] text-white rounded-full hover:bg-opacity-90 transition-colors"
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