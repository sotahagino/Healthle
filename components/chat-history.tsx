'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, HelpCircle, User, Home, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

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

const MessageComponent = React.memo(({ message }: { message: Message }) => (
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
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Healthle/doctor100_1010.png?t=2024-10-10T12%3A00%3A19.324Z`}
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
))

MessageComponent.displayName = 'MessageComponent'

export default function ChatHistory({ threadId = null }: { threadId?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestionContent, setSuggestionContent] = useState<SuggestionContent | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const thread_id = searchParams.get('thread_id') || threadId
  const messageIdRef = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const fetchChatHistory = useCallback(async () => {
    if (!thread_id) return

    try {
      setIsLoading(true)
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('thread_id', thread_id)
        .single()

      if (sessionError) throw sessionError

      if (sessionData) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_session_id', sessionData.id)
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
    } catch (err) {
      console.error('チャット履歴の取得中にエラーが発生しました:', err)
      setError('データの取得に失敗しました。リロードをお願いします。')
    } finally {
      setIsLoading(false)
    }
  }, [thread_id])

  useEffect(() => {
    fetchChatHistory()
  }, [fetchChatHistory])

  const saveMessageToDatabase = useCallback(async (message: Message) => {
    if (!thread_id) {
      console.error('チャットセッションIDが利用できません')
      return
    }

    try {
      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('thread_id', thread_id)
        .single()

      if (!sessionData) throw new Error('チャットセッションが見つかりません')

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: sessionData.id,
          sender: message.sender,
          message: message.text,
          is_question: message.isQuestion || false,
        })
        .select()

      if (error) throw error

      console.log('メッセージが正常に保存されました:', data)
      return data
    } catch (error) {
      console.error('saveMessageToDatabaseでエラーが発生しました:', error)
      throw error
    }
  }, [thread_id])

  const addMessage = useCallback((text: string, sender: 'user' | 'ai', isQuestion: boolean = false) => {
    messageIdRef.current += 1
    const newMessage: Message = {
      id: messageIdRef.current.toString(),
      text,
      sender,
      isQuestion,
    }
    setMessages(prevMessages => [...prevMessages, newMessage])
    
    saveMessageToDatabase(newMessage)
      .catch(error => console.error('メッセージ追加後の保存中にエラーが発生しました:', error))

    return newMessage.id
  }, [saveMessageToDatabase])

  const updateMessage = useCallback((id: string, text: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id ? { ...msg, text } : msg
      )
    )
  }, [])

  const fetchChatSenntakusi = useCallback(async (prompt: string) => {
    try {
      const response = await fetch('https://7u5n8i.buildship.run/chatsenntakusi', {
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
  }, [])

  const streamResponse = useCallback(async (message: string, messageId: string) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_WEBASSISTANT_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          threadId: thread_id || "",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
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
  }, [thread_id, updateMessage, saveMessageToDatabase, fetchChatSenntakusi])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() === '' || isLoading) return

    setError(null)
    addMessage(inputMessage, 'user', true)
    setInputMessage('')
    setIsLoading(true)

    const aiMessageId = addMessage('回答を準備中です...', 'ai')

    try {
      await streamResponse(inputMessage, aiMessageId)
    } catch (err) {
      console.error('メッセージ送信中にエラーが発生しました:', err)
      updateMessage(aiMessageId, 'エラーが発生しました。リロードをお願いします。')
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
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

  const adjustDropdownPosition = useCallback(() => {
    if (isDropdownOpen && dropdownRef.current && suggestionsRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const suggestionsRect = suggestionsRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (dropdownRect.bottom + suggestionsRect.height > viewportHeight) {
        suggestionsRef.current.style.bottom = `${dropdownRect.height}px`;
        suggestionsRef.current.style.top = 'auto';
      } else {
        suggestionsRef.current.style.top = `${dropdownRect.height}px`;
        suggestionsRef.current.style.bottom = 'auto';
      }
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isDropdownOpen) {
      adjustDropdownPosition();
    }
  }, [isDropdownOpen, adjustDropdownPosition]);

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
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/Healthle/aicon100_1010.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJIZWFsdGhsZS9haWNvbjEwMF8xMDEwLnBuZyIsImlhdCI6MTcyODU0NDIzNCwiZXhwIjoxODg2MjI0MjM0fQ.aYcgNRWaEdTPwxcvTOjMZgnAmYrLx6VafwQ_uHuvx0w&t=2024-10-10T07%3A10%3A35.946Z`}
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
          {error && (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          )}
          {renderedMessages}
        </div>
      </div>
      <div className={`bg-white border-t border-gray-200 p-4 ${isDropdownOpen ? 'mb-4' : ''}`}>
        <div className="max-w-3xl mx-auto">
          <div className="relative mb-3" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-[#F0F0F0] text-[#002341] px-4 py-2 rounded-lg text-sm hover:bg-[#E6E6E6] transition-colors flex justify-between items-center"
              
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <span>質問の候補</span>
              {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isDropdownOpen && suggestionContent && (
              <div 
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-[#F8F8F8] border border-gray-200 rounded-lg shadow-lg"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                {Object.values(suggestionContent).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left px-4 py-2 text-sm text-[#002341] hover:bg-[#E6E6E6] transition-colors"
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
                onChange={(e) => setInputMessage(e.target.value)}
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
    </>
  )
}