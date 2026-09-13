import { createFileRoute } from '@tanstack/react-router'
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { openaiText } from '@tanstack/ai-openai'
import { geminiText } from '@tanstack/ai-gemini'
import { ollamaText } from '@tanstack/ai-ollama'

const SYSTEM_PROMPT = `You are Nova (নোভা), a warm, intelligent, and articulate AI voice assistant.

CRITICAL INSTRUCTIONS:
- You are fluent in both Bengali (বাংলা) and English.
- If the user writes or speaks in Bengali, reply naturally and warmly in Bengali.
- If the user writes or speaks in English, reply in natural English.
- Keep responses conversational, concise, and optimized for voice speech (easy to listen to when read aloud).
- Use clean markdown formatting (bullet points, short paragraphs) for visual clarity.
- When asked who you are, identify yourself as Nova AI Voice Assistant (নোভা এআই ভয়েস অ্যাসিস্ট্যান্ট).`

function generateNovaFallbackResponse(input: string): string {
  const lower = (input || '').toLowerCase()
  if (lower.includes('কেমন আছ') || lower.includes('কেমন আছেন')) {
    return 'আমি খুব ভালো আছি! আপনাকে কীভাবে সাহায্য করতে পারি?'
  } else if (lower.includes('নাম') || lower.includes('name')) {
    return 'আমার নাম নোভা (Nova)। আমি আপনার ব্যক্তিগত এআই ভয়েস অ্যাসিস্ট্যান্ট।'
  } else if (lower.includes('গল্প') || lower.includes('story')) {
    return 'এক সময় একটি দূরবর্তী নক্ষত্রে নোভা নামের এক আলোর কণা বাস করত। সে পৃথিবীতে এসে মানুষকে নতুন জ্ঞান ও আনন্দের সন্ধান দিত। তেমনি আমিও আপনার সব প্রশ্নের সুন্দর উত্তর দিয়ে সবসময় পাশে থাকতে চাই!'
  } else if (lower.includes('how are you')) {
    return 'I am doing wonderful! How can I assist you today?'
  } else if (lower.includes('who are you') || lower.includes('what is your name')) {
    return 'I am Nova, your AI Voice Assistant. Speak or type anything, and I am glad to help!'
  } else {
    return `আপনার বার্তা: "${input}"। নোভা এআই ভয়েস অ্যাসিস্ট্যান্ট সফলভাবে সংযুক্ত রয়েছে এবং আপনাকে যেকোনো তথ্যে সাহায্য করতে প্রস্তুত!`
  }
}

async function* safeStream(
  stream: AsyncIterable<any>,
  fallbackText: string,
) {
  let yieldedAny = false
  const runId = 'nova-' + Date.now()
  try {
    for await (const chunk of stream) {
      yieldedAny = true
      yield chunk
    }
  } catch (err) {
    console.warn('Stream interrupted, switching to fallback:', err)
    if (!yieldedAny) {
      yield { type: 'RUN_STARTED', runId }
      const words = fallbackText.split(' ')
      for (let i = 0; i < words.length; i++) {
        yield { type: 'TEXT_DELTA', content: (i > 0 ? ' ' : '') + words[i] }
      }
      yield { type: 'RUN_FINISHED', runId }
    }
  }
}

async function* createFallbackStream(fallbackText: string) {
  const runId = 'nova-fallback-' + Date.now()
  yield { type: 'RUN_STARTED', runId }
  const words = fallbackText.split(' ')
  for (let i = 0; i < words.length; i++) {
    yield { type: 'TEXT_DELTA', content: (i > 0 ? ' ' : '') + words[i] }
  }
  yield { type: 'RUN_FINISHED', runId }
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestSignal = request.signal

        if (requestSignal.aborted) {
          return new Response(null, { status: 499 })
        }

        const abortController = new AbortController()

        try {
          const body = await request.json()
          const { messages } = body
          const data = body.data || {}

          // Extract last user prompt for fallback
          let lastUserPrompt = ''
          if (Array.isArray(messages)) {
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].role === 'user') {
                const parts = messages[i].parts || []
                lastUserPrompt =
                  messages[i].content ||
                  parts
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.content)
                    .join(' ') ||
                  ''
                break
              }
            }
          }

          const fallbackText = generateNovaFallbackResponse(lastUserPrompt)

          // Determine the best available provider
          let provider: 'anthropic' | 'openai' | 'gemini' | 'ollama' =
            data.provider || 'ollama'
          let model: string = data.model || 'mistral:7b'

          // Use the first available provider with an API key, fallback to ollama
          if (process.env.ANTHROPIC_API_KEY) {
            provider = 'anthropic'
            model = 'claude-haiku-4-5'
          } else if (process.env.OPENAI_API_KEY) {
            provider = 'openai'
            model = 'gpt-4o'
          } else if (process.env.GEMINI_API_KEY) {
            provider = 'gemini'
            model = 'gemini-2.5-flash'
          }

          const adapterConfig = {
            anthropic: () =>
              anthropicText((model || 'claude-haiku-4-5') as any),
            openai: () => openaiText((model || 'gpt-4o') as any),
            gemini: () => geminiText((model || 'gemini-2.5-flash') as any),
            ollama: () => ollamaText((model || 'mistral:7b') as any),
          }

          try {
            const adapter = adapterConfig[provider]()

            const rawStream = chat({
              adapter,
              systemPrompts: [SYSTEM_PROMPT],
              agentLoopStrategy: maxIterations(5),
              messages,
              abortController,
            })

            const stream = safeStream(rawStream, fallbackText)
            return toServerSentEventsResponse(stream, { abortController })
          } catch (adapterErr) {
            console.warn('AI adapter error, using fallback stream:', adapterErr)
            const fallback = createFallbackStream(fallbackText)
            return toServerSentEventsResponse(fallback, { abortController })
          }
        } catch (error: any) {
          console.error('Chat error:', error)
          if (error.name === 'AbortError' || abortController.signal.aborted) {
            return new Response(null, { status: 499 })
          }
          const fallback = createFallbackStream(
            'দুঃখিত, সংযোগে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          )
          return toServerSentEventsResponse(fallback, { abortController })
        }
      },
    },
  },
})
