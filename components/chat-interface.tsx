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
    <div className={`my-4 p-4 rounded-lg shadow-md ${message.sender === 'user' ? 'bg-blue-50' : 'bg-white'}`}>
      <div className="flex items-center mb-2">
        {message.sender === 'user' ? (
          message.isQuestion ? (
            <HelpCircle className="w-6 h-6 mr-2 text-blue-600" />
          ) : (
            <User className="w-6 h-6 mr-2 text-blue-600" />
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
        <p className="text-lg font-semibold text-blue-800">
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
          h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-blue-800" {...props} />,
          h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-5 mb-3 text-blue-800" {...props} />,
          h3: ({ ...props }) => <h3 className="text-lg font-medium mt-4 mb-2 text-blue-800" {...props} />,
          h4: ({ ...props }) => <h4 className="text-base font-medium mt-3 mb-2 text-blue-800" {...props} />,
          h5: ({ ...props }) => <h5 className="text-sm font-medium mt-2 mb-1 text-blue-800" {...props} />,
          h6: ({ ...props }) => <h6 className="text-xs font-medium mt-2 mb-1 text-blue-800" {...props} />,
          p: ({ ...props }) => <p className="my-2 leading-relaxed text-gray-700" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-6 my-2 space-y-1 text-gray-700" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-6 my-2 space-y-1 text-gray-700" {...props} />,
          li: ({ ...props }) => <li className="my-1" {...props} />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-blue-300 pl-4 italic my-2 text-gray-600" {...props} />
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
              <code className="bg-gray-100 rounded px-1 py-0.5 text-sm" {...props}>
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

interface ChatInterfaceProps {
  threadId?: string | null
  initialMessages?: Message[]
}

export default function ChatInterface({ threadId, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
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
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const messageIdRef = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [threadID, setThreadID] = useState<string | null>(threadId || null)
  const initializationRef = useRef(false)
  const [textareaHeight, setTextareaHeight] = useState('auto')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chatStyles = {
    container: "flex flex-col h-screen bg-gray-50",
    header: "bg-white shadow-md py-4 px-6 flex items-center justify-between",
    logo: "flex items-center",
    title: "text-2xl font-bold text-blue-800",
    subtitle: "text-sm text-gray-500",
    homeButton: "bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors",
    chatArea: "flex-1 overflow-y-auto p-6",
    inputArea: "bg-white border-t border-gray-200 p-4",
    inputContainer: "max-w-3xl mx-auto",
    dropdownButton: "w-full bg-gray-100 text-blue-800 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex justify-between items-center mb-3",
    suggestionList: "absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg",
    suggestionItem: "block w-full text-left px-4 py-2 text-sm text-blue-800 hover:bg-gray-100 transition-colors",
    textarea: "w-full p-3 pr-14 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none overflow-hidden",
    sendButton: "absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center",
  }

  // Modal styles
  const modalStyles = {
    overlay: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4",
    container: "bg-white rounded-lg p-6 max-w-md w-full",
    title: "text-xl font-semibold mb-4 text-blue-800",
    text: "mb-4 text-gray-700",
    button: "block w-full text-left px-4 py-2 text-sm text-blue-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors",
    input: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
    submitButton: "w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
    cancelButton: "w-full p-2 mt-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors",
  }

  
  // メッセージをデータベースに保存する関数
  const saveMessageToDatabase = useCallback(async (message: Message) => {
    if (!sessionId) {
      console.error('チャットセッションIDが利用できません')
      return
    }
  
    // "準備中" メッセージは保存しない
    if (message.text === '回答を準備中です...') {
      return
    }
  
    try {
      console.log('メッセージ保存試行:', message)
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: sessionId,
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
  }, [sessionId])

  // メッセージを保存し追加する関数
  const addMessage = useCallback((text: string, sender: 'user' | 'ai', isQuestion: boolean = false) => {
    messageIdRef.current += 1
    const newMessage: Message = {
      id: messageIdRef.current.toString(),
      text,
      sender,
      isQuestion,
    }
    setMessages(prevMessages => [...prevMessages, newMessage])
    
    if (sessionId) {
      saveMessageToDatabase(newMessage)
        .catch(error => console.error('メッセージ追加後の保存中にエラーが発生しました:', error))
    } else {
      console.warn('チャットセッションIDがないため、メッセージを保存できません')
    }

    return newMessage.id
  }, [sessionId, saveMessageToDatabase])

  // メッセージを更新する関数
  const updateMessage = useCallback((id: string, text: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === id ? { ...msg, text } : msg
      )
    )
  }, [])

  // 選択肢生成APIを呼び出す関数
  const fetchChatSenntakusi = useCallback(async (prompt: string) => {
    try {
      console.log('選択肢生成APIを呼び出し中...', process.env.NEXT_PUBLIC_CHATSENNTAKUSI_URL);
      const response = await fetch('https://7u5n8i.buildship.run/chatsenntakusi', { // 固定のURLを使用
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      console.log('APIレスポンスステータス:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('選択肢生成APIからの応答:', data);
      if (data.status === 'OK' && data.result && data.result.content) {
        setSuggestionContent(data.result.content)
        console.log('選択肢が正常に設定されました:', data.result.content);
      } else {
        console.error('予期しないレスポンス形式:', data)
      }
    } catch (error) {
      console.error('チャット提案の取得中にエラーが発生しました:', error)
    }
  }, []);

  // 回答用APIからのストリーミングレスポンスを理する関数
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
        if (sessionId) {
          const { error } = await supabase
            .from('chat_sessions')
            .update({ thread_id: newThreadId })
            .eq('id', sessionId)
          
          if (error) {
            console.error('chat_sessionsの更新中にエラーが発生しました:', error)
          } else {
            console.log('chat_sessionsが正常に更新されました')
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
              // 一部の行が失敗しても続行
            }
          }
        }
      }
  
      if (accumulatedResponse) {
        console.log('保存するAIメッセージ:', accumulatedResponse)
        if (sessionId) {
          try {
            const savedMessage = await saveMessageToDatabase({
              id: messageId,
              text: accumulatedResponse,
              sender: 'ai',
              isQuestion: false
            })
            console.log('AIメッセージが保存されました:', savedMessage)
          } catch (error) {
            console.error('AIメッセージの保存中にエラーが発しました:', error)
          }
        } else {
          console.warn('チャットセッションIDがないため、AIの応答を保存できません')
        }
        // AIの応答が完了した後に選択肢生成APIを呼び出す
        console.log('AIの応答が完了しました。選択肢生成APIを呼び出します。');
        await fetchChatSenntakusi(accumulatedResponse)
      } else {
        throw new Error('APIからレスポンスを受信できませんでした')
      }
    } catch (error) {
      console.error('streamResponseでエラーが発生しました:', error)
      updateMessage(messageId, 'データの読み込みに失敗しました。リロードをお願いします。')
    }
  }, [sessionId, saveMessageToDatabase, updateMessage, fetchChatSenntakusi])

  // チャットを初期化する関数
  const initializeChat = useCallback(async () => {
    if (!sessionId || initializationRef.current) return

    console.log('チャットを初期化中...')
    initializationRef.current = true
    setIsLoading(true)

    try {
      console.log('チャットセッションデータを取得中...')
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*, initial_consultations(*)')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError

      if (sessionData) {
        console.log('チャットセッションデータを取得しました:', sessionData)
        
        // ①画面にお悩みを表示
        if (sessionData.initial_consultations && sessionData.initial_consultations.consultation_text) {
          addMessage(sessionData.initial_consultations.consultation_text, 'user', false)
          
          // ②お悩みをchat_messagesに保存
          // 既にaddMessage関数で保存されていす
          
          // ③ユーザーの相談内容を元に回答用APIを実行
          setIsLoading(true)
          const aiMessageId = addMessage('回答を準備中です...', 'ai')
          
          const initialPrompt = `
            ユーザーの相談内容:
             ${sessionData.initial_consultations.consultation_text}
            上記の情報を踏まえて、システムプロンプトに則りユーザーの相談に回答してください。
          `
          
          console.log('streamResponseを呼び出し中...')
          await streamResponse(initialPrompt, aiMessageId, sessionData.thread_id)
        }
      }
    } catch (error) {
      console.error('チャットの初期化中にエラーが生しました:', error)
      setError('データの取得に失敗しました。リロードをお願いします。')
    } finally {
      setIsLoading(false)
      setShowSurveyModal(true)
    }
  }, [sessionId, addMessage, streamResponse])

  // ログイン状態を確認する関数
  const checkLoginStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    } catch (error) {
      console.error('Failed to check login status:', error)
      setIsLoggedIn(false)
    }
  }

  // checkLoginStatusをuseCallbackでラップ
  const memoizedCheckLoginStatus = useCallback(checkLoginStatus, [])

  useEffect(() => {
    const initialize = async () => {
      await memoizedCheckLoginStatus();
      if (sessionId && !initializationRef.current) {
        console.log('initializeChatを呼び出し中...')
        await initializeChat();
      }
    };

    initialize();
  }, [memoizedCheckLoginStatus, initializeChat, sessionId]);

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    setIsDropdownOpen(false)
    if (textareaRef.current) {
      textareaRef.current.focus()
      adjustTextareaHeight()
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }
  
  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage])

  // 回答用APIをストリーミングで表示保存する数
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() === '' || isLoading) return

    // userMessageId を使用するか、完全に削除します
    // const userMessageId = addMessage(inputMessage, 'user', true)
    addMessage(inputMessage, 'user', true)
    setInputMessage('')
    setIsLoading(true)

    const aiMessageId = addMessage('回答を準備中です...', 'ai')

    try {
      await streamResponse(inputMessage, aiMessageId, threadID)
    } catch (err) {
      console.error('メッセージ送信中にエラーが発生しました:', err)
      updateMessage(aiMessageId, 'エラーが発生しました。リロードをお願いします。')
    } finally {
      setIsLoading(false)
    }
  }

  // ドロップダウンの位置を調整する関数を追加
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

  // useEffectを修正
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

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (data.user) {
        const userId = data.user.id;

        // chat_sessions, initial_consultations, survey_responsesのuser_idを更新
        if (sessionId) {
          const updates = [
            supabase.from('chat_sessions').update({ user_id: userId }).eq('id', sessionId),
            supabase.from('initial_consultations').update({ user_id: userId }).eq('chat_session_id', sessionId),
            supabase.from('survey_responses').update({ user_id: userId }).eq('chat_session_id', sessionId),
          ];

          const results = await Promise.all(updates);
          results.forEach((result, index) => {
            if (result.error) {
              console.error(`Error updating table ${index}:`, result.error);
            }
          });
        }

        setIsLoggedIn(true);
        setShowRegistrationModal(false);
      }
    } catch (error) {
      console.error('登録エラー:', error);
      setRegistrationError('登録に失敗しました。もう一度お試しください。');
    }
  };

  const handleSurveySubmit = async (option: string) => {
    try {
      console.log('選択されたオプション:', option);
      setShowSurveyModal(false);

      if (option === '凄く思う') {
        setShowRegistrationModal(true);
      }

      // サーベイ回答をデータベースに保存
      if (sessionId) {
        const { error } = await supabase
          .from('survey_responses')
          .insert({
            chat_session_id: sessionId,
            response: option,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('サーベイの送信中にエラーが発生しました:', error);
    }
  };

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
          color: #1e40af;
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
          color: #1e40af;
        }
        .markdown-content a {
          color: #2563eb;
          text-decoration: none;
        }
        .markdown-content a:hover {
          text-decoration: underline;
        }
        .markdown-content blockquote {
          border-left: 4px solid #93c5fd;
          padding-left: 1em;
          color: #4b5563;
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
      <div className={chatStyles.container}>
        <header className={chatStyles.header}>
          <div className={chatStyles.logo}>
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/sign/Healthle/aicon100_1010.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJIZWFsdGhsZS9haWNvbjEwMF8xMDEwLnBuZyIsImlhdCI6MTcyODU0NDIzNCwiZXhwIjoxODg2MjI0MjM0fQ.aYcgNRWaEdTPwxcvTOjMZgnAmYrLx6VafwQ_uHuvx0w&t=2024-10-10T07%3A10%3A35.946Z`}
              alt="Healthleロゴ"
              width={40}
              height={40}
              className="mr-3"
            />
            <div>
              <h1 className={chatStyles.title}>Healthle</h1>
              <p className={chatStyles.subtitle}>へルスル</p>
            </div>
          </div>
          
          <Link href="/" className={chatStyles.homeButton}>
            <Home className="w-5 h-5" />
            <span className="sr-only">ホームに戻る</span>
          </Link>
        </header>
        <div className={chatStyles.chatArea}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <MessageComponent key={message.id} message={message} />
            ))}
          </div>
        </div>
        <div className={chatStyles.inputArea}>
          <div className={chatStyles.inputContainer}>
            <div className="relative mb-3" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={chatStyles.dropdownButton}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span>質問の候補</span>
                {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {isDropdownOpen && suggestionContent && (
                <div 
                  ref={suggestionsRef}
                  className={chatStyles.suggestionList}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu"
                >
                  {Object.values(suggestionContent).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={chatStyles.suggestionItem}
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
                  onChange={(e) => {
                    setInputMessage(e.target.value)
                    adjustTextareaHeight()
                  }}
                  placeholder="気になることはありますか？"
                  className={chatStyles.textarea}
                  disabled={isLoading}
                  rows={1}
                  style={{ minHeight: '2.5rem' }}
                />
                <button
                  type="submit"
                  className={`${chatStyles.sendButton} ${
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
        <div className={modalStyles.overlay} role="dialog" aria-modal="true">
          <div className={modalStyles.container}>
            <h2 className={modalStyles.title}>満足度調査</h2>
            <p className={modalStyles.text}>より良いサービスを提供するために、満足度調査へのご協力をお願いします。</p>
            <p className={modalStyles.text}>健康に悩んだ時にまた相談したいですか？</p>
            <div className="space-y-2">
              {['凄く思う', '少し思う', 'あまり思わない', '全く思わない'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleSurveySubmit(option)}
                  className={modalStyles.button}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRegistrationModal && !isLoggedIn && (
        <div className={modalStyles.overlay} role="dialog" aria-modal="true">
          <div className={modalStyles.container}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={modalStyles.title}>アカウント登録</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="閉じる"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className={modalStyles.text}>相談内容を記録し、後から見返すためにアカウント登録をしましょう！</p>
            <p className={modalStyles.text}>本サービスの機能は全て無料でご利用いただけます。</p>
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
                  className={modalStyles.input}
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
                  className={modalStyles.input}
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
                  className={modalStyles.input}
                />
              </div>
              {registrationError && (
                <p className="text-red-500 text-sm">{registrationError}</p>
              )}
              <button
                type="submit"
                className={modalStyles.submitButton}
              >
                登録する
              </button>
            </form>
            <button
              onClick={() => setShowRegistrationModal(false)}
              className={modalStyles.cancelButton}
            >
              今はしない
            </button>
          </div>
        </div>
      )}
      <HealthDisclaimerModal />
      {error && <p className="text-red-500">{error}</p>}
    </>
  )
}