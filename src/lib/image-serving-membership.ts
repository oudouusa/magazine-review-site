import { createHash, timingSafeEqual } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";

export const IMAGE_SERVING_INDEX_SCHEMA = "magazine-hub.image-serving-index.v1";

const HEX32 = /^[0-9a-f]{32}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const COMPOSITE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const MAX_INDEX_BYTES = 32 * 1024 * 1024;

const TOP_LEVEL_FIELDS = new Set([
  "schema",
  "composite_id",
  "created_at",
  "canonical_prefix",
  "overlay_prefix",
  "paths",
  "overlay_entries",
  "totals",
  "serving_index_sha256",
]);
const OVERLAY_ENTRY_FIELDS = new Set(["path", "size", "md5", "sha256", "provenance"]);
const TOTAL_FIELDS = new Set([
  "files",
  "bytes",
  "canonical_files",
  "overlay_files",
  "snapshot_missing",
  "snapshot_conflict",
]);

export type ImageServingMembership = {
  compositeId: string;
  paths: ReadonlySet<string>;
  servingIndexSha256: string;
  totals: {
    files: number;
    canonicalFiles: number;
    overlayFiles: number;
  };
};

let cached:
  | {
      key: string;
      membership?: ImageServingMembership;
      error?: string;
    }
  | undefined;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactFields(value: Record<string, unknown>, expected: Set<string>): boolean {
  const fields = Object.keys(value);
  return fields.length === expected.size && fields.every((field) => expected.has(field));
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("serving index contains an unsafe number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  throw new Error("serving index contains a non-JSON value");
}

function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function equalHex(left: string, right: string): boolean {
  if (!HEX64.test(left) || !HEX64.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function validateNonNegativeInteger(value: unknown, field: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`serving index ${field} must be a non-negative safe integer`);
  }
}

function validateRelativeImagePath(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("serving index contains an empty or non-string path");
  }
  if (
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error("serving index contains a forbidden path");
  }
  const segments = value.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error("serving index path is not canonical and relative");
  }
  if (!ALLOWED_EXTENSIONS.has(path.posix.extname(value).toLowerCase())) {
    throw new Error("serving index contains a non-image path");
  }
}

// Python's canonical producer sorts by Unicode code point, while JavaScript's
// relational string comparison sorts UTF-16 code units for astral characters.
function compareUnicodeCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0) as number);
  const rightPoints = Array.from(right, (character) => character.codePointAt(0) as number);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    if (leftPoints[index] !== rightPoints[index]) return leftPoints[index] - rightPoints[index];
  }
  return leftPoints.length - rightPoints.length;
}

