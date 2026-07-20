import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

export type ApprovedChangeEvent = {
  sourceId: string;
  url: string;
  fieldGuess: string;
  oldValue: string;
  newValue: string;
  detectedAt: string;
};

type ChangeEvent = {
  source_id: string;
  url: string;
  field_guess: string;
  old_value: string;
  new_value: string;
  old_hash: string;
  new_hash: string;
  detected_at: string;
};

type ReviewDecision = {
  source_id: string;
  url: string;
  old_hash: string;
  new_hash: string;
  action: string;
  decided_at: string;
};

function isStringRecord(value: unknown, fields: string[]): value is Record<string, string> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return fields.every((field) => typeof record[field] === "string");
}

function readJsonl<T>(filePath: string, validate: (value: unknown) => value is T): T[] {
  let contents: string;
  try {
    contents = readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error(`[monitor-updates] Failed to read ${path.basename(filePath)}: ${String(error)}`);
    return [];
  }

  const lines = contents.split(/\r?\n/).filter((line) => line.trim() !== "");
  const records: T[] = [];
  for (const line of lines) {
    try {
      const parsed: unknown = JSON.parse(line);
      if (validate(parsed)) records.push(parsed);
    } catch {
      // A partially written or malformed JSONL line must not take down the site.
    }
  }
  if (lines.length > 0 && records.length === 0) {
    console.error(`[monitor-updates] Could not parse ${path.basename(filePath)}; treating it as empty`);
  }
  return records;
}

function isChangeEvent(value: unknown): value is ChangeEvent {
  return isStringRecord(value, [
    "source_id", "url", "field_guess", "old_value", "new_value",
    "old_hash", "new_hash", "detected_at",
  ]);
}

function isReviewDecision(value: unknown): value is ReviewDecision {
  return isStringRecord(value, [
    "source_id", "url", "old_hash", "new_hash", "action", "decided_at",
  ]);
}

function changeKey(value: Pick<ChangeEvent, "source_id" | "url" | "old_hash" | "new_hash">): string {
  return JSON.stringify([value.source_id, value.url, value.old_hash, value.new_hash]);
}

export function getApprovedChangeEvents(): ApprovedChangeEvent[] {
  const dbPath = process.env.MAGAZINE_HUB_DB_PATH;
  if (!dbPath) return [];
  const monitorDir = path.join(path.dirname(dbPath), "monitor");
  const events = readJsonl(path.join(monitorDir, "change_events.jsonl"), isChangeEvent);
  const decisions = readJsonl(path.join(monitorDir, "review_decisions.jsonl"), isReviewDecision);

  const latestDecisions = new Map<string, ReviewDecision>();
  for (const decision of decisions) {
    const key = changeKey(decision);
    const current = latestDecisions.get(key);
    if (!current || decision.decided_at >= current.decided_at) latestDecisions.set(key, decision);
  }

  return events
    .filter((event) => latestDecisions.get(changeKey(event))?.action === "approve")
    .sort((a, b) => b.detected_at.localeCompare(a.detected_at))
    .map((event) => ({
      sourceId: event.source_id,
      url: event.url,
      fieldGuess: event.field_guess,
      oldValue: event.old_value,
      newValue: event.new_value,
      detectedAt: event.detected_at,
    }));
}
