import { spawn } from "node:child_process";

const PORT = "3100";
const BASE = `http://127.0.0.1:${PORT}`;
const endpoints = [
  "/",
  "/models",
  "/models/%E3%81%88%E3%81%AA%E3%81%93",
  "/magazines",
  "/calendar",
  "/calendar?kind=photobook",
  "/trending",
  "/covers",
  "/covers?era=2010s&page=2",
  "/ranking",
  "/brands",
  "/search?q=%E3%81%88%E3%81%AA%E3%81%93",
  "/api/smoke",
];

const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "start"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT },
  stdio: ["ignore", "pipe", "pipe"],
  detached: process.platform !== "win32",
});
const childExit = new Promise((resolve) => child.once("exit", resolve));

let childOutput = "";
child.stdout.on("data", (chunk) => {
  childOutput += chunk.toString();
  childOutput = childOutput.slice(-4000);
});
child.stderr.on("data", (chunk) => {
  childOutput += chunk.toString();
  childOutput = childOutput.slice(-4000);
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function childExited() {
  return child.exitCode !== null || child.signalCode !== null;
}

async function waitForServer() {
  let lastError = "";
  for (let attempt = 0; attempt < 80; attempt++) {
    if (childExited()) {
      throw new Error(`next start exited early\n${childOutput.trim()}`);
    }
    try {
      const res = await fetch(`${BASE}/`, { redirect: "manual" });
      if (res.status < 500) return;
      lastError = `status ${res.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(500);
  }
  throw new Error(`server did not start: ${lastError}`);
}

function assertThreshold(results, key, min) {
  const value = results?.[key];
  if (typeof value !== "number") throw new Error(`/api/smoke missing numeric ${key}`);
  if (value < min) throw new Error(`/api/smoke ${key}=${value}, expected >= ${min}`);
}

async function stopChild() {
  if (childExited()) return;
  signalChild("SIGTERM");
  if (await waitForChildExit(2500)) return;
  signalChild("SIGKILL");
  await waitForChildExit(1000);
}

function signalChild(signal) {
  try {
    if (process.platform !== "win32" && child.pid) {
      process.kill(-child.pid, signal);
    } else {
      child.kill(signal);
    }
  } catch {
    // Process already exited.
  }
}

async function waitForChildExit(ms) {
  if (childExited()) return true;
  return Promise.race([
    childExit.then(() => true),
    sleep(ms).then(() => false),
  ]);
}

try {
  await waitForServer();

  let smokeJson = null;
  for (const endpoint of endpoints) {
    const res = await fetch(`${BASE}${endpoint}`);
    if (res.status !== 200) throw new Error(`${endpoint} returned ${res.status}`);
    if (endpoint === "/api/smoke") smokeJson = await res.json();
  }

  if (!smokeJson || smokeJson.ok !== true) {
    throw new Error(`/api/smoke ok=false ${smokeJson?.error ?? ""}`.trim());
  }

  assertThreshold(smokeJson.results, "getUpcomingReleases", 50);
  assertThreshold(smokeJson.results, "getTrendingModels", 10);
  assertThreshold(smokeJson.results, "getTodayBirthdays", 0);
  assertThreshold(smokeJson.results, "getCoverWall", 90);
  assertThreshold(smokeJson.results, "getOnThisDay", 1);

  console.log("PASS");
} catch (error) {
  console.log(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await stopChild();
  process.exit(process.exitCode ?? 0);
}
