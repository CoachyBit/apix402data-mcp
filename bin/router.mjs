#!/usr/bin/env node
/**
 * apix402data Local Smart Router Proxy (OpenClaw / Cursor / Continue / LangChain drop-in)
 *
 * Zero external dependencies (Node >= 18). Starts an OpenAI-compatible + x402 Auto-Discovery
 * proxy on http://127.0.0.1:8403 (configurable via PORT / APIX402_ROUTER_PORT):
 *   - POST /v1/chat/completions   -> sub-millisecond local complexity scorer + smart failover
 *                                    routing to apix402data.com (OpenRouter frontier + dual-GPU
 *                                    local + <10ms live Solana/Polymarket grounding)
 *   - GET  /v1/models             -> lists auto, eco, fast, code, reasoning, local, frontier models
 *   - GET/POST /discover          -> queries live verified x402 failover index (/api/discover)
 *   - POST /call                  -> auto-discovers best provider for a capability & calls with failover
 *
 * Payment auth (automatically rolls over from 1 free try -> paid HTTP 402):
 *   - X402_SESSION_TOKEN="x402s_..."     (30-day prepaid session from https://apix402data.com/pay)
 *   - X402_PAYMENT_SIGNATURE="<b64>"     (per-call Solana PayAI or Base CDP x402 payment header)
 *
 * Usage:
 *   npx apix402data-mcp-router           (or: node bin/router.mjs)
 *   OPENAI_BASE_URL=http://127.0.0.1:8403/v1 OPENAI_API_KEY=x402 ...
 */
import http from "node:http";

const PORT = Number(process.env.APIX402_ROUTER_PORT || process.env.PORT || 8403);
const HOST = process.env.APIX402_ROUTER_HOST || "127.0.0.1";
const BASE_URL = (process.env.APIX402_BASE_URL || "https://apix402data.com").replace(/\/+$/, "");

