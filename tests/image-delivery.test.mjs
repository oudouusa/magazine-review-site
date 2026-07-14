import assert from "node:assert/strict";
import test from "node:test";

import {
  getImageDeliveryConfig,
  normalizeImageSegments,
  normalizeLocalImagePath,
  proxyGatewayImage,
  publicImageUrl,
} from "../src/lib/image-delivery.ts";

const VERSION = "a".repeat(64);

function gatewayEnv(overrides = {}) {
  return {
    MAGAZINE_IMAGE_DELIVERY_MODE: "gateway",
    MAGAZINE_IMAGE_GATEWAY_BASE_URL: "http://image-gateway:3000/api/images/",
    MAGAZINE_IMAGE_GATEWAY_VERSION: VERSION,
    MAGAZINE_IMAGE_SERVING_INDEX_PATH: "/app/image-serving/active-index.json",
    ...overrides,
  };
}

test("delivery config defaults to local and rejects incomplete gateway config", () => {
  assert.deepEqual(getImageDeliveryConfig({}), { mode: "local" });
  assert.throws(
    () => getImageDeliveryConfig({ MAGAZINE_IMAGE_DELIVERY_MODE: "remote" }),
    /must be local or gateway/,
  );
  assert.throws(
    () => getImageDeliveryConfig(gatewayEnv({ MAGAZINE_IMAGE_GATEWAY_BASE_URL: "" })),
    /MAGAZINE_IMAGE_GATEWAY_BASE_URL is required/,
  );
  assert.throws(
    () => getImageDeliveryConfig(gatewayEnv({ MAGAZINE_IMAGE_SERVING_INDEX_PATH: "" })),
    /MAGAZINE_IMAGE_SERVING_INDEX_PATH is required/,
  );
  assert.throws(
    () => getImageDeliveryConfig(gatewayEnv({ MAGAZINE_IMAGE_GATEWAY_VERSION: "release-1" })),
    /64-hex serving-index SHA-256/,
  );
  assert.throws(
    () => getImageDeliveryConfig(gatewayEnv({ MAGAZINE_IMAGE_GATEWAY_BASE_URL: "file:///tmp" })),
    /must use http or https/,
  );
});

test("normalizes and version-stamps local image URLs", () => {
  const imagePath = normalizeLocalImagePath("/magazine-images/雑誌名/表 紙.jpg");
  assert.ok(imagePath);
  assert.equal(imagePath.relativePath, "雑誌名/表 紙.jpg");
  assert.equal(imagePath.apiPath, "/api/images/%E9%9B%91%E8%AA%8C%E5%90%8D/%E8%A1%A8%20%E7%B4%99.jpg");
  assert.equal(publicImageUrl(imagePath, getImageDeliveryConfig({})), imagePath.apiPath);
  assert.equal(
    publicImageUrl(imagePath, getImageDeliveryConfig(gatewayEnv())),
    `${imagePath.apiPath}?v=${VERSION}`,
  );
});

test("route normalization preserves a stray literal percent and encodes it as %25", () => {
  const imagePath = normalizeImageSegments(["idolz", "100%SKE48", "cover.jpg"]);
  assert.ok(imagePath);
  assert.equal(imagePath.relativePath, "idolz/100%SKE48/cover.jpg");
  assert.equal(imagePath.encodedPath, "idolz/100%25SKE48/cover.jpg");
  assert.equal(
    publicImageUrl(imagePath, getImageDeliveryConfig(gatewayEnv())),
    `/api/images/idolz/100%25SKE48/cover.jpg?v=${VERSION}`,
  );
});

test("convergently rejects traversal, separators, controls, and suppressed paths", () => {
  assert.equal(normalizeImageSegments(["..", "cover.jpg"]), null);
  assert.equal(normalizeImageSegments(["bad%FF", "cover.jpg"]), null);
  assert.equal(normalizeImageSegments(["line%0Abreak", "cover.jpg"]), null);
  for (const unsafe of ["/etc", "週刊大衆"]) {
    let encoded = unsafe;
    for (let depth = 0; depth <= 5; depth += 1) {
      assert.equal(normalizeImageSegments([encoded, "cover.jpg"]), null, `${unsafe} depth=${depth}`);
      encoded = encodeURIComponent(encoded);
    }
  }
  assert.equal(normalizeLocalImagePath("https://example.com/cover.jpg"), null);
});

