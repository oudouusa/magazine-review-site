export type ImageDeliveryMode = "local" | "gateway";

export type ImageDeliveryConfig =
  | { mode: "local" }
  | {
      mode: "gateway";
      gatewayBaseUrl: URL;
      servingIndexPath: string;
      version: string;
    };

export type NormalizedImagePath = {
  apiPath: string;
  decodedSegments: string[];
  encodedPath: string;
  relativePath: string;
};

const SUPPRESSED_IMAGE_SEGMENTS = new Set(["週刊大衆"]);
const SERVING_INDEX_SHA256 = /^[a-f0-9]{64}$/i;
const SAFE_GATEWAY_STATUSES = new Set([200, 304, 400, 403, 404, 413, 502, 503]);
const GATEWAY_RESPONSE_HEADERS = new Set([
  "cache-control",
  "cdn-cache-control",
  "content-length",
  "content-type",
  "etag",
  "last-modified",
  "x-image-composite-id",
  "x-image-provenance",
  "x-image-serving-index",
  "x-image-source",
]);

export const IMAGE_GATEWAY_TIMEOUT_MS = 15_000;

function configurationError(message: string): Error {
  return new Error(`Invalid magazine image delivery configuration: ${message}`);
}

export function getImageDeliveryConfig(
  env: NodeJS.ProcessEnv = process.env,
): ImageDeliveryConfig {
  const rawMode = env.MAGAZINE_IMAGE_DELIVERY_MODE?.trim();
  const mode = rawMode || "local";
  if (mode === "local") return { mode: "local" };
  if (mode !== "gateway") {
    throw configurationError("MAGAZINE_IMAGE_DELIVERY_MODE must be local or gateway");
  }

  const rawBaseUrl = env.MAGAZINE_IMAGE_GATEWAY_BASE_URL?.trim();
  if (!rawBaseUrl) {
    throw configurationError("MAGAZINE_IMAGE_GATEWAY_BASE_URL is required in gateway mode");
  }

  let gatewayBaseUrl: URL;
  try {
    gatewayBaseUrl = new URL(rawBaseUrl);
  } catch {
    throw configurationError("MAGAZINE_IMAGE_GATEWAY_BASE_URL must be an absolute URL");
  }
  if (!new Set(["http:", "https:"]).has(gatewayBaseUrl.protocol)) {
    throw configurationError("MAGAZINE_IMAGE_GATEWAY_BASE_URL must use http or https");
  }
  if (
    gatewayBaseUrl.username ||
    gatewayBaseUrl.password ||
    gatewayBaseUrl.search ||
    gatewayBaseUrl.hash
  ) {
    throw configurationError(
      "MAGAZINE_IMAGE_GATEWAY_BASE_URL must not contain credentials, a query, or a fragment",
    );
  }

  const version = env.MAGAZINE_IMAGE_GATEWAY_VERSION?.trim() ?? "";
  if (!SERVING_INDEX_SHA256.test(version)) {
    throw configurationError(
      "MAGAZINE_IMAGE_GATEWAY_VERSION must be the 64-hex serving-index SHA-256",
    );
  }

  const servingIndexPath = env.MAGAZINE_IMAGE_SERVING_INDEX_PATH?.trim() ?? "";
  if (!servingIndexPath) {
    throw configurationError("MAGAZINE_IMAGE_SERVING_INDEX_PATH is required in gateway mode");
  }

  return {
    gatewayBaseUrl,
    mode: "gateway",
    servingIndexPath,
    version: version.toLowerCase(),
  };
}

function decodeImageSegment(segment: string): string | null {
  let decoded = segment;
  for (let count = 0; count < 4; count += 1) {
    let next: string;
    try {
      next = decodeURIComponent(decoded.replace(/%(?![0-9a-f]{2})/gi, "%25"));
    } catch {
      return null;
    }
    if (next === decoded) break;
    decoded = next;
  }
  if (/%[0-9a-f]{2}/i.test(decoded)) return null;
  if (!decoded || decoded === "." || decoded === "..") return null;
  if (decoded.includes("/") || decoded.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(decoded)) return null;
  if (SUPPRESSED_IMAGE_SEGMENTS.has(decoded)) return null;
  return decoded;
}

export function normalizeImageSegments(segments: string[]): NormalizedImagePath | null {
  if (segments.length === 0) return null;
  const decodedSegments = segments.map(decodeImageSegment);
  if (decodedSegments.some((segment) => segment === null)) return null;

  const decoded = decodedSegments as string[];
  const encodedPath = decoded.map(encodeURIComponent).join("/");
  return {
    apiPath: `/api/images/${encodedPath}`,
    decodedSegments: decoded,
    encodedPath,
    relativePath: decoded.join("/"),
  };
}

export function normalizeLocalImagePath(localPath: string): NormalizedImagePath | null {
  let relativePath: string;
  if (localPath.startsWith("/magazine-images/")) {
    relativePath = localPath.slice("/magazine-images/".length);
  } else if (localPath.startsWith("/api/images/")) {
    relativePath = localPath.slice("/api/images/".length);
  } else {
    return null;
  }
  return normalizeImageSegments(relativePath.split("/"));
}

export function publicImageUrl(
  imagePath: NormalizedImagePath,
  config: ImageDeliveryConfig,
): string {
  if (config.mode === "local") return imagePath.apiPath;
  return `${imagePath.apiPath}?v=${encodeURIComponent(config.version)}`;
}

function gatewayImageUrl(config: Extract<ImageDeliveryConfig, { mode: "gateway" }>, path: string): URL {
  const url = new URL(config.gatewayBaseUrl.toString());
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/${path}`;
  url.searchParams.set("v", config.version);
  return url;
}

function noStoreError(status: 404 | 502 | 503, message: string): Response {
  return new Response(message, {
    headers: {
      "Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
    status,
  });
}

export function requestMatchesGatewayVersion(
  request: Request,
  config: Extract<ImageDeliveryConfig, { mode: "gateway" }>,
): boolean {
  const requestVersions = new URL(request.url).searchParams.getAll("v");
  return requestVersions.length === 1 && requestVersions[0] === config.version;
}

export async function proxyGatewayImage(
  request: Request,
  imagePath: NormalizedImagePath,
  config: Extract<ImageDeliveryConfig, { mode: "gateway" }>,
  options: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<Response> {
  if (!requestMatchesGatewayVersion(request, config)) {
    return noStoreError(404, "Not found");
  }

  const requestHeaders = new Headers();
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) requestHeaders.set("If-None-Match", ifNoneMatch);

  let upstream: Response;
  try {
    upstream = await (options.fetchImpl ?? fetch)(gatewayImageUrl(config, imagePath.encodedPath), {
      cache: "no-store",
      headers: requestHeaders,
      redirect: "manual",
      signal: AbortSignal.timeout(options.timeoutMs ?? IMAGE_GATEWAY_TIMEOUT_MS),
    });
  } catch {
    return noStoreError(503, "Image gateway unavailable");
  }

  if (!SAFE_GATEWAY_STATUSES.has(upstream.status) || upstream.status === 500) {
    await upstream.body?.cancel().catch(() => undefined);
    return noStoreError(502, "Invalid image gateway response");
  }

  const responseHeaders = new Headers();
  for (const [name, value] of upstream.headers) {
    if (GATEWAY_RESPONSE_HEADERS.has(name.toLowerCase())) responseHeaders.set(name, value);
  }

  return new Response(upstream.status === 304 ? null : upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
  });
}
