'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, HelpCircle, User, Home, ChevronDown, ChevronUp, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
)

const supabase = createClient(
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

const MessageComponent = React.memo(
  ({ message }: { message: Message }) => (
    <Card className="my-4">
      <CardContent>
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
              alt="Doctor Icon"
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
            h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
            h2: (props) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
            h3: (props) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
            h4: (props) => <h4 className="text-base font-medium mt-3 mb-2" {...props} />,
            h5: (props) => <h5 className="text-sm font-medium mt-2 mb-1" {...props} />,
            h6: (props) => <h6 className="text-xs font-medium mt-2 mb-1" {...props} />,
            p: (props) => <p className="my-2 leading-relaxed" {...props} />,
            ul: (props) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
            ol: (props) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
            li: (props) => <li className="my-1" {...props} />,
            a: (props) => (
              <a className="text-[#002341] hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
            ),
            blockquote: (props) => (
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
            hr: (props) => <hr className="my-4 border-t border-gray-300" {...props} />,
            em: (props) => <em className="italic text-gray-700" {...props} />,
            strong: (props) => <strong className="font-bold text-gray-900" {...props} />,
          }}
        >
          {message.text}
        </ReactMarkdown>
      </CardContent>
    </Card>
  ),
  (prevProps, nextProps) => prevProps.message.text === nextProps.message.text
)

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
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
  //const suggestionsRef = useRef<HTMLDivElement>(null)
  const [threadID, setThreadID] = useState<string | null>(null)
  const [assistantInstructions, setAssistantInstructions] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const checkLoginStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }

  useEffect(() => {
    const initializeChat = async () => {
      await checkLoginStatus();
      if (consultationId) {
        await fetchChatHistory(consultationId);
      }
      await fetchLogoUrl();
    };

    initializeChat();
  }, [consultationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const fetchLogoUrl = async () => {
    try {
      const { data } = await supabase
        .storage
        .from('Healthle_image')
        .getPublicUrl('aicon100.png')

      setLogoUrl(data.publicUrl)
    } catch (error) {
      console.error('Error fetching logo URL:', error)
    }
  }

  const fetchChatHistory = async (id: string) => {
    try {
      setIsLoading(true)
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultation_data')
        .select('*')
        .eq('consultation_id', id)
        .single()

      if (consultationError) throw consultationError

      if (consultationData) {
        setAssistantInstructions(consultationData.sprompt)
        setThreadID(consultationData.thread_id || null)

        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('consultation_id', id)
          .order('created_at', { ascending: true })

        if (messagesError) throw messagesError

        if (Array.isArray(messagesData)) {
          const formattedMessages = messagesData.map(msg => ({
            id: msg.id,
            text: msg.message,
            sender: msg.sender,
            isQuestion: msg.is_question
          }))
          setMessages(formattedMessages)
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveMessageToDatabase = useCallback(async (message: Message) => {
    if (!consultationId) {
      console.error('No consultation ID available')
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
        console.error('Error saving message to database:', error)
        throw error
      }
  
      console.log('Message saved successfully:', data)
    } catch (error) {
      console.error('Error in saveMessageToDatabase:', error)
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
        .catch(error => console.error('Error saving message after adding:', error))
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

  const streamResponse = async (sprompt: string, message: string, messageId: string, threadId: string | null) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_WEBASSISTANT_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sprompt: sprompt || "",
          message: message || "",
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
            console.error('Error saving thread_id to database:', error)
          }
        }
      }

      if (!response.body) {
        throw new Error('Response body is null')
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
              console.error('Error parsing JSON:', error)
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
        throw new Error('No response received from the API')
      }
    } catch (error) {
      console.error('Error in stream response:', error)
      updateMessage(messageId, 'APIからの応答の取得に失敗しました。もう一度お試しください。')
    }
  }

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
        console.error('Unexpected response format:', data)
      }
    } catch (error) {
      console.error('Error fetching chat suggestions:', error)
    }
  }

  const handleSendMessage = async (e:  React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() === '' || isLoading) return
  
    addMessage(inputMessage, 'user', true)
    setInputMessage('')
    setIsLoading(true)
  
    const aiMessageId = addMessage('回答を生成中です...', 'ai')
  
    try {
      await streamResponse(assistantInstructions || '', inputMessage, aiMessageId, threadID)
    } catch (error) {
      console.error('Error sending message:', error)
      updateMessage(aiMessageId, 'エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    setIsDropdownOpen(false)
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
      console.error('Error saving survey result:', error)
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

        console.log('User registered and data updated successfully:', authData.user)
        setShowRegistrationModal(false)
        setIsLoggedIn(true)
        await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }
    } catch (error) {
      console.error('Error during registration or data update:', error)
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
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="Healthle Logo"
                width={40}
                height={40}
                className="mr-3"
              />
            )}
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
        <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {renderedMessages}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="relative mb-3" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-[#E6EDF2] text-[#002341] px-4 py-2 rounded-lg text-sm hover:bg-[#D1E0ED] transition-colors flex justify-between items-center"
                >
                  <span>質問の候補</span>
                  {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isDropdownOpen && suggestionContent && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                  >
                    {Object.values(suggestionContent).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left px-4 py-2 text-sm text-[#002341] hover:bg-[#E6EDF2] transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="気になることはありますか？"
                    className="w-full p-4 pr-12 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002341]"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#002341] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors flex items-center justify-center ${
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
      </div>

      {showSurveyModal && !isLoggedIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">アカウント登録</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-gray-500 hover:text-gray-700"
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
    </>
  )
}