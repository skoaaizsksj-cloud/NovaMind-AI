import { useEffect, useRef, useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Send,
  Square,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Languages,
  Activity,
  AlertCircle,
} from 'lucide-react'
import { Streamdown } from 'streamdown'

import { useAIChat, INITIAL_NOVA_MESSAGE } from '@/lib/ai-hook'
import type { ChatMessages } from '@/lib/ai-hook'
import {
  speakNovaText,
  stopNovaSpeech,
  isSpeechRecognitionSupported,
  detectLanguage,
  cleanTextForSpeech,
} from '@/lib/voice'

// Starter prompt suggestions
const STARTER_PROMPTS = [
  { bn: 'কেমন আছেন আপনি?', en: 'How are you doing today?' },
  { bn: 'নোভা, আপনি কী কী করতে পারেন?', en: 'Nova, what can you help me with?' },
  { bn: 'আমাকে একটি অনুপ্রেরণামূলক গল্প বলুন', en: 'Tell me an inspiring short story' },
  { bn: 'কৃত্রিম বুদ্ধিমত্তা সহজ ভাষায় বুঝিয়ে বলো', en: 'Explain Artificial Intelligence simply' },
  { bn: 'সারাদিনের কাজের একটি সুন্দর রুটিন দাও', en: 'Give me a productive daily schedule' },
]

function SoundWaveVisualizer({ active, color = 'cyan' }: { active: boolean; color?: 'cyan' | 'red' | 'blue' }) {
  if (!active) return null

  const colorClasses = {
    cyan: 'bg-sky-400',
    red: 'bg-rose-500',
    blue: 'bg-blue-400',
  }[color]

  return (
    <div className="flex items-center gap-1 h-5 px-2">
      <span className={`w-1 rounded-full wave-bar-1 ${colorClasses}`} />
      <span className={`w-1 rounded-full wave-bar-2 ${colorClasses}`} />
      <span className={`w-1 rounded-full wave-bar-3 ${colorClasses}`} />
      <span className={`w-1 rounded-full wave-bar-4 ${colorClasses}`} />
      <span className={`w-1 rounded-full wave-bar-5 ${colorClasses}`} />
    </div>
  )
}

