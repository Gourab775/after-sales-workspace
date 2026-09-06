/** POST /seed-demo — one-click demo import (Neon-backed on Next.js runtimes). */
export const runtime = "nodejs";
export const maxDuration = 60;

import { onRequest } from "@/agents/seed-demo/index";
import { buildContext, readBody } from "@/lib/request-context";

export async function POST(req: Request) {
  const body = await readBody(req);
  const context = await buildContext(req, body);
  return onRequest(context);
}
