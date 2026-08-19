import { env } from "cloudflare:workers";

type RuntimeEnv = { PROFILE_IMAGES: R2Bucket };
const runtime = env as unknown as RuntimeEnv;

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!/^[a-zA-Z0-9.-]+$/.test(key)) return new Response("Nicht gefunden", { status: 404 });
  const object = await runtime.PROFILE_IMAGES.get(key);
  if (!object) return new Response("Nicht gefunden", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=86400");
  return new Response(object.body, { headers });
}
