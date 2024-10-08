'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { X, Menu, History, AlertCircle, LightbulbIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ApiResponse {
  result: string
}

interface ConsultationExample {
  id: number
  content: string
}

interface ElementCheckResult {
  symptomStart: boolean
  symptomFrequency: boolean
  symptomSeverity: boolean
  triedMeasures: boolean
  lifeImpact: boolean
  inquiryContent: boolean
}

export function ImprovedHealthleDashboardComponent() {
  const defaultText = `お困りの症状や悩みを具体的にご記入ください。以下の要素を含めると、より適切なアドバイスが得られます。

・症状の開始時期
・症状の頻度
・症状の程度
・これまでに試した対策
・生活への影響
・求めている情報や助言
`

  const [consultationText, setConsultationText] = useState(defaultText)
  const [suggestion, setSuggestion] = useState('')
  const [elementCheckResult, setElementCheckResult] = useState<ElementCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState('')
  const [modalTitle, setModalTitle] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [lastApiCallText, setLastApiCallText] = useState('')
  const [consultationExamples, setConsultationExamples] = useState<ConsultationExample[]>([])
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDefaultText, setIsDefaultText] = useState(true)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const router = useRouter()
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const scrollTimer = useRef<NodeJS.Timeout | null>(null)

  const MIN_INPUT_LENGTH = 10
  const DEBOUNCE_DELAY = 300
  const SCROLL_INTERVAL = 10000
  const MIN_CHAR_DIFF = 5

  const SUGGESTION_API_URL = 'https://7u5n8i.buildship.run/nyuuryokuhokann'
  const ELEMENT_CHECK_API_URL = 'https://7u5n8i.buildship.run/hannteiyou'

  const fetchSingleSuggestion = useCallback(async (text: string): Promise<string> => {
    try {
      const response = await fetch(SUGGESTION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      return data.result
    } catch (error) {
      console.error('単一の提案取得に失敗しました:', error)
      throw error
    }
  }, [])

  const fetchElementCheckApi = useCallback(async (text: string): Promise<ElementCheckResult> => {
    try {
      const response = await fetch(ELEMENT_CHECK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      return JSON.parse(data.result)
    } catch (error) {
      console.error('要素チェックAPIの呼び出しに失敗しました:', error)
      throw error
    }
  }, [])

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < MIN_INPUT_LENGTH || text === lastApiCallText || isDefaultText) {
      return
    }

    if (Math.abs(text.length - lastApiCallText.length) < MIN_CHAR_DIFF) {
      return
    }

    setLastApiCallText(text)

    try {
      const [suggestionResponse, elementCheckResponse] = await Promise.all([
        fetchSingleSuggestion(text),
        fetchElementCheckApi(text)
      ])
      setSuggestion(suggestionResponse !== 'OK' ? suggestionResponse : '')
      setElementCheckResult(elementCheckResponse)
    } catch (error) {
      console.error('APIの呼び出しに失敗しました:', error)
      setSuggestion('')
      setElementCheckResult(null)
    }
  }, [lastApiCallText, fetchSingleSuggestion, fetchElementCheckApi, isDefaultText])

  const debounceFetchSuggestions = useCallback((text: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text)
    }, DEBOUNCE_DELAY)
  }, [fetchSuggestions])

  useEffect(() => {
    fetchConsultationExamples()
  }, [])

  useEffect(() => {
    if (consultationExamples.length > 0 && isDefaultText) {
      scrollTimer.current = setInterval(() => {
        setCurrentExampleIndex((prevIndex) =>
          prevIndex === consultationExamples.length - 1 ? 0 : prevIndex + 1
        )
      }, SCROLL_INTERVAL)
    }

    return () => {
      if (scrollTimer.current) {
        clearInterval(scrollTimer.current)
      }
    }
  }, [consultationExamples, isDefaultText])

  useEffect(() => {
    if (!isDefaultText && consultationText.length >= MIN_INPUT_LENGTH) {
      debounceFetchSuggestions(consultationText)
    } else {
      setSuggestion('')
      setElementCheckResult(null)
    }
  }, [consultationText, debounceFetchSuggestions, isDefaultText])

  const fetchConsultationExamples = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_examples')
        .select('*')
      
      if (error) throw error

      setConsultationExamples(data)
    } catch (error) {
      console.error('相談例の取得に失敗しました:', error)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputText = e.target.value
    if (isDefaultText && inputText !== defaultText) {
      setIsDefaultText(false)
    }
    setConsultationText(inputText)
    setCursorPosition(e.target.selectionStart)
    adjustTextareaHeight()
  }

  const handleSuggestionAccept = () => {
    if (suggestion) {
      const newText = consultationText.slice(0, cursorPosition) + suggestion + consultationText.slice(cursorPosition)
      setConsultationText(newText)
      setSuggestion('')
      debounceFetchSuggestions(newText)
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newCursorPosition = cursorPosition + suggestion.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        setCursorPosition(newCursorPosition)
        adjustTextareaHeight()
        scrollToBottom()
      }
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const scrollToBottom = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
    if (suggestion) {
      scrollToBottom()
    }
  }, [consultationText, suggestion])

  const handleSuggestionClose = () => {
    setSuggestion('')
  }

  const handleExampleClick = (exampleContent: string) => {
    setConsultationText(exampleContent)
    setIsDefaultText(false)
    if (scrollTimer.current) {
      clearInterval(scrollTimer.current)
    }
    fetchSuggestions(exampleContent)
  }

  const handleStartConsultation = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consultationText || isDefaultText) return

    setIsLoading(true)
    setIsTransitioning(true)
    setError(null)

    try {
      console.log('相談開始処理を開始します')
      
      const consultationId = uuidv4()

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('ユーザー情報の取得に失敗しました:', userError)
      }

      const insertData: { consultation_id: string; concern: string; uid?: string } = {
        consultation_id: consultationId,
        concern: consultationText,
      }

      if (user) {
        insertData.uid = user.id
      }

      const { data: consultationData, error: consultationError } = await supabase
        .from('consultation_data')
        .insert(insertData)
        .select()

      if (consultationError) {
        console.error('consultation_dataへの挿入エラー:', consultationError)
        throw consultationError
      }

      if (!consultationData || consultationData.length === 0) {
        throw new Error('挿入からデータが返されませんでした')
      }

      console.log('生成されたconsultation_id:', consultationId)

      router.push(`/chat?id=${consultationId}`)
    } catch (error) {
      console.error('相談の開始に失敗しました:', error)
      setError('相談の開始に失敗しました。もう一度お試しください。')
      setIsTransitioning(false)
    } finally {
      setIsLoading(false)
    }
  }, [consultationText, router, isDefaultText])

  const handleViewPastConsultations = () => {
    router.push('/past-consultations')
  }

  const handleMenuClick = () => {
    router.push('/settings')
  }

  const MissingElementsAlert = () => {
    if (!elementCheckResult) return null

    const missingElements = []
    if (!elementCheckResult.symptomStart) missingElements.push('症状の開始時期')
    if (!elementCheckResult.symptomFrequency) missingElements.push('症状の頻度')
    if (!elementCheckResult.symptomSeverity) missingElements.push('症状の程度')
    if (!elementCheckResult.triedMeasures) missingElements.push('これまでに試した対策')
    if (!elementCheckResult.lifeImpact) missingElements.push('生活への影響')
    if (!elementCheckResult.inquiryContent) missingElements.push('求めている情報や助言')

    if (missingElements.length === 0) return null

    return (
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center mb-2">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
          <h3 className="text-sm font-semibold text-yellow-700">以下の要素を追加すると、より適切なアドバイスが得られます：</h3>
        </div>
        <ul className="list-disc list-inside text-sm text-yellow-600">
          {missingElements.map((element, index) => (
            <li key={index}>{element}</li>
          ))}
        </ul>
      </div>
    )
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
    <AnimatePresence>
      {!isTransitioning && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-white text-gray-800 font-sans flex flex-col"
        >
          <div className="bg-[#2C4179] text-white text-center py-3 px-4 text-sm font-semibold">
            24時間対応 | 即時回答 | 完全無料
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow overflow-y-auto flex flex-col w-full">
            <header className="flex  justify-between items-center mb-6">
              <div className="flex items-center">
                <Image 
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle_image/aicon100.png`} 
                  alt="Healthle Logo" 
                  width={32} 
                  height={32} 
                />
                <h1 className="text-xl font-bold text-[#2C4179] ml-2">Healthle <span className="text-xs font-normal text-gray-500">ヘルスル</span></h1>
              </div>
              <div className="flex space-x-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C4179] focus:ring-offset-2"
                  aria-label="過去の相談"
                  onClick={handleViewPastConsultations}
                >
                  <History className="w-5 h-5 text-[#2C4179]" />
                </button>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C4179] focus:ring-offset-2"
                  aria-label="設定"
                  onClick={handleMenuClick}
                >
                  <Menu className="w-5 h-5 text-[#2C4179]" />
                </button>
              </div>
            </header>

            <main className="flex-grow overflow-y-auto flex flex-col pb-24">
              <h2 className="text-lg font-semibold mb-3 text-[#2C4179]">相談内容</h2>
              <MissingElementsAlert />
              <div className="rounded-lg overflow-hidden mb-4">
                <div className="border-2 border-gray-200 rounded-lg p-3 bg-white relative">
                  <textarea
                    ref={textareaRef}
                    value={consultationText}
                    onChange={handleInputChange}
                    onFocus={() => {
                      if (isDefaultText) {
                        setConsultationText('')
                        setIsDefaultText(false)
                      }
                    }}
                    onBlur={() => {
                      if (consultationText === '') {
                        setConsultationText(defaultText)
                        setIsDefaultText(true)
                      }
                    }}
                    className="w-full min-h-[8rem] resize-none bg-transparent outline-none text-sm overflow-y-auto"
                    style={{
                      caretColor: 'black',
                    }}
                    aria-label="相談内容を入力"
                  />
                  {suggestion && (
                    <div className="mt-2 bg-blue-50 border-t border-blue-200 p-2">
                      <div className="flex items-start mb-2">
                        <LightbulbIcon className="w-4 h-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                        <p className="text-xs text-blue-600 flex-grow">{suggestion}</p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleSuggestionAccept}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          追加
                        </button>
                        <button
                          onClick={handleSuggestionClose}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        >
                          閉じる
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {isDefaultText && consultationExamples.length > 0 && (
                <div className="mb-4 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                  <h3 className="text-sm font-semibold text-gray-600 p-2 border-b">相談例：</h3>
                  <div className="p-3">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentExampleIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-sm text-gray-600"
                      >
                        <button
                          onClick={() => handleExampleClick(consultationExamples[currentExampleIndex].content)}
                          className="w-full text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors rounded p-2"
                        >
                          {consultationExamples[currentExampleIndex].content}
                        </button>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </main>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white p-2 sm:p-3 shadow-md z-10">
            <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
              <p className="text-center text-xs text-gray-600 mb-2">
                <button
                  onClick={() => fetchLegalDocument('terms_of_service')}
                  className="text-[#2C4179] hover:underline mr-1 focus:outline-none focus:ring-2 focus:ring-[#2C4179] focus:ring-offset-2 rounded"
                >
                  利用規約
                </button>
                と
                <button
                  onClick={() => fetchLegalDocument('privacy_policy')}
                  className="text-[#2C4179] hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-[#2C4179] focus:ring-offset-2 rounded"
                >
                  プライバシーポリシー
                </button>
                に同意の上で利用ください
              </p>
              <form onSubmit={handleStartConsultation} className="w-full">
                <button
                  type="submit"
                  className={`w-full rounded-lg py-3 font-semibold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    consultationText && !isDefaultText && !isLoading
                      ? 'bg-[#2C4179] text-white hover:bg-opacity-90 focus:ring-[#2C4179]'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed focus:ring-gray-400'
                  }`}
                  disabled={!consultationText || isDefaultText || isLoading}
                >
                  {isLoading ? '処理中...' : '無料で今すぐ相談を始める'}
                </button>
              </form>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold">{modalTitle}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2C4179] rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{modalContent}</pre>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}