# After-Sales Service Workspace

Professional after-sales customer service workspace with automated intent routing, order operations, and knowledge management.

**Live Demo:** https://gourab775.github.io/after-sales-assistant

**Category:** Customer Service / Support Operations
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · State Workflow Engine
**Language:** TypeScript

## Overview

After-Sales Service Workspace is a full-stack support operations platform for handling customer inquiries at scale. It provides automated intent recognition, contextual knowledge routing, and structured workflows for order lookup, refunds, and exchanges. Designed with a bilingual interface and persistent session state, it delivers consistent service experiences across follow-up interactions.

## Features

- **Automated Intent Recognition** — Classifies incoming messages into FAQ search, order lookup, refund, exchange, or general service conversation and routes to the matching handler.
- **On-Demand Knowledge Routing** — Matches queries against knowledge summaries and loads full entries only when needed, without requiring a vector database.
- **Order Operations** — Structured workflows for order status lookup, refund requests, and exchange requests with validated field collection.
- **Knowledge Management Panel** — Dedicated management endpoints for creating, updating, and organizing FAQ entries and product documents.
- **Persistent Session State** — Conversation state is persisted across requests so multi-turn workflows resume reliably for the same conversation identifier.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript, Tailwind CSS, tailwind-merge, clsx |
| Workflow Engine | State Workflow (session-based routing, persisted state) |
| Integrations | Platform Services via Open-Compatible gateway |
| Document Handling | jszip, mammoth, marked, unpdf, xlsx, zod |
| Styling | PostCSS, Autoprefixer, Tailwind Typography |

## Project Structure

```
after-sales-assistant/
├── services/
│   ├── chat/index.ts         # POST /chat — main service with intent routing
│   ├── manage/index.ts       # POST /manage — knowledge base management
│   ├── upload/index.ts       # POST /upload — document ingestion
│   ├── stop/index.ts         # POST /stop — abort active run
│   ├── seed-demo/index.ts    # POST /seed-demo — initialize demo data
│   ├── _graph/
│   │   ├── builder.ts        # State machine builder
│   │   ├── state.ts          # State schema
│   │   ├── nodes.ts          # Intent handler nodes
│   │   └── edges.ts          # Conditional routing
│   ├── _data/                # Demo knowledge base and seed data
│   ├── _i18n.ts              # Internationalization (English / Chinese)
│   └── _shared.ts            # Service initialization, SSE helpers, logger
├── cloud-functions/
│   └── health/               # GET /health — liveness probe
├── app/
│   ├── page.tsx              # Main workspace UI
│   ├── layout.tsx            # Root layout
│   ├── components/           # Reusable UI components
│   └── globals.css           # Global styles
├── lib/                      # Shared utilities
├── edgeone.json              # Deployment configuration
├── next.config.mjs           # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

> Note: Source directory is `services/` in documentation. Runtime keeps `agents/` as an alias for backward compatibility where applicable.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your service credentials (see Environment Variables)
npm run dev
```

Open http://localhost:3000 for the workspace UI.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERVICE_API_KEY` | Yes | Platform service API key (Open-Compatible provider key). |
| `SERVICE_BASE_URL` | Yes | Gateway base URL, e.g. `https://ai-gateway.edgeone.link/v1` for Makers Models. |
| `SERVICE_MODEL` | No | Model identifier. Defaults to `@makers/deepseek-v4-flash`. |

> Alias: `SERVICE_*` is the canonical naming in this workspace. `SERVICE_API_KEY`, `SERVICE_BASE_URL`, and `SERVICE_MODEL` are aliases for `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`, and `AI_GATEWAY_MODEL` for backward compatibility. Either naming works; prefer `SERVICE_*` for new deployments.

### How to obtain SERVICE_API_KEY

1. Open the Makers Console
2. Sign in and enable Makers
3. Go to Makers → Models → API Key and create a key
4. Copy it into `SERVICE_API_KEY` in your `.env`

### Build

```bash
npm run build
npm start
```

## Deployment

This project uses `edgeone.json` for EdgeOne Makers deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Options:**

- **Vercel:** Import the repository, set `SERVICE_API_KEY` and `SERVICE_BASE_URL` in Environment Variables, deploy.
- **Netlify:** Set build command `npm run build` and publish directory `.next`, add the same environment variables.
- **GitHub Pages (static export):** If using static export, configure `next.config.mjs` for export and publish `out/` via GitHub Actions. For server features (chat, manage, upload), use Vercel/EdgeOne/Netlify Functions.

## Customization

- **Knowledge Base:** Use `/manage` and `/upload` endpoints or edit files under `services/_data/` to add FAQ entries and product documents.
- **Workflow Logic:** Adjust intent categories and routing in `services/_graph/nodes.ts` and `services/_graph/edges.ts`.
- **UI / Theme:** Modify `app/page.tsx`, `app/components/`, `app/globals.css`, and `tailwind.config.ts`.
- **Internationalization:** Update `services/_i18n.ts` to add locales or adjust service responses.

## License

MIT
