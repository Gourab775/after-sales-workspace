/** POST /stop — abort an active run (no-op acknowledgement on Next.js runtimes). */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const conversationId =
    req.headers.get("makers-conversation-id") ||
    body?.conversation_id ||
    body?.conversationId ||
    "";
  return Response.json({ status: "no_active_run", conversationId, aborted: false });
}
