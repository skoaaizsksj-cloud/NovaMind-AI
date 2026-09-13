import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'
import type { InferChatMessages } from '@tanstack/ai-react'

export const INITIAL_NOVA_MESSAGE = {
  id: 'nova-intro-1',
  role: 'assistant' as const,
  parts: [
    {
      type: 'text' as const,
      content: 'হ্যালো! আমি নোভা। আপনি মুখে কথা বলুন, আমি শুনে উত্তর দেব। যেকোনো প্রশ্ন জিজ্ঞাসা করতে পারেন!',
    },
  ],
}

// Default chat options for simple usage
const defaultChatOptions = createChatClientOptions({
  connection: fetchServerSentEvents('/api/chat'),
})

export type ChatMessages = InferChatMessages<typeof defaultChatOptions>

export const useAIChat = () => {
  const chatOptions = createChatClientOptions({
    connection: fetchServerSentEvents('/api/chat'),
    initialMessages: [INITIAL_NOVA_MESSAGE],
  })

  return useChat(chatOptions)
}