test("gateway proxy forwards only If-None-Match and allowlists response headers", async () => {
  const imagePath = normalizeImageSegments(["xidol-covers", "cover.jpg"]);
  assert.ok(imagePath);
  const config = getImageDeliveryConfig(gatewayEnv());
  assert.equal(config.mode, "gateway");

  let receivedUrl;
  let receivedInit;
  const response = await proxyGatewayImage(
    new Request(`https://review.example/api/images/xidol-covers/cover.jpg?v=${VERSION}`, {
      headers: {
        Authorization: "Bearer secret",
        "If-None-Match": '"old"',
      },
    }),
    imagePath,
    config,
    {
      fetchImpl: async (url, init) => {
        receivedUrl = url;
        receivedInit = init;
        return new Response("image", {
          headers: {
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=60",
            "CDN-Cache-Control": "public, max-age=60",
            "Content-Type": "image/jpeg",
            ETag: '"new"',
            "Set-Cookie": "leak=1",
            "X-Image-Provenance": "snapshot:sha256",
            "X-Image-Source": "sealed-overlay",
          },
          status: 200,
        });
      },
      timeoutMs: 25,
    },
  );

  assert.equal(
    receivedUrl.toString(),
    `http://image-gateway:3000/api/images/xidol-covers/cover.jpg?v=${VERSION}`,
  );
  assert.equal(receivedInit.headers.get("if-none-match"), '"old"');
  assert.equal(receivedInit.headers.has("authorization"), false);
  assert.equal(receivedInit.cache, "no-store");
  assert.equal(receivedInit.redirect, "manual");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("etag"), '"new"');
  assert.equal(response.headers.has("accept-ranges"), false);
  assert.equal(response.headers.get("cdn-cache-control"), "public, max-age=60");
  assert.equal(response.headers.get("x-image-provenance"), "snapshot:sha256");
  assert.equal(response.headers.get("x-image-source"), "sealed-overlay");
  assert.equal(response.headers.has("set-cookie"), false);
  assert.equal(await response.text(), "image");
});

test("gateway proxy requires exactly one matching request version", async () => {
  const imagePath = normalizeImageSegments(["cover.jpg"]);
  assert.ok(imagePath);
  const config = getImageDeliveryConfig(gatewayEnv());
  assert.equal(config.mode, "gateway");
  let fetchCalls = 0;

  for (const url of [
    "https://review.example/api/images/cover.jpg",
    `https://review.example/api/images/cover.jpg?v=${"b".repeat(64)}`,
    `https://review.example/api/images/cover.jpg?v=${VERSION}&v=${VERSION}`,
  ]) {
    const response = await proxyGatewayImage(new Request(url), imagePath, config, {
      fetchImpl: async () => {
        fetchCalls += 1;
        return new Response("unexpected");
      },
    });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("cdn-cache-control"), "no-store");
  }
  assert.equal(fetchCalls, 0);
});

test("gateway proxy preserves safe statuses including bodyless 304", async () => {
  const imagePath = normalizeImageSegments(["cover.jpg"]);
  assert.ok(imagePath);
  const config = getImageDeliveryConfig(gatewayEnv());
  assert.equal(config.mode, "gateway");

  for (const status of [304, 400, 403, 404, 413, 502, 503]) {
    const response = await proxyGatewayImage(
      new Request(`https://review.example/api/images/cover.jpg?v=${VERSION}`),
      imagePath,
      config,
      {
        fetchImpl: async () =>
          new Response(status === 304 ? null : "upstream", {
            headers: { ETag: '"sealed"' },
            status,
          }),
      },
    );
    assert.equal(response.status, status);
    if (status === 304) assert.equal(await response.text(), "");
  }
});

test("gateway proxy converts unsafe and network failures to no-store errors", async () => {
  const imagePath = normalizeImageSegments(["cover.jpg"]);
  assert.ok(imagePath);
  const config = getImageDeliveryConfig(gatewayEnv());
  assert.equal(config.mode, "gateway");

  const unsafe = await proxyGatewayImage(
    new Request(`https://review.example/api/images/cover.jpg?v=${VERSION}`),
    imagePath,
    config,
    { fetchImpl: async () => new Response("oops", { status: 500 }) },
  );
  assert.equal(unsafe.status, 502);
  assert.equal(unsafe.headers.get("cache-control"), "no-store");

  const unavailable = await proxyGatewayImage(
    new Request(`https://review.example/api/images/cover.jpg?v=${VERSION}`),
    imagePath,
    config,
    { fetchImpl: async () => { throw new Error("offline"); } },
  );
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("cache-control"), "no-store");
});
