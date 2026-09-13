# ✨ Nova AI Voice Assistant (নোভা এআই ভয়েস অ্যাসিস্ট্যান্ট)

An intelligent, bilingual voice and text AI assistant built with TanStack Start, React 19, and Tailwind CSS, deployed on Netlify. Speak or type in Bengali or English, and Nova listens, processes your request with streaming LLMs, and speaks responses aloud with real-time audio visualization.

## Features

- 🎙️ **Speech Recognition (STT)**: Direct voice input via browser Web Speech API with support for Bengali (`bn-BD`) and English (`en-US`), speech-to-text transcription, and auto-send.
- 🔊 **Text-to-Speech (TTS)**: Natural voice synthesis using `speechSynthesis` with intelligent markdown-to-speech cleaning and native Bengali and English voice selection.
- 💬 **Streaming AI Chat**: Server-Sent Events (SSE) streaming with multi-provider fallback (Gemini, Claude, GPT-4o, Ollama) and offline resilience.
- 🌐 **Bilingual Support**: Fluent conversation in both Bengali (বাংলা) and English with instant language toggling.
- 🎨 **Modern Dark Aesthetic**: Slate & sky-blue cosmic design, glowing status rings, soundwave visualizers, responsive mobile-friendly controls, and Streamdown markdown formatting.
- ⚡ **Interactive Controls**: Auto-speak toggle, audio replay on any message, stop generation, reset chat, and instant starter prompt suggestions.

## Tech Stack

- **Framework**: TanStack Start (React 19, TanStack Router)
- **Styling**: Tailwind CSS 4
- **AI Streaming**: TanStack AI (`@tanstack/ai`) with multi-provider adapter support
- **Speech**: Web Speech API (`SpeechRecognition` & `SpeechSynthesisUtterance`)
- **Icons**: Lucide React
- **Markdown**: Streamdown
- **Deployment**: Netlify

## Running Locally

Install dependencies:

```bash
pnpm install
```

Run test suite:

```bash
pnpm test
```

Set at least one AI provider API key in your environment (Netlify AI Gateway injects keys automatically on Netlify):

```bash
export GEMINI_API_KEY=...
# or ANTHROPIC_API_KEY / OPENAI_API_KEY
```

Start the dev server:

```bash
pnpm dev
```
