# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

A general-purpose AI chat assistant. Users type a message and get a streamed, markdown-rendered reply from an LLM. Built with TanStack Start and deployed on Netlify.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| AI | TanStack AI with multi-provider support (Anthropic, OpenAI, Gemini, Ollama) |
| Language | TypeScript 5.9 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── public/                    # Static assets (favicon, logos)
├── src
│   ├── lib
│   │   └── ai-hook.ts         # useAIChat hook: wraps @tanstack/ai-react's useChat with SSE connection to /api/chat
│   ├── routes
│   │   ├── __root.tsx         # Root layout: HTML shell, page metadata, global styles
│   │   ├── api.chat.ts        # POST handler for /api/chat: picks an AI provider, streams the response as SSE
│   │   └── index.tsx          # Home route: chat UI (message list, input form, send/stop, Streamdown markdown rendering)
│   ├── router.tsx             # TanStack Router setup
│   └── styles.css             # Tailwind imports + chat/markdown styling
├── netlify.toml                # Netlify build command, publish directory, dev server settings
├── package.json
├── tsconfig.json               # @/* path alias for src/*
└── vite.config.ts
```

## Key Concepts

### File-Based Routing (TanStack Router)

Routes are defined by files in `src/routes/`:
- `__root.tsx` — root layout wrapping all pages
- `index.tsx` — route for `/`
- `api.chat.ts` — server API endpoint for `/api/chat`

### AI Integration (`src/routes/api.chat.ts`)

The chat endpoint picks the first available provider based on which API key is set in the environment, in this order:

1. Anthropic Claude (`ANTHROPIC_API_KEY`)
2. OpenAI GPT-4o (`OPENAI_API_KEY`)
3. Google Gemini (`GEMINI_API_KEY`)
4. Ollama, local, no key needed (default fallback)

Responses stream back to the client as Server-Sent Events via `toServerSentEventsResponse`.

### Chat UI (`src/routes/index.tsx`, `src/lib/ai-hook.ts`)

`useAIChat` (in `src/lib/ai-hook.ts`) manages message state and streaming via `@tanstack/ai-react`. `index.tsx` renders the message list (with `Streamdown` for markdown) and the input form, and can stop an in-flight response.

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite plugins: TanStack Start, Netlify, Tailwind |
| `tsconfig.json` | TypeScript config with `@/*` path alias for `src/*` |
| `netlify.toml` | Build command, output directory, dev server settings |
| `styles.css` | Tailwind imports + chat/markdown styling |

## Development Commands

```bash
pnpm dev      # Start dev server (vite dev --port 3000)
pnpm build    # Production build
```

## Conventions

### Naming
- Utilities/hooks: camelCase
- Routes: kebab-case files

### TypeScript
- Strict mode enabled
- Import paths use `@/` alias
- Zod for runtime validation

## Environment Variables

For AI functionality, set one or more:

```
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...
```

If none are set, the app falls back to a local Ollama instance (`mistral:7b`), which requires Ollama running locally.
