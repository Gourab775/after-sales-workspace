# After-Sales Service Workspace

Professional after-sales customer service workspace with automated intent routing, order operations, and knowledge management.

**Live Demo:** https://after-sales-assistant.vercel.app

**Category:** Customer Service / Support Operations
**Stack:** Next.js 16 Â· React 19 Â· TypeScript Â· Tailwind CSS Â· State Workflow Engine
**Language:** TypeScript

## Overview

After-Sales Service Workspace is a full-stack support operations platform for handling customer inquiries at scale. It provides automated intent recognition, contextual knowledge routing, and structured workflows for order lookup, refunds, and exchanges. Designed with a bilingual interface and persistent session state, it delivers consistent service experiences across follow-up interactions.

## Features

- **Automated Intent Recognition** â€” Classifies incoming messages into FAQ search, order lookup, refund, exchange, or general service conversation and routes to the matching handler.
- **On-Demand Knowledge Routing** â€” Matches queries against knowledge summaries and loads full entries only when needed, without requiring a vector database.
- **Order Operations** â€” Structured workflows for order status lookup, refund requests, and exchange requests with validated field collection.
- **Knowledge Management Panel** â€” Dedicated management endpoints for creating, updating, and organizing FAQ entries and product documents.
- **Persistent Session State** â€” Conversation state is persisted across requests so multi-turn workflows resume reliably for the same conversation identifier.

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
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ chat/index.ts         # POST /chat â€” main service with intent routing
â”‚   â”œâ”€â”€ manage/index.ts       # POST /manage â€” knowledge base management
â”‚   â”œâ”€â”€ upload/index.ts       # POST /upload â€” document ingestion
â”‚   â”œâ”€â”€ stop/index.ts         # POST /stop â€” abort active run
â”‚   â”œâ”€â”€ seed-demo/index.ts    # POST /seed-demo â€” initialize demo data
â”‚   â”œâ”€â”€ _graph/
â”‚   â”‚   â”œâ”€â”€ builder.ts        # State machine builder
â”‚   â”‚   â”œâ”€â”€ state.ts          # State schema
â”‚   â”‚   â”œâ”€â”€ nodes.ts          # Intent handler nodes
â”‚   â”‚   â””â”€â”€ edges.ts          # Conditional routing
â”‚   â”œâ”€â”€ _data/                # Demo knowledge base and seed data
â”‚   â”œâ”€â”€ _i18n.ts              # Internationalization (English / Chinese)
â”‚   â””â”€â”€ _shared.ts            # Service initialization, SSE helpers, logger
â”œâ”€â”€ cloud-functions/
â”‚   â””â”€â”€ health/               # GET /health â€” liveness probe
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ page.tsx              # Main workspace UI
â”‚   â”œâ”€â”€ layout.tsx            # Root layout
â”‚   â”œâ”€â”€ components/           # Reusable UI components
â”‚   â””â”€â”€ globals.css           # Global styles
â”œâ”€â”€ lib/                      # Shared utilities
â”œâ”€â”€ edgeone.json              # Deployment configuration
â”œâ”€â”€ next.config.mjs           # Next.js configuration
â”œâ”€â”€ tailwind.config.ts        # Tailwind configuration
â”œâ”€â”€ tsconfig.json             # TypeScript configuration
â””â”€â”€ package.json
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
| `SERVICE_BASE_URL` | Yes | Gateway base URL, e.g. `https://gateway.edgeone.link/v1` for Makers Models. |
| `SERVICE_MODEL` | No | Model identifier. Defaults to `@makers/deepseek-v4-flash`. |

> Alias: `SERVICE_*` is the canonical naming in this workspace. `SERVICE_API_KEY`, `SERVICE_BASE_URL`, and `SERVICE_MODEL` are aliases for `AI_GATEWAY_API_KEY`, `AI_GATEWAY_BASE_URL`, and `AI_GATEWAY_MODEL` for backward compatibility. Either naming works; prefer `SERVICE_*` for new deployments.

### How to obtain SERVICE_API_KEY

1. Open the Makers Console
2. Sign in and enable Makers
3. Go to Makers â†’ Models â†’ API Key and create a key
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
