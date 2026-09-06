/**
 * GET /health — reports AI Gateway + Neon database configuration status.
 * Used by the frontend warning banner.
 */
export const runtime = "nodejs";

export async function GET() {
  const env = process.env;
  const hasAiGateway = Boolean(env.AI_GATEWAY_API_KEY || env.SERVICE_API_KEY) &&
    Boolean(env.AI_GATEWAY_BASE_URL || env.SERVICE_BASE_URL);
  const hasDatabase = Boolean(env.DATABASE_URL || env.NEON_DATABASE_URL || env.POSTGRES_URL);

  const missing: string[] = [];
  if (!env.AI_GATEWAY_API_KEY && !env.SERVICE_API_KEY) missing.push("AI_GATEWAY_API_KEY");
  if (!env.AI_GATEWAY_BASE_URL && !env.SERVICE_BASE_URL) missing.push("AI_GATEWAY_BASE_URL");
  if (!hasDatabase) missing.push("DATABASE_URL");

  // Only AI Gateway gates core chat; DB has an in-memory fallback.
  return Response.json({ ok: hasAiGateway, hasAiGateway, hasDatabase, missing });
}
