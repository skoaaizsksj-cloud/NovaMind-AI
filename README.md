# AI Chat

A general-purpose AI chat assistant. Type a message and get a streamed, markdown-formatted reply from an LLM.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, TanStack Router)
- Vite 7
- Tailwind CSS 4
- [TanStack AI](https://tanstack.com/ai) with multi-provider support (Anthropic, OpenAI, Gemini, or a local Ollama fallback)
- Streamdown for rendering streamed markdown responses
- Deployed on Netlify

## How it works

The chat UI (`src/routes/index.tsx`) sends messages to a server route at `/api/chat` (`src/routes/api.chat.ts`), which picks the first AI provider with an API key configured in the environment and streams the model's response back to the browser as Server-Sent Events.

## Running locally

Install dependencies:

```bash
pnpm install
```

Set at least one AI provider API key in your environment (or rely on a local Ollama instance):

```bash
export ANTHROPIC_API_KEY=...
# or OPENAI_API_KEY / GEMINI_API_KEY
```

Start the dev server:

```bash
pnpm dev
```

The app runs at `http://localhost:3000`.

## Building

```bash
pnpm build
```
