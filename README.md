# Echo Chat

A simple AI chat app with durable streaming that survives page refreshes and works across multiple tabs.

**Live demo:** [Vercel App](https://echo-chat-git-master-karelmolinas-projects.vercel.app)

## Stack

- Next.js 15 (App Router)
- TypeScript
- PostgreSQL (Neon) for persistence
- Redis (Upstash) for stream state
- Groq AI (OpenAI-compatible adapter)
- Tailwind + shadcn/ui

## How the streaming works

When a user sends a message, the assistant response is streamed chunk by chunk. Each chunk is published to a Redis channel keyed by conversation ID and buffered in a Redis list. The frontend connects via Server-Sent Events (SSE) to receive live chunks. If a client disconnects and reconnects, it replays missed chunks from the Redis buffer. When the stream completes, the full message is saved to PostgreSQL and the buffer is cleared.

## Setup

```bash
npm install

# Copy env vars and fill them in
cp .env.example .env.local

npx prisma migrate dev
npm run dev
```

## Environment variables

```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
GROQ_API_KEY="gsk_..."
AI_PROVIDER="groq"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## License

MIT