function MessageItem({
  message,
  isSpeakingThis,
  onSpeak,
  onStopSpeak,
  speechLang,
}: {
  message: ChatMessages[number]
  isSpeakingThis: boolean
  onSpeak: (text: string, id: string) => void
  onStopSpeak: () => void
  speechLang: 'bn-BD' | 'en-US'
}) {
  const [copied, setCopied] = useState(false)
  const isAssistant = message.role === 'assistant'

  // Extract all text content
  const fullText = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as any).content || '')
    .join(' ')

  const handleCopy = () => {
    if (!fullText) return
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`flex gap-3 max-w-4xl w-full mx-auto p-3 sm:p-4 rounded-2xl transition-all ${
        isAssistant
          ? 'bg-slate-900/90 border border-slate-800/80 shadow-lg'
          : 'bg-gradient-to-r from-blue-950/40 via-blue-900/30 to-slate-900/40 border border-blue-900/40'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 pt-1">
        {isAssistant ? (
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 p-[1.5px] shadow-md shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            {isSpeakingThis && (
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500" />
              </span>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-wide text-slate-200">
              {isAssistant ? 'নোভা (Nova AI)' : 'আপনি (You)'}
            </span>
            {isAssistant && isSpeakingThis && (
              <span className="inline-flex items-center gap-1.5 text-xs text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded-full font-medium">
                <SoundWaveVisualizer active={true} color="cyan" />
                কথা বলছে...
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isAssistant && fullText && (
              <button
                onClick={() => {
                  if (isSpeakingThis) {
                    onStopSpeak()
                  } else {
                    onSpeak(fullText, message.id)
                  }
                }}
                title={isSpeakingThis ? 'ভয়েস থামান' : 'ভয়েসে শুনুন'}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  isSpeakingThis
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60 hover:bg-rose-900/80'
                    : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/80'
                }`}
              >
                {isSpeakingThis ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">থামুন</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">শুনুন</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleCopy}
              title="টেক্সট কপি করুন"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="text-slate-100 text-[15px] leading-relaxed break-words font-normal">
          {message.parts.map((part, index) => {
            if (part.type === 'text' && part.content) {
              return (
                <div key={index} className="prose prose-invert prose-dark max-w-none text-slate-200">
                  <Streamdown>{part.content}</Streamdown>
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}

function Home() {
  const [input, setInput] = useState('')
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const lastSpokenMsgIdRef = useRef<string | null>(null)

  const { messages, sendMessage, isLoading, stop, setMessages } = useAIChat()

  // Initialize browser speech recognition check
  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported())
  }, [])

  // Auto-scroll on new message or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-speak new assistant responses when streaming completes
  useEffect(() => {
    if (!autoSpeak) return

    // If chat is no longer loading and we have messages
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        lastMessage.id !== lastSpokenMsgIdRef.current &&
        lastMessage.id !== INITIAL_NOVA_MESSAGE.id // Don't auto-speak initial greeting on initial load
      ) {
        const fullText = lastMessage.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as any).content || '')
          .join(' ')

        if (fullText.trim()) {
          lastSpokenMsgIdRef.current = lastMessage.id
          handleSpeak(fullText, lastMessage.id)
        }
      }
    }
  }, [isLoading, messages, autoSpeak])

  // Stop speaking and speech recognition on unmount
  useEffect(() => {
    return () => {
      stopNovaSpeech()
      if (recognitionRef.current) {
        recognitionRef.current.abort?.()
      }
    }
  }, [])

  // Text-To-Speech handler
  const handleSpeak = useCallback(
    (text: string, messageId: string) => {
      stopNovaSpeech()
      setSpeakingMessageId(messageId)
      setIsSpeaking(true)

      const langToUse = speechLang || detectLanguage(text)

      const success = speakNovaText(text, {
        lang: langToUse,
        onStart: () => {
          setIsSpeaking(true)
          setSpeakingMessageId(messageId)
        },
        onEnd: () => {
          setIsSpeaking(false)
          setSpeakingMessageId(null)
        },
        onError: (err) => {
          console.warn('SpeechSynthesis error:', err)
          setIsSpeaking(false)
          setSpeakingMessageId(null)
        },
      })

      if (!success) {
        setIsSpeaking(false)
        setSpeakingMessageId(null)
      }
    },
    [speechLang]
  )

  const handleStopSpeaking = useCallback(() => {
    stopNovaSpeech()
    setIsSpeaking(false)
    setSpeakingMessageId(null)
  }, [])

  // Speech Recognition (STT) toggle
  const toggleVoice = useCallback(() => {
    if (!speechSupported) {
      setStatusMessage('আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। Google Chrome বা Edge ব্যবহার করুন।')
      return
    }

    // Stop speaking if currently speaking
    if (isSpeaking) {
      handleStopSpeaking()
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setStatusMessage('ভয়েস রিকগনিশন সুবিধা পাওয়া যায়নি।')
      return
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      setStatusMessage('')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = speechLang
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setStatusMessage(
          speechLang === 'bn-BD'
            ? '🎙️ শুনছি... আপনার কথা বলুন...'
            : '🎙️ Listening... speak into your microphone...'
        )
      }

      recognition.onend = () => {
        setIsListening(false)
        setStatusMessage('')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim()
        if (transcript) {
          setInput(transcript)
          setStatusMessage(
            speechLang === 'bn-BD'
              ? `🗣️ আপনি বলেছেন: "${transcript}"`
              : `🗣️ Heard: "${transcript}"`
          )
          // Automatically send message on speech end as in original demo
          sendMessage(transcript)
          setInput('')
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech Recognition Error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setStatusMessage('❌ মাইক্রোফোনের অনুমতি পাওয়া যায়নি। ব্রাউজারের পারমিশন চেক করুন।')
        } else if (event.error === 'no-speech') {
          setStatusMessage('⚠️ কোনো কথা শুনতে পাওয়া যায়নি। আবার চেষ্টা করুন।')
        } else {
          setStatusMessage('⚠️ কথা বুঝতে সমস্যা হয়েছে, আবার বলুন।')
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
      setStatusMessage('মাইক্রোফোন চালু করতে ব্যর্থ হয়েছে।')
    }
  }, [speechSupported, isSpeaking, isListening, speechLang, handleStopSpeaking, sendMessage])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    if (isSpeaking) {
      handleStopSpeaking()
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    sendMessage(input.trim())
    setInput('')
    setStatusMessage('')
  }

  const handlePromptClick = (text: string) => {
    if (isLoading) return
    if (isSpeaking) handleStopSpeaking()
    sendMessage(text)
  }

  const handleResetChat = () => {
    handleStopSpeaking()
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    setMessages([INITIAL_NOVA_MESSAGE])
    setStatusMessage('')
  }

  return (
    <div className="flex flex-col h-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex-shrink-0 bg-slate-900/95 border-b border-slate-800/90 px-4 py-3 backdrop-blur-md z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 p-[1.5px] shadow-lg shadow-sky-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-400 to-blue-400">
                  ✨ Nova AI Voice Assistant
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-medium bg-sky-950/80 text-sky-300 border border-sky-800/60 px-2 py-0.5 rounded-full">
                  নোভা এআই
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block">
                বাংলা ও ইংরেজিতে কথা শুনুন ও বলুন
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSpeechLang('bn-BD')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  speechLang === 'bn-BD'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="বাংলা ভাষা নির্বাচন করুন"
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setSpeechLang('en-US')}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  speechLang === 'en-US'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {/* Audio Auto-Speak Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !autoSpeak
                setAutoSpeak(next)
                if (!next) handleStopSpeaking()
              }}
              title={autoSpeak ? 'অটো ভয়েস চালু (Auto-speak ON)' : 'অটো ভয়েস বন্ধ (Auto-speak OFF)'}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                autoSpeak
                  ? 'bg-sky-950/60 text-sky-300 border-sky-800/60 hover:bg-sky-900/60'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline font-medium">
                {autoSpeak ? 'ভয়েস চালু' : 'নিঃশব্দ'}
              </span>
            </button>

            {/* Stop Voice button when actively speaking */}
            {isSpeaking && (
              <button
                type="button"
                onClick={handleStopSpeaking}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-500/30 transition-all animate-pulse"
                title="কথা থামান"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">ভয়েস থামান</span>
              </button>
            )}

            {/* Clear conversation */}
            <button
              type="button"
              onClick={handleResetChat}
              title="নতুন চ্যাট শুরু করুন"
              className="p-2 rounded-lg bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Message Area */}
      <main className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 py-4 space-y-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Welcome Card if only initial message */}
          {messages.length <= 1 && (
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 text-center shadow-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-3 glow-cyan">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
                স্বাগতম! আমি নোভা এআই ভয়েস অ্যাসিস্ট্যান্ট
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto mb-5 leading-relaxed">
                মুখে কথা বলে বা লিখে যেকোনো প্রশ্ন করুন। আমি আপনার কথা শুনে বাংলায় ও ইংরেজিতে সঠিক উত্তর দেব।
              </p>

              {/* Starter Suggestions */}
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {STARTER_PROMPTS.map((prompt, index) => {
                  const text = speechLang === 'bn-BD' ? prompt.bn : prompt.en
                  return (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(text)}
                      className="text-xs bg-slate-950/80 hover:bg-sky-950/50 hover:text-sky-300 hover:border-sky-700/60 text-slate-300 border border-slate-800 px-3 py-2 rounded-xl transition-all text-left flex items-center gap-2 group"
                    >
                      <span className="text-sky-400 group-hover:scale-110 transition-transform">✨</span>
                      <span>{text}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Render all messages */}
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isSpeakingThis={isSpeaking && speakingMessageId === message.id}
              onSpeak={handleSpeak}
              onStopSpeak={handleStopSpeaking}
              speechLang={speechLang}
            />
          ))}

          {/* Thinking / Streaming Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/60 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>নোভা ভাবছে ও উত্তর তৈরি করছে...</span>
                <SoundWaveVisualizer active={true} color="blue" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>
      </main>

      {/* Floating Status Banner */}
      {(statusMessage || isListening || isSpeaking) && (
        <div className="flex-shrink-0 max-w-2xl mx-auto px-4 w-full">
          <div
            className={`flex items-center justify-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border shadow-lg transition-all ${
              isListening
                ? 'bg-rose-950/80 border-rose-800/80 text-rose-200'
                : isSpeaking
                ? 'bg-sky-950/80 border-sky-800/80 text-sky-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            {isListening && <SoundWaveVisualizer active={true} color="red" />}
            {isSpeaking && <SoundWaveVisualizer active={true} color="cyan" />}
            <span>{statusMessage || (isListening ? 'শুনছি... আপনার কথা বলুন...' : 'কথা বলছি...')}</span>
          </div>
        </div>
      )}

      {/* Footer Controls */}
      <footer className="flex-shrink-0 bg-slate-900/95 border-t border-slate-800/90 px-3 sm:px-4 py-3 backdrop-blur-md z-20">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Stop generating button */}
          {isLoading && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={stop}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                <span>রেসপন্স থামান (Stop Generating)</span>
              </button>
            </div>
          )}

          {/* Input & Voice Controls Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-3">
            {/* Input Field */}
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  speechLang === 'bn-BD'
                    ? 'এখানে লিখুন বা মাইক চেপে বলুন...'
                    : 'Type a message or press mic to speak...'
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all pr-10"
                disabled={isLoading}
              />
              {input && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Microphone Button */}
            <button
              type="button"
              id="mic-btn"
              onClick={toggleVoice}
              disabled={isLoading}
              title={
                !speechSupported
                  ? 'আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই'
                  : isListening
                  ? 'রেকর্ডিং থামান'
                  : 'ভয়েস চালু করুন'
              }
              className={`relative px-3.5 sm:px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white mic-pulse glow-mic-active'
                  : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-bold shadow-md shadow-sky-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isListening ? (
                <>
                  <Square className="w-4 h-4 fill-current text-white animate-pulse" />
                  <span className="hidden sm:inline font-bold">🛑 থামুন</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-slate-950" />
                  <span className="hidden sm:inline font-bold">🎤 কথা বলুন</span>
                </>
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              title="মেসেজ পাঠান"
              className="px-3.5 sm:px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">পাঠান</span>
            </button>
          </form>

          {/* Sub-bar Hints */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {speechLang === 'bn-BD'
                  ? 'মাইক চেপে সরাসরি বাংলায় কথা বলুন'
                  : 'Speak directly into microphone in English'}
              </span>
            </div>
            <div className="hidden sm:block">
              Enter = পাঠান • Auto-speak = {autoSpeak ? 'অন' : 'অফ'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})
