'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, HelpCircle, User, Home, ChevronDown, ChevronUp, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import HealthDisclaimerModal from './HealthDisclaimerModal'

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  isQuestion?: boolean
}

interface SuggestionContent {
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string
}

function MessageComponentBase({ message }: { message: Message }) {
  return (
    <div className="my-4 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center mb-2">
        {message.sender === 'user' ? (
          message.isQuestion ? (
            <HelpCircle className="w-6 h-6 mr-2 text-[#002341]" />
          ) : (
            <User className="w-6 h-6 mr-2 text-[#002341]" />
          )
        ) : (
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle_image/doctor100.png`}
            alt="医師のアイコン"
            width={24}
            height={24}
            className="mr-2"
          />
        )}
        <p className="text-lg font-semibold text-[#002341]">
          {message.sender === 'user'
            ? message.isQuestion
              ? '質問'
              : 'お悩み'
            : '回答'}
        </p>
      </div>
      <ReactMarkdown
        className="prose max-w-none markdown-content"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
          h3: ({ ...props }) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
          h4: ({ ...props }) => <h4 className="text-base font-medium mt-3 mb-2" {...props} />,
          h5: ({ ...props }) => <h5 className="text-sm font-medium mt-2 mb-1" {...props} />,
          h6: ({ ...props }) => <h6 className="text-xs font-medium mt-2 mb-1" {...props} />,
          p: ({ ...props }) => <p className="my-2 leading-relaxed" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
          li: ({ ...props }) => <li className="my-1" {...props} />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#002341] hover:underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <pre className="bg-gray-100 rounded-md p-4 overflow-x-auto my-2">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-100 rounded px-1 py-0.5" {...props}>
                {children}
              </code>
            )
          },
          hr: ({ ...props }) => <hr className="my-4 border-t border-gray-300" {...props} />,
          em: ({ ...props }) => <em className="italic text-gray-700" {...props} />,
          strong: ({ ...props }) => <strong className="font-bold text-gray-900" {...props} />,
        }}
      >
        {message.text}
      </ReactMarkdown>
    </div>
  )
}

const MessageComponent = React.memo(MessageComponentBase)
MessageComponent.displayName = 'MessageComponent'

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestionContent, setSuggestionContent] = useState<SuggestionContent | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const searchParams = useSearchParams()
  const consultationId = searchParams.get('id')
  const messageIdRef = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [threadID, setThreadID] = useState<string | null>(null)
  const initializationRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const checkLoginStatus = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }, [])

  const saveMessageToDatabase = useCallback(async (message: Message) => {
    if (!consultationId) {
      console.error('相談IDが利用できません')
      return
    }
  
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user ? user.id : null

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          consultation_id: consultationId,
          sender: message.sender,
          message: message.text,
          is_question: message.isQuestion || false,
          uid: uid,
        })
  
      if (error) {
        console.error('メッセージのデータベース保存中にエラーが発生しました:', error)
        throw error
      }
  
      console.log('メッセージが正常に保存されました:', data)
    } catch (error) {
      console.error('saveMessageToDatabaseでエラーが発生しました:', error)
    }
  }, [consultationId])

  const addMessage = useCallback((text: string, sender: 'user' | 'ai', isQuestion: boolean = false) => {
    messageIdRef.current += 1
    const newMessage: Message = {
      id: messageIdRef.current.toString(),
      text,
      sender,
      isQuestion,
    }
    setMessages(prevMessages => [...prevMessages, newMessage])
    
    if (sender === 'user') {
      saveMessageToDatabase(newMessage)
        .catch(error => console.error('メッセージ追加後の保存中にエラーが発生しました:', error))
    }
  
    return newMessage.id
  }, [saveMessageToDatabase])

  const updateMessage = useCallback((id: string, text: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id ? { ...msg, text } : msg
      )
    )
  }, [])

  const streamResponse = useCallback(async (message: string, messageId: string, threadId: string | null) => {
    try {
      console.log('APIにリクエストを送信中:', process.env.NEXT_PUBLIC_WEBASSISTANT_URL)
      const response = await fetch(process.env.NEXT_PUBLIC_WEBASSISTANT_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          threadId: threadId || "",
        }),
      })
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const newThreadId = response.headers.get('x-thread-id')
      if (newThreadId) {
        setThreadID(newThreadId)
        
        if (consultationId) {
          const { error } = await supabase
            .from('consultation_data')
            .update({ thread_id: newThreadId })
            .eq('consultation_id', consultationId)
          
          if (error) {
            console.error('thread_idのデータベース保存中にエラーが発生しました:', error)
          }
        }
      }
  
      if (!response.body) {
        throw new Error('レスポンスボディがnullです')
      }
  
      const reader = response.body.getReader()
      let accumulatedResponse = ''
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
  
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
  
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.substring(6))
              if (jsonData.delta && jsonData.delta.content && jsonData.delta.content[0].text) {
                accumulatedResponse += jsonData.delta.content[0].text.value
                updateMessage(messageId, accumulatedResponse)
              }
            } catch (error) {
              console.error('JSONの解析エラー:', error)
            }
          }
        }
      }
  
      if (accumulatedResponse) {
        await saveMessageToDatabase({
          id: messageId,
          text: accumulatedResponse,
          sender: 'ai',
          isQuestion: false
        })
        await fetchChatSenntakusi(accumulatedResponse)
      } else {
        throw new Error('APIからレスポンスを受信できませんでした')
      }
    } catch (error) {
      console.error('streamResponseでエラーが発生しました:', error)
      updateMessage(messageId, 'データの読み込みに失敗しました。リロードをお願いします。')
    }
  }, [consultationId, saveMessageToDatabase, updateMessage])

  const initializeChat = useCallback(async () => {
    if (!consultationId || initializationRef.current) return

    console.log('チャットを初期化中...')
    initializationRef.current = true
    setIsLoading(true)

    try {
      console.log('相談データを取得中...')
      const { data, error } = await supabase
        .from('consultation_data')
        .select('*')
        .eq('consultation_id', consultationId)
        .single()

      if (error) throw error

      if (data) {
        console.log('相談データを取得しました:', data)
        setThreadID(data.thread_id || null)

        const questionnaireData = [
          { question: data.question_1, answer: data.answer_1 },
          { question: data.question_2, answer: data.answer_2 },
          { question: data.question_3, answer: data.answer_3 },
          { question: data.question_4, answer: data.answer_4 },
          { question: data.question_5, answer: data.answer_5 },
        ].filter(item => item.question && item.answer)

        const questionnairePrompt = questionnaireData.map(item => 
          `質問: ${item.question}\n回答: ${item.answer}`
        ).join('\n\n')

        addMessage(data.concern, 'user')
        const loadingMessageId = addMessage('回答を準備中です...', 'ai')

        const initialPrompt = `
          ユーザーの質問票の回答:
          ${questionnairePrompt}

          ユーザーの相談内容:
          ${data.concern}

          上記の情報を踏まえて、システムプロンプトに則りユーザーの相談に回答してください。
        `

        console.log('streamResponseを呼び出し中...')
        await streamResponse(initialPrompt, loadingMessageId, data.thread_id)
      }
    } catch (error) {
      console.error('チャットの初期化中にエラーが発生しました:', error)
      updateMessage('loading-message-id', 'データの取得に失敗しました。リロードをお願いします。')
    } finally {
      setIsLoading(false)
      setShowSurveyModal(true)
    }
  }, [consultationId, addMessage, updateMessage, streamResponse])

  useEffect(()=> {
    const initialize = async () => {
      await checkLoginStatus();
      if (consultationId && !initializationRef.current) {
        console.log('initializeChatを呼び出し中...')
        await initializeChat();
      }
    };
  
    initialize();
  }, [checkLoginStatus, initializeChat, consultationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as  Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isDropdownOpen && suggestionsRef.current) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      }
      suggestionsRef.current.scrollIntoView(scrollOptions)
    }
  }, [isDropdownOpen])

  const fetchChatSenntakusi = async (prompt: string) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_CHATSENNTAKUSI_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.status === 'OK' && data.result && data.result.content) {
        setSuggestionContent(data.result.content)
      } else {
        console.error('予期しないレスポンス形式:', data)
      }
    } catch (error) {
      console.error('チャット提案の取得中にエラーが発生しました:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() === '' || isLoading) return
  
    addMessage(inputMessage, 'user', true)
    setInputMessage('')
    setIsLoading(true)
  
    const aiMessageId = addMessage('回答を準備中です...', 'ai')
  
    try {
      await streamResponse(inputMessage, aiMessageId, threadID)
    } catch (error) {
      console.error('メッセージ送信中にエラーが発生しました:', error)
      updateMessage(aiMessageId, 'エラーが発生しました。リロードをお願いします。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    setIsDropdownOpen(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleSurveySubmit = async (answer: string) => {
    setShowSurveyModal(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user ? user.id : null

      const { error } = await supabase
        .from('survey_results')
        .insert({
          consultation_id: consultationId,
          answer: answer,
          uid: uid
        })

      if (error) throw error

      if (answer === '凄く思う') {
        setShowRegistrationModal(true)
      }
    } catch (error) {
      console.error('アンケート結果の保存中にエラーが発生しました:', error)
    }
  }

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistrationError(null)

    if (password !== confirmPassword) {
      setRegistrationError('パスワードが一致しません。')
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        const uid = authData.user.id

        const { error: chatError } = await supabase
          .from('chat_messages')
          .update({ uid: uid })
          .eq('consultation_id', consultationId)

        if (chatError) throw chatError

        const { error: consultationError } = await supabase
          .from('consultation_data')
          .update({ uid: uid })
          .eq('consultation_id', consultationId)

        if (consultationError) throw consultationError

        console.log('ユーザー登録とデータ更新が正常に完了しました:', authData.user)
        setShowRegistrationModal(false)
        setIsLoggedIn(true)
        await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }
    } catch (error) {
      console.error('登録またはデータ更新中にエラーが発生しました:', error)
      setRegistrationError('登録中にエラーが発生しました。もう一度お試しください。')
    }
  }

  const renderedMessages = useMemo(() => {
    return messages.map((message) => (
      <MessageComponent key={message.id} message={message} />
    ))
  }, [messages])

  return (
    <>
      <style jsx global>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          line-height: 1.2;
          font-weight: 600;
          color: #002341;
        }
        .markdown-content h1 {
          font-size: 1.5em;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.3em;
        }
        .markdown-content h2 {
          font-size: 1.3em;
        }
        .markdown-content h3 {
          font-size: 1.1em;
        }
        .markdown-content ul,
        .markdown-content ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .markdown-content li {
          margin-bottom: 0.5em;
        }
        .markdown-content p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        .markdown-content hr {
          margin: 1.5em 0;
          border-top: 1px solid #e5e7eb;
        }
        .markdown-content > *:first-child {
          margin-top: 0 !important;
        }
        .markdown-content > *:last-child {
          margin-bottom: 0 !important;
        }
        .markdown-content strong {
          font-weight: 600;
          color: #002341;
        }
        .markdown-content a {
          color: #002341;
          text-decoration: none;
        }
        .markdown-content a:hover {
          text-decoration: underline;
        }
        .markdown-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          color: #4a5568;
          font-style: italic;
        }
        .markdown-content code {
          background-color: #f1f5f9;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
        }
        .markdown-content pre {
          background-color: #f1f5f9;
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
        }
      `}</style>
      <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle_image/aicon100.png`}
              alt="Healthleロゴ"
              width={40}
              height={40}
              className="mr-3"
            />
            <div>
              <h1 className="text-2xl font-semibold text-[#002341]">Healthle</h1>
              <p className="text-sm text-gray-500">ヘルスル</p>
            </div>
          </div>
          <Link
            href="/"
            className="bg-[#002341] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="sr-only">ホームに戻る</span>
          </Link>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {renderedMessages}
          </div>
        </div>
        <div className={`bg-white border-t border-gray-200 p-4 ${isDropdownOpen ? 'mb-4' : ''}`}>
          <div className="max-w-3xl mx-auto">
            <div className="relative mb-3" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#E6EDF2] text-[#002341] px-4 py-2 rounded-lg text-sm hover:bg-[#D1E0ED] transition-colors flex justify-between items-center"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span>質問の候補</span>
                {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {isDropdownOpen && suggestionContent && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu"
                >
                  {Object.values(suggestionContent).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left px-4 py-2 text-sm text-[#002341] hover:bg-[#E6EDF2] transition-colors"
                      role="menuitem"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex items-end">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleTextareaChange}
                  placeholder="気になることはありますか？"
                  className="w-full p-4 pr-12 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002341] resize-none overflow-hidden"
                  disabled={isLoading}
                  rows={1}
                  style={{ minHeight: '2.5rem', paddingRight: '3rem' }}
                />
                <button
                  type="submit"
                  className={`absolute right-2 top-2 bg-[#002341] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  aria-label="送信"
                  disabled={isLoading}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSurveyModal && !isLoggedIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">満足度調査</h2>
            <p className="mb-4">より良いサービスを提供するために、満足度調査へのご協力をお願いします。</p>
            <p className="mb-4">健康に悩んだ時にまた相談したいですか？</p>
            <div className="space-y-2">
              {['凄く思う', '少し思う', 'あまり思わない', '全く思わない'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleSurveySubmit(option)}
                  className="w-full p-2 text-left bg-[#E6EDF2] hover:bg-[#D1E0ED] rounded-lg transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRegistrationModal && !isLoggedIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">アカウント登録</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="閉じる"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="mb-4">相談内容を記録し、後から見返すためにアカウント登録をしましょう！</p>
            <p className="mb-4">本サービスの機能は全て無料でご利用いただけます。</p>
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  パスワード（確認）
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#002341] focus:border-[#002341]"
                />
              </div>
              {registrationError && (
                <p className="text-red-500 text-sm">{registrationError}</p>
              )}
              <button
                type="submit"
                className="w-full p-2 bg-[#002341] text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                登録する
              </button>
            </form>
            <button
              onClick={() => setShowRegistrationModal(false)}
              className="w-full p-2 mt-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              今はしない
            </button>
          </div>
        </div>
      )}
      <HealthDisclaimerModal />
    </>
  )
}