'use client'

import { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import Button from './Button'
import Input from './Input'
import Badge from './Badge'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support'
  timestamp: Date
  isRead?: boolean
}

interface ChatProps {
  initialMessages?: Message[]
  supportName?: string
  supportAvatar?: string
  position?: 'bottom-right' | 'bottom-left'
}

const defaultMessages: Message[] = [
  {
    id: '1',
    text: 'Halo! Selamat datang di Tokodus Support. Ada yang bisa kami bantu?',
    sender: 'support',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: true
  },
  {
    id: '2',
    text: 'Saya ingin menanyakan status pesanan terbaru saya',
    sender: 'user',
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    isRead: true
  },
  {
    id: '3',
    text: 'Tentu, bisa berikan nomor ordernya? Saya akan cek kan segera.',
    sender: 'support',
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    isRead: true
  }
]

export default function Chat({ 
  initialMessages = defaultMessages,
  supportName = 'Tim Support Tokodus',
  supportAvatar = 'mdi:headset',
  position = 'bottom-right'
}: ChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      // Reset unread count when chat opens
      setUnreadCount(0)
      // Mark all messages as read
      setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })))
    } else {
      // Count unread support messages
      const unread = messages.filter(msg => msg.sender === 'support' && !msg.isRead).length
      setUnreadCount(unread)
    }
  }, [isOpen, messages])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      isRead: true
    }

    setMessages(prev => [...prev, newUserMessage])
    setInputMessage('')
    scrollToBottom()

    // Simulate support response after 1 second
    setTimeout(() => {
      const supportResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Terima kasih atas pesannya. Tim kami akan segera merespon dalam waktu 5 menit.',
        sender: 'support',
        timestamp: new Date(),
        isRead: isOpen
      }
      setMessages(prev => [...prev, supportResponse])
      if (!isOpen) {
        setUnreadCount(prev => prev + 1)
      }
      scrollToBottom()
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-amber-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
          <div className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105">
            <Icon icon="mdi:chat-processing" className="w-6 h-6" />
            {unreadCount > 0 && !isOpen && (
              <Badge variant="danger" className="absolute -top-1 -right-1 !rounded-full !px-1.5 !py-0.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </button>

        {/* Chat Window */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-amber-400 to-blue-400" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon icon={supportAvatar} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{supportName}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-xs text-blue-100">Online</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-96 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-white">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-700 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 p-4 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ketik pesan..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  leftIcon="mdi:message-text"
                />
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  icon="mdi:send"
                  className="!px-3"
                >
                  Kirim
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Biasanya dibalas dalam <span className="font-medium text-blue-600">5 menit</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}