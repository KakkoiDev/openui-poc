# OpenUI × Claude chat

A minimal local prototype that streams Claude Haiku responses into interactive OpenUI components. Reuses the official [OpenUI self-hosted starter](https://github.com/thesysdev/openui/tree/main/templates/openui-self-hosted): its chat shell, theme switch, conversation controls, component library, generated schema, and LangGraph streaming adapters.

## Demo

A real response streaming into a nutrition table and interactive bar chart, using illustrative sample data. Recorded with the earlier DeepSeek version of this prototype.

[![Watch the OpenUI chat demo](docs/media/openui-demo.gif)](https://github.com/KakkoiDev/openui-poc/blob/main/docs/media/openui-demo.mp4)

[Watch the full MP4 video](https://github.com/KakkoiDev/openui-poc/blob/main/docs/media/openui-demo.mp4). The animated preview above plays directly in the README.

## Run

Requires Node.js 20.9+, npm, and the Claude Code CLI logged in on this machine (`claude` on `PATH`).

```sh
OPENUI_TELEMETRY_DISABLED=1 npm install
npm run dev
```

Open http://localhost:3000. No API key is needed: each turn runs through the logged-in Claude Code CLI with Haiku (`CLAUDE_CODE_MODEL`, default `haiku`). `ANTHROPIC_API_KEY` is removed from the CLI's environment so a key in the server environment cannot override the login. This is a local-test shim only; see [Need fix before production ready](#need-fix-before-production-ready).

## Try it

- “Compare five breakfast foods in a table and chart using sample nutrition data.”
- “Create a monthly budget dashboard with sample data.”
- “Help me choose a laptop. Ask for my budget and needs using a form.”
- Follow up with “Make that a bar chart” to revise a response.

## How it works

`src/app/page.tsx` reuses OpenUI's `AgentInterface`, default library, and LangGraph adapters. `src/agent.ts` generates instructions from the same component schema and runs a LangChain agent on `src/claude-code-model.ts`, a small chat model that streams through `ai-sdk-provider-claude-code` (the Claude Code CLI) with built-in tools, MCP servers, settings files, session persistence, and extended thinking turned off. `src/app/api/chat/route.ts` validates messages and passes the native SSE stream through to the browser.

No database, login, external tools, or deployment. Conversations last for the current page session. Generated forms are conversational interactions; they do not submit to external services. Example data is illustrative. Live generation has been verified with Claude Haiku; individual responses can vary.

## Checks

```sh
npm run generate
npm run typecheck
npm run build
```

`npm run generate` refreshes `src/generated/spec.json` from the installed library. The lockfile pins the installed dependencies. Dependency advisories are listed under [Need fix before production ready](#need-fix-before-production-ready).

## Haiku observations

Measured 2026-10-30 against the local dev server, Claude Haiku via Claude Code CLI 2.1.314. Three prompts per run: the laptop prompt (tabs with a table and a bar chart, plus a form), "Compare five breakfast foods in a table and chart", "Create a monthly budget dashboard". Validity is `createParser(spec.schema)` from `@openuidev/lang-core` on the full reply text.

| Setting | Replies | First byte | Full reply | Replies with validation errors |
| --- | --- | --- | --- | --- |
| Thinking off (shipped) | 9 | 1.1-2.6 s | 3.1-8.1 s | 1 of 9 |
| Thinking on (CLI default) | 6 | 17.8-66.8 s | 20.0-71.6 s | 0 of 6 |

- Haiku wrote OpenUI Lang directly, with no prose wrapper. No replies were cut off or left unresolved names.
- The one invalid reply put `TabItem` content in a nested array (`[[Table(...)]]`). The parser dropped both tab bodies, so the user would see empty tabs with no error shown. The same reply also left out the requested sample-data label.
- In the browser, the laptop prompt rendered a table, bar chart, tabs and form in 7.5 s with thinking off and 35.7 s with thinking on. Both renders opened on the last tab, not the first.
- Tool calls work through this shim. One live call to an app tool bridged with `createAiSdkMcpServer` (`mcp__app__render_ui`) ran `execute` with the exact input and returned its result in 13.3 s. The app does not use tools: OpenUI Lang travels in the reply text.

## Need fix before production ready

Known issues in this prototype. None block local use. All must be fixed before production use.

- **`@OpenUrl` opens model-given URLs with raw `window.open`.** `@openuidev/react-ui@0.18.1` `dist/index.mjs:325-331` (`runChatAction`) calls `window.open(url, "_blank")` with no scheme check and no `noopener`, bypassing the library's own `safeUrl` helper. In a browser probe, a `javascript:` URL opened this way ran script in the host origin. Not reproduced end to end through OpenUI.
- **Install-time telemetry.** `@openuidev/lang-core` runs a `postinstall` that sends an install event to PostHog (random install id, salted project hash, versions, CI/Docker flags). Opt out with `OPENUI_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` at install time.
- **`Query`/`Mutation` call tools from the client.** OpenUI Lang `Query`/`Mutation` statements run tool calls client-side through a `ToolProvider`, outside any server-side approval for destructive actions. This app passes no tools, so it is not exposed today. Any host that adds tools is.
- **Prompt cost.** The generated system prompt for the default 82-component library is about 6.7k tokens per request (estimate, lower bound), before caching.
- **Open npm audit advisories.** `npm audit` reports 8: 4 high (`zod` memory exhaustion on oversized constrained collections, through `@ag-ui/core` -> `@openuidev/react-headless` -> `@openuidev/react-ui`) and 4 low (`katex` prototype pollution, through `rehype-katex`/`remark-math`). No compatible automatic fix.
- **Claude Code CLI shim is local-test only.** `src/claude-code-model.ts` runs every turn through the logged-in Claude Code CLI on the developer's subscription, one subprocess per request. Production needs a real Anthropic API key or a gateway key and a direct provider such as `@langchain/anthropic`.
- **The shim's sandbox is configuration, not isolation.** The CLI subprocess is an agent on the server host. Only the `tools: []`, `mcpServers: {}`, `strictMcpConfig`, and `settingSources: []` options keep it from reaching the shell, files, or the developer's claude.ai connectors. In a probe without `strictMcpConfig`, the CLI tried to load the developer's claude.ai connectors.
- **Invalid output fails silently.** Components with invalid props are dropped by the parser with no message to the user (1 of 9 Haiku replies, see above). Production needs validation feedback or a retry.
- **Errors after the stream starts return HTTP 200.** The route only catches failures before streaming. When the CLI failed auth, the response was `200`: the error text (`Invalid API key`) was streamed as assistant content, followed by an SSE `error` event.
- **`.env.example` is stale.** It still lists `DEEPSEEK_API_KEY`/`DEEPSEEK_MODEL`, which nothing reads now. The automated worker could not edit it (its permissions block `.env*` files).

## Attribution

Adapted from thesysdev/openui (MIT), source commit `7df27bc8eeb6fd15ac318ca7745d225a8e16e9b9`. Upstream license is retained in `LICENSE`.
