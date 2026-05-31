import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_ROOT = process.env.MAGAZINE_IMAGES_PATH ?? "/app/public/magazine-images";
const SUPPRESSED_IMAGE_SEGMENTS = new Set(["週刊大衆"]);

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function decodeSegment(segment: string): string | null {
  try {
    const decoded = decodeURIComponent(segment);
    if (!decoded || decoded === "." || decoded === "..") return null;
    if (decoded.includes("/") || decoded.includes("\\") || decoded.includes("\0")) return null;
    return decoded;
  } catch {
    return null;
  }
}

function isInsideRoot(root: string, filePath: string): boolean {
  return filePath === root || filePath.startsWith(`${root}${sep}`);
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { path = [] } = await params;
  const decodedPath = path.map(decodeSegment);
  if (decodedPath.length === 0 || decodedPath.some((part) => part === null)) {
    return new Response("Not found", { status: 404 });
  }
  if (decodedPath.some((part) => part && SUPPRESSED_IMAGE_SEGMENTS.has(part))) {
    return new Response("Not found", { status: 404 });
  }

  const root = resolve(IMAGE_ROOT);
  const filePath = resolve(root, ...(decodedPath as string[]));
  if (!isInsideRoot(root, filePath)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return new Response("Not found", { status: 404 });

    const body = await readFile(filePath);
    const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": String(fileStat.size),
        "Content-Type": contentType,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
