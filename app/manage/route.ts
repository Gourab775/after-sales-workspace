/** POST /manage — knowledge-base management (Neon-backed on Next.js runtimes). */
export const runtime = "nodejs";

import { onRequest } from "@/agents/manage/index";
import { buildContext, readBody } from "@/lib/request-context";

export async function POST(req: Request) {
  const body = await readBody(req);
  const context = await buildContext(req, body);
  return onRequest(context);
}
