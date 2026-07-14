import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { normalizeLocalImagePath } from "../src/lib/image-delivery.ts";
import {
  getImageServingMembership,
  resetImageServingMembershipCacheForTests,
} from "../src/lib/image-serving-membership.ts";

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

function seal(document) {
  const { serving_index_sha256: _ignored, ...sealedFields } = document;
  return createHash("sha256").update(canonicalJson(sealedFields)).digest("hex");
}

function servingIndex() {
  const document = {
    schema: "magazine-hub.image-serving-index.v1",
    composite_id: "production-20260715-a1",
    created_at: "2026-07-15T08:00:00Z",
    canonical_prefix: "images",
    overlay_prefix: "image-overlays/production-20260715-a1",
    paths: [
      "covers/a.jpg",
      "idolz/100%SKE48/cover.jpg",
      "performers/a.jpg",
      "source-posts/z.png",
      "xidol-covers/real.jpeg",
    ],
    overlay_entries: [
      {
        path: "performers/a.jpg",
        size: 3,
        md5: "900150983cd24fb0d6963f7d28e17f72",
        sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
        provenance: "snapshot_conflict",
      },
      {
        path: "source-posts/z.png",
        size: 4,
        md5: "025e4da7edac35ede583f5e8d51aa7ec",
        sha256: "88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589",
        provenance: "snapshot_missing",
      },
    ],
    totals: {
      files: 5,
      bytes: 100,
      canonical_files: 3,
      overlay_files: 2,
      snapshot_missing: 1,
      snapshot_conflict: 1,
    },
    serving_index_sha256: "",
  };
  document.serving_index_sha256 = seal(document);
  return document;
}

function writeIndex(document) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "review-image-membership-"));
  const file = path.join(dir, "active-index.json");
  fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
  return { dir, file, sha: document.serving_index_sha256 };
}

test.afterEach(() => {
  resetImageServingMembershipCacheForTests();
});

test("loads a sealed exact full-path membership and caches by file identity", (t) => {
  const written = writeIndex(servingIndex());
  t.after(() => fs.rmSync(written.dir, { force: true, recursive: true }));

  const membership = getImageServingMembership(written.file, written.sha);
  assert.equal(membership.servingIndexSha256, written.sha);
  assert.equal(membership.paths.size, 5);
  assert.equal(membership.paths.has("idolz/100%SKE48/cover.jpg"), true);
  const fallbackPath = normalizeLocalImagePath("/api/images/idolz/100%SKE48/cover.jpg");
  assert.ok(fallbackPath);
  assert.equal(membership.paths.has(fallbackPath.relativePath), true);
  assert.equal(membership.paths.has("covers/a.jpg"), true);
  assert.equal(membership.paths.has("covers/missing.jpg"), false);
  assert.equal(getImageServingMembership(written.file, written.sha), membership);
});

test("rejects tampering and an env pin that differs from the canonical seal", (t) => {
  const tampered = servingIndex();
  tampered.totals.bytes = 101;
  const written = writeIndex(tampered);
  t.after(() => fs.rmSync(written.dir, { force: true, recursive: true }));

  assert.throws(
    () => getImageServingMembership(written.file, written.sha),
    /seal does not match canonical content/,
  );
  resetImageServingMembershipCacheForTests();

  const valid = servingIndex();
  fs.writeFileSync(written.file, `${JSON.stringify(valid, null, 2)}\n`);
  assert.throws(
    () => getImageServingMembership(written.file, "f".repeat(64)),
    /seal does not match configured SHA-256/,
  );
});

test("rejects incomplete membership, overlay paths outside it, and non-canonical paths", (t) => {
  const cases = [
    (document) => {
      document.paths.pop();
    },
    (document) => {
      document.overlay_entries[0].path = "outside/member.jpg";
    },
    (document) => {
      document.paths[0] = "../covers/a.jpg";
    },
    (document) => {
      document.paths.reverse();
    },
  ];

  const dirs = [];
  t.after(() => dirs.forEach((dir) => fs.rmSync(dir, { force: true, recursive: true })));
  for (const mutate of cases) {
    const document = servingIndex();
    mutate(document);
    document.serving_index_sha256 = seal(document);
    const written = writeIndex(document);
    dirs.push(written.dir);
    assert.throws(() => getImageServingMembership(written.file, written.sha));
    resetImageServingMembershipCacheForTests();
  }
});

test("rejects missing, relative, and symlinked index files", (t) => {
  assert.throws(
    () => getImageServingMembership("relative-index.json", "a".repeat(64)),
    /path must be absolute/,
  );
  resetImageServingMembershipCacheForTests();
  assert.throws(
    () => getImageServingMembership("/definitely/missing/active-index.json", "a".repeat(64)),
  );
  resetImageServingMembershipCacheForTests();

  const written = writeIndex(servingIndex());
  const link = path.join(written.dir, "active-index-link.json");
  fs.symlinkSync(written.file, link);
  t.after(() => fs.rmSync(written.dir, { force: true, recursive: true }));
  assert.throws(
    () => getImageServingMembership(link, written.sha),
    /regular non-symlink file/,
  );
});
