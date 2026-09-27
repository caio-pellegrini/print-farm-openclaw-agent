import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const builtDirectory = path.join(rootDirectory, "dist");
const publicDirectory = path.join(rootDirectory, "public");
const submissionDirectory = path.resolve(process.env.LANDING_DATA_DIR || path.join(rootDirectory, "data"));
for (const servedDirectory of [builtDirectory, publicDirectory]) {
  if (submissionDirectory === servedDirectory || submissionDirectory.startsWith(`${servedDirectory}${path.sep}`)) {
    throw new Error("LANDING_DATA_DIR must be outside public and dist.");
  }
}
const submissionFile = path.join(submissionDirectory, "tester-submissions.jsonl");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const maxRequestBytes = 16 * 1024;
const requestTimes = new Map();
const mimeTypes = new Map([[".html", "text/html; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"], [".svg", "image/svg+xml"]]);

function loadDiscordWebhookUrl() {
  let value = process.env.DISCORD_WEBHOOK_URL;
  if (!value) {
    try {
      const line = readFileSync(path.join(rootDirectory, ".env"), "utf8")
        .split(/\r?\n/)
        .find((entry) => entry.startsWith("DISCORD_WEBHOOK_URL="));
      value = line?.slice("DISCORD_WEBHOOK_URL=".length).trim().replace(/^['"]|['"]$/g, "");
    } catch {
      value = "";
    }
  }
  if (!value) return "";

  let webhook;
  try {
    webhook = new URL(value);
  } catch {
    throw new Error("DISCORD_WEBHOOK_URL must be a valid Discord webhook URL.");
  }
  if (webhook.protocol !== "https:" || !["discord.com", "discordapp.com"].includes(webhook.hostname) || !/^\/api\/webhooks\/\d+\/[^/]+$/.test(webhook.pathname) || webhook.search || webhook.hash) {
    throw new Error("DISCORD_WEBHOOK_URL must point to a Discord webhook endpoint over HTTPS.");
  }
  webhook.hostname = "discord.com";
  return webhook.href;
}

const discordWebhookUrl = loadDiscordWebhookUrl();

async function forwardToDiscord(record) {
  if (!discordWebhookUrl) return false;
  const fields = [
    ["Name", record.name || "Not provided"],
    ["Email / preferred contact", record.contact],
    ["Number of printers", String(record.printerCount)],
    ["Printer brands / models", record.printerModels || "Not provided"],
    ["Accepts custom STL jobs", record.customJobs || "Not provided"],
    ["Biggest pain with custom orders", record.biggestPain || "Not provided"]
  ].map(([name, value]) => ({ name, value: String(value).slice(0, 1024), inline: false }));
  const response = await fetch(discordWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      allowed_mentions: { parse: [] },
      embeds: [{ title: "New print farm early tester", fields, timestamp: record.receivedAt }]
    }),
    signal: AbortSignal.timeout(8000)
  });
  return response.ok;
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function validText(value, maximum, required = true) {
  if (!required && (value === undefined || value === null)) return true;
  return typeof value === "string" && value.length <= maximum && (!required || value.trim().length > 0);
}

function validateSubmission(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Invalid form data.";
  if (!validText(value.contact, 160)) return "Please add a contact method.";
  if (!Number.isInteger(value.printerCount) || value.printerCount < 1 || value.printerCount > 100) return "Please select a valid printer count.";
  if (!validText(value.name, 100, false) || !validText(value.printerModels, 300, false) || !validText(value.biggestPain, 1200, false)) return "Please check the optional fields.";
  if (value.customJobs && !["yes", "no"].includes(value.customJobs)) return "Please check your custom jobs answer.";
  if (!validText(value.company, 200, false)) return "Invalid form data.";
  return null;
}

async function receiveSubmission(request, response) {
  const now = Date.now();
  const ip = request.socket.remoteAddress || "unknown";
  const recent = (requestTimes.get(ip) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 8) return sendJson(response, 429, { error: "Too many submissions. Try again later." });
  recent.push(now);
  requestTimes.set(ip, recent);
  if ((request.headers["content-type"] || "").split(";")[0].trim() !== "application/json") return sendJson(response, 415, { error: "Expected JSON." });

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxRequestBytes) return sendJson(response, 413, { error: "Submission is too large." });
    chunks.push(chunk);
  }
  let submission;
  try {
    submission = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return sendJson(response, 400, { error: "Invalid JSON." });
  }
  const validationError = validateSubmission(submission);
  if (validationError) return sendJson(response, 400, { error: validationError });
  if (submission.company) return sendJson(response, 200, { ok: true });

  const record = {
    receivedAt: new Date().toISOString(),
    name: (submission.name || "").trim(),
    contact: submission.contact.trim(),
    printerCount: submission.printerCount,
    printerModels: (submission.printerModels || "").trim(),
    customJobs: submission.customJobs || "",
    biggestPain: (submission.biggestPain || "").trim()
  };
  try {
    await mkdir(submissionDirectory, { recursive: true, mode: 0o700 });
    await appendFile(submissionFile, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
  } catch {
    return sendJson(response, 500, { error: "Submission storage is unavailable." });
  }
  let discordForwarded = false;
  try {
    discordForwarded = await forwardToDiscord(record);
  } catch {
    console.error("Discord forwarding failed; the response remains saved in JSONL.");
  }
  if (!discordForwarded) console.error("Discord forwarding is not configured or was not confirmed; the response remains saved in JSONL.");
  return sendJson(response, 201, { ok: true, discordForwarded });
}

async function serveFile(request, response, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  const baseDirectory = await stat(builtDirectory).then(() => builtDirectory).catch(() => publicDirectory);
  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const resolvedPath = path.resolve(baseDirectory, `.${requestedPath}`);
  if (!resolvedPath.startsWith(`${baseDirectory}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  let contents;
  try {
    contents = await readFile(resolvedPath);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }
  const contentType = mimeTypes.get(path.extname(resolvedPath)) || "application/octet-stream";
  response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
  if (request.method === "HEAD") response.end();
  else response.end(contents);
}

const server = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/api/testers" && request.method === "POST") return receiveSubmission(request, response);
  if (url.pathname.startsWith("/api/")) return sendJson(response, 404, { error: "Not found." });
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  return serveFile(request, response, url.pathname);
});

server.listen(port, host, () => {
  console.log(`Landing page listening on http://${host}:${port}`);
  if (discordWebhookUrl) console.log("Discord form forwarding is configured.");
});