const COMPLEX_RE = /\b(architect|refactor|prove|algorithm|optimize|security audit|vulnerability|theorem|multi-step|solidity|rust|typescript|python|debug)\b/i;
const CODE_RE = /(```|def\s+\w+|function\s+\w+|class\s+\w+|0x[0-9a-fA-F]{40})/;

function scoreLocalPrompt(messages = []) {
  const full = messages.map((m) => String(m?.content || "")).join("\n");
  const lastUser = [...messages].reverse().find((m) => m?.role === "user")?.content || "";
  let score = 0;
  if (full.length > 4000) score += 35;
  else if (full.length > 1200) score += 18;
  if (messages.length >= 6) score += 15;
  if (CODE_RE.test(full)) score += 25;
  if (COMPLEX_RE.test(String(lastUser))) score += 25;
  const tier = score >= 55 ? "reasoning" : score >= 30 && CODE_RE.test(full) ? "code" : score >= 20 ? "eco" : "local";
  return { score: Math.min(100, score), tier };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("payload_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", reject);
  });
}

function buildAuthHeaders(req) {
  const headers = { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "apix402-router/5.5" };
  const auth = req.headers["authorization"] || (process.env.X402_SESSION_TOKEN ? `Bearer ${process.env.X402_SESSION_TOKEN}` : "");
  if (auth && !String(auth).endsWith(" x402") && !String(auth).endsWith(" sk-local")) {
    headers["Authorization"] = String(auth);
  }
  const paySig = req.headers["payment-signature"] || req.headers["x-payment"] || process.env.X402_PAYMENT_SIGNATURE || "";
  if (paySig) headers["PAYMENT-SIGNATURE"] = String(paySig);
  return headers;
}

async function fetchWithFailover(urls, payload, headers, timeoutMs = 25000) {
  let lastRes = null;
  for (const url of urls) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload), signal: ac.signal });
      clearTimeout(timer);
      const text = await res.text();
      // Return immediately on 2xx or 402 (payment required — caller must sign & retry) or 4xx client error
      if (res.status < 500) {
        return { status: res.status, text, headers: res.headers, url };
      }
      lastRes = { status: res.status, text, headers: res.headers, url };
    } catch (err) {
      clearTimeout(timer);
      lastRes = { status: 502, text: JSON.stringify({ error: String(err?.message || err) }), headers: new Headers(), url };
    }
  }
  return lastRes || { status: 502, text: JSON.stringify({ error: "all_upstreams_failed" }), headers: new Headers(), url: "" };
}

function sendJson(res, status, obj, extraHeaders = {}) {
  const body = typeof obj === "string" ? obj : JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", ...extraHeaders });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const pathname = urlObj.pathname;

  if (req.method === "GET" && pathname === "/health") {
    return sendJson(res, 200, { ok: true, router: "apix402data-smart-router", upstream: BASE_URL });
  }

  if (req.method === "GET" && pathname === "/v1/models") {
    const models = ["auto", "eco", "fast", "code", "reasoning", "local", "qwen3.5:4b", "openai/gpt-4o-mini", "google/gemini-2.5-flash", "deepseek/deepseek-chat", "anthropic/claude-3.5-haiku"];
    return sendJson(res, 200, {
      object: "list",
      data: models.map((id) => ({ id, object: "model", owned_by: "apix402data-x402" })),
    });
  }

  if (pathname === "/v1/chat/completions" && req.method === "POST") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
    const localScore = scoreLocalPrompt(body.messages || []);
    const headers = buildAuthHeaders(req);
    const hasAuth = Boolean(headers["Authorization"] || headers["PAYMENT-SIGNATURE"]);
    const primaryUrl = hasAuth ? `${BASE_URL}/v1/chat/completions` : `${BASE_URL}/api/free/router/route`;
    const backupUrl = `${BASE_URL}/v1/chat/completions`;
    const upstream = await fetchWithFailover(
      primaryUrl === backupUrl ? [primaryUrl] : [primaryUrl, backupUrl],
      { ...body, model: body.model || "auto" },
      headers
    );
    const passHdrs = {};
    for (const h of ["payment-required", "payment-response", "www-authenticate", "x-session-remaining-usd"]) {
      const v = upstream.headers.get(h);
      if (v) passHdrs[h] = v;
    }
    passHdrs["X-Local-Router-Tier"] = localScore.tier;
    passHdrs["X-Local-Router-Score"] = String(localScore.score);
    return sendJson(res, upstream.status, upstream.text, passHdrs);
  }

  if (pathname === "/discover" && (req.method === "GET" || req.method === "POST")) {
    const body = req.method === "POST" ? await readJsonBody(req).catch(() => ({})) : Object.fromEntries(urlObj.searchParams.entries());
    const headers = buildAuthHeaders(req);
    const hasAuth = Boolean(headers["Authorization"] || headers["PAYMENT-SIGNATURE"]);
    const target = hasAuth ? `${BASE_URL}/api/discover` : `${BASE_URL}/api/free/discover`;
    const upstream = await fetchWithFailover([target], body, headers, 10000);
    const passHdrs = {};
    const pr = upstream.headers.get("payment-required");
    if (pr) passHdrs["payment-required"] = pr;
    return sendJson(res, upstream.status, upstream.text, passHdrs);
  }

  if (pathname === "/call" && req.method === "POST") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
    const q = String(body.capability || body.q || "").trim();
    if (!q) return sendJson(res, 400, { error: "capability (or q) is required" });
    const headers = buildAuthHeaders(req);
    const hasAuth = Boolean(headers["Authorization"] || headers["PAYMENT-SIGNATURE"]);
    const discUrl = hasAuth ? `${BASE_URL}/api/discover` : `${BASE_URL}/api/free/discover`;
    const disc = await fetchWithFailover([discUrl], { q, network: body.network || "all", limit: 3 }, headers, 8000);
    if (disc.status !== 200) return sendJson(res, disc.status, disc.text);
    const discJson = JSON.parse(disc.text);
    const urls = (discJson.providers || []).map((p) => p.url).filter(Boolean);
    if (!urls.length) return sendJson(res, 404, { error: `No x402 provider found for '${q}'` });
    const callRes = await fetchWithFailover(urls, body.params || {}, headers, 20000);
    const passHdrs = {};
    for (const h of ["payment-required", "payment-response", "www-authenticate"]) {
      const v = callRes.headers.get(h);
      if (v) passHdrs[h] = v;
    }
    passHdrs["X-Routed-Provider"] = callRes.url;
    return sendJson(res, callRes.status, callRes.text, passHdrs);
  }

  return sendJson(res, 404, { error: "Not found", endpoints: ["GET /health", "GET /v1/models", "POST /v1/chat/completions", "GET|POST /discover", "POST /call"] });
});

server.listen(PORT, HOST, () => {
  console.error(`[apix402-router] listening on http://${HOST}:${PORT} -> upstream ${BASE_URL}`);
});
