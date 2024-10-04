'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function HealthDisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(true)
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#002341]">免責事項</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-gray-700">
          本サービスは、ヘルスケアに関する情報提供を行うものであり、医師や専門家が特定の疾病や病気、障害を診断・治療・予防・医療アドバイスをする医療行為ではありません。
        </p>
        <button
          onClick={() => setIsOpen(false)}
          className="w-full p-2 bg-[#002341] text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          理解しました
        </button>
      </div>
    </div>
  )
}