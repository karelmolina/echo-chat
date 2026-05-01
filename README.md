# Echo Chat

A simple AI chat app I built for a technical assessment. It streams AI responses that survive page refreshes and work across multiple tabs.

**Live demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

## What it does

- Type a message on the home page, get redirected to a conversation
- The AI response streams in live
- Refresh the page mid-stream and it picks up where it left off
- Open the same conversation in two tabs and they stay in sync
- Sidebar shows all your conversations, highlights the active one

## Stack

- Next.js 15 (App Router)
- TypeScript
- PostgreSQL (Neon) for persistence
- Redis for stream state
- OpenAI GPT-4o
- Tailwind + shadcn/ui

## How the streaming works

I went through a few iterations here.

**First attempt:** I tried just using the Vercel AI SDK's built-in streaming. Worked great locally, but as soon as I refreshed the page the stream died. Not acceptable.

**Second attempt:** I stored the full streamed response in a Redis string and had the client fetch it on reconnect. This worked for refreshes, but if two tabs were open they wouldn't see the same live stream — one would be ahead of the other.

**Final approach:** I use Redis pub/sub. When the AI streams a chunk, I publish it to a Redis channel keyed by conversation ID. The SSE endpoint subscribes to that channel and forwards chunks to the client. If a client disconnects and reconnects, I replay the chunks from a Redis list that acts as a buffer. When the stream finishes, I save the full message to Postgres and clear the Redis buffer.

It's not the most elegant solution (I think you could do this with Server-Sent Events + some kind of cursor tracking more cleanly), but it works and it meets all the requirements.

## Setup

```bash
npm install

# copy env vars
cp .env.example .env.local
# fill in DATABASE_URL, REDIS_URL, OPENAI_API_KEY

npx prisma migrate dev
npm run dev
```

## Environment variables

```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
OPENAI_API_KEY="sk-..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Things I'd improve with more time

- The sidebar updates work but there's a small delay. I think I'm not invalidating the cache correctly.
- If the server crashes mid-stream, the stream is lost. Realistically you'd want some kind of background worker that picks up incomplete streams.
- No auth, so anyone can see anyone's conversations if they guess the ID. Not a concern for this test but obviously not production-ready.
- I didn't write tests. I know, I know.
- The auto-generated titles are just the first 50 chars of the first message. Would be nicer to ask the AI to summarize.

## What took the most time

Getting the SSE reconnection logic right. Specifically: when a client reconnects, how do you know which chunks they've already seen? I ended up numbering chunks and having the client send the last chunk number it received. There are edge cases here (what if chunks arrive out of order?) but in practice OpenAI streams sequentially so it works.

## License

MIT