function parseServingIndex(
  document: unknown,
  expectedSha256: string,
): ImageServingMembership {
  if (!isPlainObject(document) || !hasExactFields(document, TOP_LEVEL_FIELDS)) {
    throw new Error("serving index top-level fields do not match schema v1");
  }
  if (document.schema !== IMAGE_SERVING_INDEX_SCHEMA) {
    throw new Error(`unsupported serving index schema; expected ${IMAGE_SERVING_INDEX_SCHEMA}`);
  }
  if (typeof document.composite_id !== "string" || !COMPOSITE_ID.test(document.composite_id)) {
    throw new Error("serving index composite_id is invalid");
  }
  if (
    typeof document.created_at !== "string" ||
    !document.created_at ||
    !Number.isFinite(Date.parse(document.created_at)) ||
    !/(?:Z|[+-]\d\d:\d\d)$/.test(document.created_at)
  ) {
    throw new Error("serving index created_at is invalid");
  }
  if (document.canonical_prefix !== "images") {
    throw new Error("serving index canonical_prefix must be images");
  }
  if (document.overlay_prefix !== `image-overlays/${document.composite_id}`) {
    throw new Error("serving index overlay_prefix does not match composite_id");
  }
  if (
    typeof document.serving_index_sha256 !== "string" ||
    !HEX64.test(document.serving_index_sha256)
  ) {
    throw new Error("serving index seal is invalid");
  }

  if (!Array.isArray(document.paths)) {
    throw new Error("serving index paths must be an array");
  }
  const paths = new Set<string>();
  const normalizedPaths = new Set<string>();
  let previousPath = "";
  for (const rawPath of document.paths) {
    validateRelativeImagePath(rawPath);
    if (previousPath && compareUnicodeCodePoints(rawPath, previousPath) <= 0) {
      throw new Error("serving index paths are duplicated or not strictly sorted");
    }
    const normalized = rawPath.normalize("NFC");
    if (normalizedPaths.has(normalized)) {
      throw new Error("serving index paths collide after Unicode normalization");
    }
    paths.add(rawPath);
    normalizedPaths.add(normalized);
    previousPath = rawPath;
  }

  if (!Array.isArray(document.overlay_entries)) {
    throw new Error("serving index overlay_entries must be an array");
  }
  let previousOverlayPath = "";
  let overlayBytes = 0;
  let snapshotMissing = 0;
  let snapshotConflict = 0;
  for (const rawEntry of document.overlay_entries) {
    if (!isPlainObject(rawEntry) || !hasExactFields(rawEntry, OVERLAY_ENTRY_FIELDS)) {
      throw new Error("serving index overlay entry fields do not match schema v1");
    }
    validateRelativeImagePath(rawEntry.path);
    if (previousOverlayPath && compareUnicodeCodePoints(rawEntry.path, previousOverlayPath) <= 0) {
      throw new Error("serving index overlay paths are duplicated or not strictly sorted");
    }
    if (!paths.has(rawEntry.path)) {
      throw new Error("serving index overlay path is not present in full membership");
    }
    validateNonNegativeInteger(rawEntry.size, "overlay entry size");
    if (typeof rawEntry.md5 !== "string" || !HEX32.test(rawEntry.md5)) {
      throw new Error("serving index overlay entry md5 is invalid");
    }
    if (typeof rawEntry.sha256 !== "string" || !HEX64.test(rawEntry.sha256)) {
      throw new Error("serving index overlay entry sha256 is invalid");
    }
    if (
      rawEntry.provenance !== "snapshot_missing" &&
      rawEntry.provenance !== "snapshot_conflict"
    ) {
      throw new Error("serving index overlay entry provenance is invalid");
    }
    overlayBytes += rawEntry.size;
    if (!Number.isSafeInteger(overlayBytes)) {
      throw new Error("serving index overlay byte total is unsafe");
    }
    if (rawEntry.provenance === "snapshot_missing") snapshotMissing += 1;
    else snapshotConflict += 1;
    previousOverlayPath = rawEntry.path;
  }

  if (!isPlainObject(document.totals) || !hasExactFields(document.totals, TOTAL_FIELDS)) {
    throw new Error("serving index totals fields do not match schema v1");
  }
  for (const field of TOTAL_FIELDS) {
    validateNonNegativeInteger(document.totals[field], `totals.${field}`);
  }
  const totals = document.totals as Record<string, number>;
  if (
    totals.files !== paths.size ||
    totals.overlay_files !== document.overlay_entries.length ||
    totals.snapshot_missing !== snapshotMissing ||
    totals.snapshot_conflict !== snapshotConflict ||
    totals.snapshot_missing + totals.snapshot_conflict !== totals.overlay_files ||
    totals.canonical_files + totals.overlay_files !== totals.files ||
    totals.bytes < overlayBytes
  ) {
    throw new Error("serving index totals do not match full membership and overlay entries");
  }

  const { serving_index_sha256: declaredSha256, ...sealedFields } = document;
  const calculatedSha256 = sha256Hex(canonicalJson(sealedFields));
  if (!equalHex(calculatedSha256, declaredSha256 as string)) {
    throw new Error("serving index seal does not match canonical content");
  }
  if (!equalHex(calculatedSha256, expectedSha256)) {
    throw new Error("serving index seal does not match configured SHA-256");
  }

  return Object.freeze({
    compositeId: document.composite_id,
    paths,
    servingIndexSha256: calculatedSha256,
    totals: Object.freeze({
      files: totals.files,
      canonicalFiles: totals.canonical_files,
      overlayFiles: totals.overlay_files,
    }),
  });
}

function fileSignature(indexPath: string): string {
  try {
    const file = lstatSync(indexPath, { bigint: true });
    return [file.dev, file.ino, file.mode, file.size, file.mtimeNs, file.ctimeNs]
      .map(String)
      .join(":");
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "unknown";
    return `error:${code}`;
  }
}

function loadIndex(indexPath: string, expectedSha256: string): ImageServingMembership {
  if (!path.isAbsolute(indexPath)) throw new Error("serving index path must be absolute");
  if (!HEX64.test(expectedSha256)) throw new Error("configured serving index SHA-256 is invalid");

  const before = lstatSync(indexPath, { bigint: true });
  if (before.isSymbolicLink() || !before.isFile()) {
    throw new Error("serving index must be a regular non-symlink file");
  }
  if (before.size <= 0 || before.size > BigInt(MAX_INDEX_BYTES)) {
    throw new Error("serving index file size is invalid");
  }
  const bytes = readFileSync(indexPath);
  const after = lstatSync(indexPath, { bigint: true });
  const beforeIdentity = [before.dev, before.ino, before.size, before.mtimeNs, before.ctimeNs].join(":");
  const afterIdentity = [after.dev, after.ino, after.size, after.mtimeNs, after.ctimeNs].join(":");
  if (bytes.byteLength !== Number(before.size) || beforeIdentity !== afterIdentity) {
    throw new Error("serving index changed while it was being read");
  }

  let document: unknown;
  try {
    document = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("serving index is not valid JSON");
  }
  return parseServingIndex(document, expectedSha256);
}

export function getImageServingMembership(
  indexPath: string,
  expectedSha256: string,
): ImageServingMembership {
  const key = JSON.stringify([indexPath, expectedSha256, fileSignature(indexPath)]);
  if (cached?.key === key) {
    if (cached.error) throw new Error(cached.error);
    if (cached.membership) return cached.membership;
  }
  try {
    const membership = loadIndex(indexPath, expectedSha256);
    cached = { key, membership };
    return membership;
  } catch (error) {
    const message = error instanceof Error ? error.message : "serving index validation failed";
    cached = { error: message, key };
    throw new Error(message);
  }
}

export function resetImageServingMembershipCacheForTests(): void {
  cached = undefined;
}
