'use client'

import React, { useState, useEffect } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Search, X, ChevronDown, Menu, History } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Genre {
  id: number
  name: string
  display_order: number
}

interface Concern {
  description: string
}

export function ImprovedHealthleDashboardComponent() {
  const [allConcerns, setAllConcerns] = useState<string[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [frequentConcerns, setFrequentConcerns] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchGenres()
    fetchAllConcerns()
  }, [])

  useEffect(() => {
    if (genres.length > 0 && !selectedGenre) {
      const defaultGenre = genres.find(genre => genre.display_order === 1)
      if (defaultGenre) {
        setSelectedGenre(defaultGenre.id)
      } else {
        setSelectedGenre(genres[0].id)
      }
    }
  }, [genres, selectedGenre])

  useEffect(() => {
    if (selectedGenre) {
      fetchFrequentConcerns(selectedGenre)
    }
  }, [selectedGenre])

  useEffect(() => {
    if (searchTerm && isTyping) {
      const filteredSuggestions = allConcerns.filter(concern =>
        concern.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setSuggestions(filteredSuggestions)
    } else {
      setSuggestions([])
    }
  }, [searchTerm, allConcerns, isTyping])

  async function fetchGenres() {
    try {
      const { data, error } = await supabase
        .from('health_categories')
        .select('id, name, display_order')
        .order('display_order', { ascending: true })

      if (error) throw error

      setGenres(data || [])
    } catch (error) {
      console.error('ジャンルの取得に失敗しました:', error)
      setError('ジャンルの取得に失敗しました。')
    }
  }

  async function fetchAllConcerns() {
    try {
      const { data, error } = await supabase
        .from('health_concerns')
        .select('description')

      if (error) throw error

      setAllConcerns((data || []).map((item: Concern) => item.description))
    } catch (error) {
      console.error('全ての悩みの取得に失敗しました:', error)
      setError('全ての悩みの取得に失敗しました。')
    }
  }

  async function fetchFrequentConcerns(genreId: number) {
    try {
      const { data, error } = await supabase
        .from('health_concerns')
        .select('description')
        .eq('category_id', genreId)
        .limit(5)

      if (error) throw error

      setFrequentConcerns((data || []).map((item: Concern) => item.description))
    } catch (error) {
      console.error('よく相談される内容の取得に失敗しました:', error)
      setError('よく相談される内容の取得に失敗しました。')
    }
  }

  const fetchLegalDocument = async (type: string) => {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('content')
      .eq('type', type)
      .single()

    if (error) {
      console.error('法的文書の取得に失敗しました:', error)
      setError('法的文書の取得に失敗しました。')
      return
    }

    setModalContent(data.content)
    setModalTitle(type === 'terms_of_service' ? '利用規約' : 'プライバシーポリシー')
    setShowModal(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setSelectedConcern(null)
    setIsTyping(true)
  }

  const handleClearInput = () => {
    setSearchTerm('')
    setSuggestions([])
    setSelectedConcern(null)
    setIsTyping(false)
  }

  const handleSuggestionClick = (concern: string) => {
    setSearchTerm(concern)
    setSelectedConcern(concern)
    setSuggestions([])
    setIsTyping(false)
  }

  const handleFrequentConcernClick = (concern: string) => {
    setSearchTerm(concern)
    setSelectedConcern(concern)
    setIsTyping(false)
  }

  const handleStartConsultation = async (e: React.FormEvent) => {
    e.preventDefault()
    const concern = selectedConcern || searchTerm
    if (!concern) return

    try {
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultations')
        .insert({ concern })
        .select()

      if (consultationError) throw consultationError

      if (consultationData && consultationData[0]) {
        const consultationId = consultationData[0].id

        const { error: startError } = await supabase
          .from('consultation_starts')
          .insert({ consultation_id: consultationId })

        if (startError) throw startError

        router.push(`/questionnaire?id=${consultationId}&concern=${encodeURIComponent(concern)}`)
      } else {
        throw new Error('挿入からデータが返されませんでした')
      }
    } catch (error) {
      console.error('相談の開始に失敗しました:', error)
      setError('相談の開始に失敗しました。もう一度お試しください。')
    }
  }

  const handleViewPastConsultations = () => {
    router.push('/past-consultations')
  }

  const handleMenuClick = () => {
    router.push('/settings')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-800 font-sans flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="bg-[#2C4179] text-white text-center py-2 px-4 text-sm font-semibold">
        24時間対応 | 即時回答 | 完全無料
      </div>
      <div className="container mx-auto px-4 py-6 pb-24">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Image 
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle_image/aicon100.png`} 
              alt="Healthle Logo" 
              width={40} 
              height={40} 
            />
            <h1 className="text-2xl font-bold text-[#2C4179] ml-2">Healthle <span className="text-sm font-normal text-gray-500">ヘルスル</span></h1>
          </div>
          <div className="flex space-x-4">
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="過去の相談"
              onClick={handleViewPastConsultations}
            >
              <History className="w-6 h-6 text-[#2C4179]" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="設定"
              onClick={handleMenuClick}
            >
              <Menu className="w-6 h-6 text-[#2C4179]" />
            </button>
          </div>
        </header>

        <main>
        <h2 className="text-xl font-semibold mb-2 text-gray-700">あなたのお悩みを教えて下さい。</h2>
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setTimeout(() => setIsTyping(false), 200)}
              placeholder="お悩みを入力"
              className="w-full p-3 pr-10 border border-gray-300 rounded-md bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2C4179] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={handleClearInput}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
            {!searchTerm && (
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            )}
          </div>

          {isTyping && suggestions.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
              <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 border-b border-gray-200">
                &quot;{searchTerm}&quot;に関連する良く相談される内容
              </h3>
              <ul>
                {suggestions.map((concern, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleSuggestionClick(concern)}
                  >
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">よく相談される内容</h3>
              <div className="relative">
                <select
                  value={selectedGenre || ''}
                  onChange={(e) => setSelectedGenre(Number(e.target.value))}
                  className="appearance-none bg-white text-gray-800 border border-gray-300 rounded-md py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#2C4179] focus:border-transparent"
                >
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              {frequentConcerns.map((concern, index) => (
                <button
                  key={index}
                  onClick={() => handleFrequentConcernClick(concern)}
                  className="text-left px-4 py-3 bg-gray-50 text-gray-800 hover:bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4179] transition-colors"
                >
                  {concern}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-md">
        <p className="text-center text-sm text-gray-600 mb-2">
          <button
            onClick={() => fetchLegalDocument('terms_of_service')}
            className="text-[#2C4179] hover:underline"
          >
            利用規約
          </button>
          と
          <button
            onClick={() => fetchLegalDocument('privacy_policy')}
            className="text-[#2C4179] hover:underline"
          >
            プライバシーポリシー
          </button>
          に同意の上で利用ください
        </p>
        <form onSubmit={handleStartConsultation} className="w-full">
          <button
            type="submit"
            className={`w-full rounded-lg py-4 font-semibold text-lg transition-colors ${
              selectedConcern || searchTerm
                ? 'bg-[#2C4179] text-white hover:bg-opacity-90'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!selectedConcern && !searchTerm}
          >
            無料で今すぐ相談を始める
          </button>
        </form>
      </div>

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
    </div>
  )
}