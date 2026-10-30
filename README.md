# OpenUI × DeepSeek chat

A minimal local prototype that streams DeepSeek responses into interactive OpenUI components. Reuses the official [OpenUI self-hosted starter](https://github.com/thesysdev/openui/tree/main/templates/openui-self-hosted): its chat shell, theme switch, conversation controls, component library, generated schema, and LangGraph streaming adapters.

## Demo

A real DeepSeek response streaming into a nutrition table and interactive bar chart, using illustrative sample data.

[![Watch the OpenUI chat demo](docs/media/openui-demo.gif)](https://github.com/KakkoiDev/openui-poc/blob/main/docs/media/openui-demo.mp4)

[Watch the full MP4 video](https://github.com/KakkoiDev/openui-poc/blob/main/docs/media/openui-demo.mp4). The animated preview above plays directly in the README.

## Run

Requires Node.js 20.9+ and npm.

```sh
npm install
cp .env.example .env.local
```

Add your key to `.env.local`:

```dotenv
DEEPSEEK_API_KEY=your-key-here
DEEPSEEK_MODEL=deepseek-flash
```

Then run:

```sh
npm run dev
```

Open http://localhost:3000. Restart the server after changing environment variables. The key stays on the server; do not put it in a `NEXT_PUBLIC_` variable.

## Try it

- “Compare five breakfast foods in a table and chart using sample nutrition data.”
- “Create a monthly budget dashboard with sample data.”
- “Help me choose a laptop. Ask for my budget and needs using a form.”
- Follow up with “Make that a bar chart” to revise a response.

## How it works

`src/app/page.tsx` reuses OpenUI's `AgentInterface`, default library, and LangGraph adapters. `src/agent.ts` generates instructions from the same component schema and connects LangChain's OpenAI-compatible client directly to DeepSeek. `src/app/api/chat/route.ts` validates messages, checks configuration, and passes the native SSE stream through to the browser.

No database, login, external tools, or deployment. Conversations last for the current page session. Generated forms are conversational interactions; they do not submit to external services. Example data is illustrative. Live generation has been verified with DeepSeek; individual responses can vary.

## Checks

```sh
npm run generate
npm run typecheck
npm run build
```

`npm run generate` refreshes `src/generated/spec.json` from the installed library. The lockfile pins the installed dependencies. The upstream dependencies currently report npm audit advisories in nested Zod and KaTeX packages, with no compatible automatic fix; review before publishing beyond a local prototype.

## Attribution

Adapted from thesysdev/openui (MIT), source commit `7df27bc8eeb6fd15ac318ca7745d225a8e16e9b9`. Upstream license is retained in `LICENSE`.
