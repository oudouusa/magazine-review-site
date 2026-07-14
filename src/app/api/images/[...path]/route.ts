import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import {
  getImageDeliveryConfig,
  normalizeImageSegments,
  proxyGatewayImage,
  requestMatchesGatewayVersion,
} from "@/lib/image-delivery";
import { getImageServingMembership } from "@/lib/image-serving-membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_ROOT = process.env.MAGAZINE_IMAGES_PATH ?? "/app/public/magazine-images";

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

function isInsideRoot(root: string, filePath: string): boolean {
  return filePath === root || filePath.startsWith(`${root}${sep}`);
}

export async function GET(request: Request, { params }: RouteContext): Promise<Response> {
  const { path = [] } = await params;
  const imagePath = normalizeImageSegments(path);
  if (!imagePath) {
    return new Response("Not found", { status: 404 });
  }

  let deliveryConfig;
  try {
    deliveryConfig = getImageDeliveryConfig();
  } catch {
    return new Response("Image delivery unavailable", {
      headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" },
      status: 503,
    });
  }
  if (deliveryConfig.mode === "gateway") {
    if (!requestMatchesGatewayVersion(request, deliveryConfig)) {
      return new Response("Not found", {
        headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" },
        status: 404,
      });
    }
    let membership;
    try {
      membership = getImageServingMembership(
        deliveryConfig.servingIndexPath,
        deliveryConfig.version,
      );
    } catch {
      return new Response("Image delivery unavailable", {
        headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" },
        status: 503,
      });
    }
    if (!membership.paths.has(imagePath.relativePath)) {
      return new Response("Not found", {
        headers: { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store" },
        status: 404,
      });
    }
    return proxyGatewayImage(request, imagePath, deliveryConfig);
  }

  const root = resolve(IMAGE_ROOT);
  const filePath = resolve(root, ...imagePath.decodedSegments);
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
