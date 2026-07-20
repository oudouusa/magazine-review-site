import { spawn } from "node:child_process";

const PORT = process.env.SMOKE_PORT ?? "3200";
const BASE = `http://127.0.0.1:${PORT}`;
const endpoints = [
  "/",
  "/calendar",
  "/calendar?kind=photobook",
  "/trending",
  "/updates",
  "/covers",
  "/covers?era=2010s&page=2",
  "/models",
  "/models/%E3%81%88%E3%81%AA%E3%81%93",
  "/magazines",
  "/ranking",
  "/brands",
  "/search?q=%E3%81%88%E3%81%AA%E3%81%93",
  "/api/smoke",
];

const child = spawn("npm", ["run", "start"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT },
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
const childExit = new Promise((resolve) => child.once("exit", resolve));
let out = "";
for (const s of [child.stdout, child.stderr]) {
  s.on("data", (c) => {
    out = (out + c.toString()).slice(-4000);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exited = () => child.exitCode !== null || child.signalCode !== null;

async function waitForServer() {
  for (let i = 0; i < 80; i++) {
    if (exited()) throw new Error(`next start exited early\n${out.trim()}`);
    try {
      const res = await fetch(`${BASE}/`, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      // not up yet
    }
    await sleep(500);
  }
  throw new Error("server did not start in 40s");
}

function assertMin(results, key, min) {
  const v = results?.[key];
  if (typeof v !== "number") throw new Error(`/api/smoke missing ${key}`);
  if (v < min) throw new Error(`/api/smoke ${key}=${v}, expected >= ${min}`);
}

async function stop() {
  if (exited()) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await Promise.race([childExit, sleep(2500)]);
  if (!exited()) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
    await Promise.race([childExit, sleep(1000)]);
  }
}

try {
  await waitForServer();
  let smoke = null;
  for (const ep of endpoints) {
    const res = await fetch(`${BASE}${ep}`);
    if (res.status !== 200) throw new Error(`${ep} returned ${res.status}`);
    if (ep === "/api/smoke") smoke = await res.json();
  }
  if (!smoke || smoke.ok !== true) throw new Error(`/api/smoke ok=false ${smoke?.error ?? ""}`.trim());
  assertMin(smoke.results, "getUpcomingReleases", 50);
  assertMin(smoke.results, "getTrendingModels", 10);
  assertMin(smoke.results, "getNewThisWeek", 5);
  assertMin(smoke.results, "getCoStars", 3);
  assertMin(smoke.results, "getRelatedModels", 3);
  assertMin(smoke.results, "getTodayBirthdays", 0);
  assertMin(smoke.results, "getCoverWall", 80);
  assertMin(smoke.results, "getOnThisDay", 1);
  if (smoke.results.sampleCardId) {
    const res = await fetch(`${BASE}/magazines/card-${smoke.results.sampleCardId}`);
    if (res.status !== 200) throw new Error(`/magazines/card-${smoke.results.sampleCardId} returned ${res.status}`);
  }
  console.log("PASS", JSON.stringify(smoke.results));
} catch (e) {
  console.log(`FAIL: ${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
} finally {
  await stop();
  process.exit(process.exitCode ?? 0);
}
