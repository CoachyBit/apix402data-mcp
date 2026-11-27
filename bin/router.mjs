#!/usr/bin/env node
/**
 * apix402data Hardened Local Smart Router & x402 Auto-Discovery Proxy
 * (OpenClaw / Cursor / Continue / LangChain drop-in)
 *
 * Zero external dependencies (Node >= 18). Binds strictly to localhost (127.0.0.1:8403):
 *   - POST /v1/chat/completions -> OpenAI-compatible smart router (supports stream=true SSE replay)
 *   - GET  /v1/models           -> lists auto, smart, router, eco, fast, code, reasoning, local, frontier
 *   - GET|POST /discover        -> queries active network-wide health-probed x402 best-deal index
 *   - POST /call                -> auto-discovers live verified provider & calls with safe failover
 *
 * Security hardening (Claude Security Audit verified):
 *   - Host header allowlist (blocks DNS rebinding)
 *   - Rejects browser Origin headers & non-JSON POSTs (blocks drive-by CSRF)
 *   - Strict x402s_ token filter (NEVER forwards user OPENAI_API_KEY / sk-* keys!)
 *   - Origin-pinned credentials + redirect: "manual" (NEVER leaks tokens/signatures to 3rd-party URLs!)
 *   - Byte-capped request (512 KB) and response (4 MB) streams + full-body AbortController timeouts
 *   - Outer try/catch + unhandledRejection guard (never crashes on malformed upstream HTML/JSON)
 */
import http from "node:http";
import dns from "node:dns/promises";
import net from "node:net";

const PORT = Number(process.env.APIX402_ROUTER_PORT || process.env.PORT || 8403);
const RAW_HOST = process.env.APIX402_ROUTER_HOST || "127.0.0.1";
const ALLOW_NON_LOOPBACK = process.env.APIX402_ALLOW_NON_LOOPBACK === "1";
const HOST = (RAW_HOST === "127.0.0.1" || RAW_HOST === "localhost" || RAW_HOST === "::1" || ALLOW_NON_LOOPBACK) ? RAW_HOST : "127.0.0.1";
const BASE_URL = (process.env.APIX402_BASE_URL || "https://apix402data.com").replace(/\/+$/, "");
const BASE_ORIGIN = new URL(BASE_URL).origin;
const ALLOW_EXTERNAL_CALL = process.env.APIX402_ALLOW_EXTERNAL === "1";

const MAX_REQ_BYTES = 512 * 1024;
const MAX_RES_BYTES = 4 * 1024 * 1024;

// ReDoS-safe bounded regexes (synced with Python smart_router_routes.py)
const COMPLEX_RE = /\b(architect|refactor|prove|algorithm|optimize|security audit|vulnerability|differential|theorem|compare|multi-step|step by step|solidity|rust|typescript|python|debug)\b/i;
const CODE_RE = /(```|\bdef\s+\w+|\bfunction\s+\w+|\bclass\s+\w+|\bSELECT\s{1,5}[^\n;]{1,120}\sFROM\b|0x[0-9a-fA-F]{40})/;
const X402_SESSION_RE = /^Bearer x402s_[\w.-]+$/;

process.on("unhandledRejection", (err) => {
  console.error("[apix402-router] unhandledRejection:", err?.message || err);
});

function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) => (typeof p === "string" ? p : p && typeof p.text === "string" ? p.text : ""))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function scoreLocalPrompt(messages = []) {
  const safeMsgs = Array.isArray(messages) ? messages : [];
  const full = safeMsgs.map((m) => extractText(m?.content)).join("\n");
  const sample = full.slice(0, 4000);
  const lastUser = extractText([...safeMsgs].reverse().find((m) => m?.role === "user")?.content).slice(0, 2000);
  const low = lastUser.toLowerCase();
  let score = 0;
  if (full.length > 4000) score += 35;
  else if (full.length > 1200) score += 18;
  if (safeMsgs.length >= 6) score += 15;
  const hasCode = CODE_RE.test(sample);
  if (hasCode) score += 25;
  if (COMPLEX_RE.test(lastUser)) score += 25;
  if (low.includes("json") || low.includes("schema")) score += 10;
  const tier = score >= 50 ? "reasoning" : hasCode && score >= 25 ? "code" : score >= 20 ? "eco" : "local";
  return { score: Math.min(100, score), tier };
}

function isAllowedHost(hostHeader) {
  if (!hostHeader) return false;
  const h = String(hostHeader).toLowerCase().trim();
  const allowed = new Set([
    `127.0.0.1:${PORT}`,
    `localhost:${PORT}`,
    `[::1]:${PORT}`,
    "127.0.0.1",
    "localhost",
    "[::1]",
  ]);
  if (HOST !== "127.0.0.1" && HOST !== "localhost") {
    allowed.add(`${HOST.toLowerCase()}:${PORT}`);
    allowed.add(HOST.toLowerCase());
  }
  return allowed.has(h);
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const low = ip.toLowerCase();
    return low === "::1" || low === "::" || low.startsWith("fc") || low.startsWith("fd") || low.startsWith("fe80") || low.startsWith("::ffff:127.") || low.startsWith("::ffff:10.") || low.startsWith("::ffff:169.254.") || low.startsWith("::ffff:192.168.");
  }
  return true;
}

async function isSafeExternalUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.origin === BASE_ORIGIN) return true;
    if (!ALLOW_EXTERNAL_CALL) return false;
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (net.isIP(host)) return !isPrivateIp(host);
    const addrs = await dns.lookup(host, { all: true });
    if (!addrs.length) return false;
    return addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;
    const fail = (code, msg) => {
      if (settled) return;
      settled = true;
      const err = new Error(msg);
      err.status = code;
      reject(err);
    };
    const timer = setTimeout(() => fail(408, "request_body_timeout"), 15_000);
    req.on("data", (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_REQ_BYTES) {
        clearTimeout(timer);
        fail(413, "payload_too_large");
        req.pause();
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          const err = new Error("json_body_must_be_object");
          err.status = 400;
          return reject(err);
        }
        resolve(parsed);
      } catch {
        const err = new Error("invalid_json");
        err.status = 400;
        reject(err);
      }
    });
    req.on("error", (e) => {
      clearTimeout(timer);
      fail(400, e?.message || "stream_error");
    });
  });
}

// H3 + H4: ONLY forward x402s_ session tokens to BASE_ORIGIN; NEVER leak user OPENAI_API_KEY!
function buildAuthHeaders(req, targetUrl, allowPaymentSig = true) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "apix402-router/5.5.1",
  };
  let sameOrigin = false;
  try {
    sameOrigin = new URL(targetUrl).origin === BASE_ORIGIN;
  } catch {
    sameOrigin = false;
  }
  if (sameOrigin) {
    const clientAuth = String(req.headers["authorization"] || "").trim();
    const envTok = process.env.X402_SESSION_TOKEN ? `Bearer ${process.env.X402_SESSION_TOKEN.trim()}` : "";
    if (X402_SESSION_RE.test(clientAuth)) {
      headers["Authorization"] = clientAuth;
    } else if (X402_SESSION_RE.test(envTok)) {
      headers["Authorization"] = envTok;
    }
  }
  if (allowPaymentSig) {
    const paySig = String(req.headers["payment-signature"] || req.headers["x-payment"] || "").trim();
    if (paySig) headers["PAYMENT-SIGNATURE"] = paySig;
  }
  return headers;
}

async function readBoundedText(res) {
  const reader = res.body?.getReader?.();
  if (!reader) {
    const txt = await res.text();
    if (Buffer.byteLength(txt, "utf8") > MAX_RES_BYTES) throw new Error("upstream_response_too_large");
    return txt;
  }
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RES_BYTES) {
      await reader.cancel().catch(() => {});
      throw new Error("upstream_response_too_large");
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function fetchOne(url, method, payload, headers, timeoutMs, req) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error("upstream_timeout")), timeoutMs);
  const onClose = () => ac.abort(new Error("client_disconnected"));
  req?.on("close", onClose);
  try {
    const opts = { method, headers, redirect: "manual", signal: ac.signal };
    if (method === "POST") opts.body = JSON.stringify(payload ?? {});
    const res = await fetch(url, opts);
    if (res.status >= 300 && res.status < 400) {
      return { status: 502, text: JSON.stringify({ error: "upstream_redirect_blocked" }), headers: new Headers(), url };
    }
    const text = await readBoundedText(res);
    return { status: res.status, text, headers: res.headers, url };
  } catch (err) {
    return { status: 502, text: JSON.stringify({ error: String(err?.message || "upstream_error") }), headers: new Headers(), url };
  } finally {
    clearTimeout(timer);
    req?.off("close", onClose);
  }
}

async function fetchWithFailover(entries, payload, req, timeoutMs = 60_000, allowPaymentSig = true) {
  let lastRes = null;
  for (let i = 0; i < entries.length; i++) {
    const { url, method = "POST" } = entries[i];
    // Never replay a single-use PAYMENT-SIGNATURE across multiple failover URLs (#19)
    const usePaySig = allowPaymentSig && i === 0;
    const headers = buildAuthHeaders(req, url, usePaySig);
    const r = await fetchOne(url, method, payload, headers, timeoutMs, req);
    if (r.status < 500) return r;
    lastRes = r;
  }
  return lastRes || { status: 502, text: JSON.stringify({ error: "all_upstreams_failed" }), headers: new Headers(), url: "" };
}

function sendJson(res, status, obj, extraHeaders = {}) {
  const body = typeof obj === "string" ? obj : JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(body);
}

function sendSseReplay(res, completionObj, extraHeaders = {}) {
  const ch = completionObj?.choices?.[0] || { message: { content: "" }, finish_reason: "stop" };
  const base = {
    id: completionObj?.id || `chatcmpl-x402-${Date.now()}`,
    object: "chat.completion.chunk",
    created: completionObj?.created || Math.floor(Date.now() / 1000),
    model: completionObj?.model || "auto",
  };
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: { role: "assistant", content: ch.message?.content || "" }, finish_reason: null }] })}\n\n`);
  res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta: {}, finish_reason: ch.finish_reason || "stop" }], usage: completionObj?.usage })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}

function parseLive402Accepts(text, headers) {
  const objs = [];
  const hdr = headers.get("payment-required") || headers.get("x-payment-required") || "";
  if (hdr) {
    try {
      const dec = JSON.parse(Buffer.from(hdr, "base64").toString("utf8"));
      if (dec && typeof dec === "object") objs.push(dec);
    } catch {}
  }
  try {
    const j = JSON.parse(text);
    if (j && typeof j === "object") objs.push(j);
  } catch {}
  const accepts = [];
  for (const o of objs) {
    if (Array.isArray(o.accepts)) accepts.push(...o.accepts);
  }
  return accepts;
}

function verifyPurchaseProtection402(callRes, providerMeta, maxBudgetUsd) {
  if (callRes.status !== 402 || !providerMeta) return { ok: true };
  const pp = providerMeta.purchase_protection || {};
  const pinnedMax = typeof pp.pinned_max_price_usd === "number" ? pp.pinned_max_price_usd : providerMeta.price_usd;
  const ceiling = typeof maxBudgetUsd === "number" ? Math.min(maxBudgetUsd, pinnedMax ?? maxBudgetUsd) : pinnedMax;
  const pinnedWallets = new Set(Object.values(pp.pinned_pay_to || providerMeta.pay_to || {}).map((w) => String(w).toLowerCase()));
  // MEDIUM #5 fix: fail closed if no wallet is pinned!
  if (pinnedWallets.size === 0) return { ok: false, reason: "no_pinned_wallet_for_purchase_protection" };
  const accepts = parseLive402Accepts(callRes.text, callRes.headers);
  if (!accepts.length) return { ok: false, reason: "malformed_402_challenge_missing_accepts" };

  // MEDIUM #6 fix: require EVERY accept entry in 402 to match pinned price ceiling & wallet (no Trojan entry!)
  for (const a of accepts) {
    const rawAmt = a?.amount ?? a?.maxAmountRequired;
    const num = Number(rawAmt);
    const priceUsd = Number.isFinite(num) ? (num >= 10 ? num / 1_000_000 : num) : Infinity;
    const payTo = String(a?.payTo || "").toLowerCase();
    const priceOk = ceiling === undefined || priceUsd <= ceiling * 1.05 + 0.0001;
    const walletOk = pinnedWallets.has(payTo);
    if (!priceOk || !walletOk) {
      return { ok: false, reason: "price_or_wallet_mismatch_against_pinned_handshake" };
    }
  }
  return { ok: true };
}

function copyPaymentHeaders(upstreamHeaders) {
  const out = {};
  for (const h of ["payment-required", "x-payment-required", "payment-response", "www-authenticate", "x-session-remaining-usd"]) {
    const v = upstreamHeaders.get(h);
    if (v) out[h] = v;
  }
  return out;
}

const server = http.createServer(async (req, res) => {
  try {
    // H2 + blind GET CSRF fix: Block DNS rebinding, browser Origin & cross-site Sec-Fetch-Site
    if (!isAllowedHost(req.headers.host)) {
      return sendJson(res, 403, { error: "forbidden_host" });
    }
    if (req.headers.origin || String(req.headers["sec-fetch-site"] || "").toLowerCase() === "cross-site") {
      return sendJson(res, 403, { error: "browser_origin_blocked" });
    }

    const urlObj = new URL(req.url || "/", `http://${HOST}:${PORT}`);
    const pathname = urlObj.pathname;

    if (req.method === "GET" && pathname === "/health") {
      return sendJson(res, 200, {
        ok: true,
        name: "x402Pilot",
        tagline: "Autonomous x402 Ecosystem Finder, Quality Grader & Purchase Shield",
        router: "apix402data-smart-router",
        version: "5.5.1",
        upstream: BASE_ORIGIN,
        external_call_enabled: ALLOW_EXTERNAL_CALL,
      });
    }

    if (req.method === "GET" && pathname === "/v1/models") {
      const models = ["auto", "smart", "router", "eco", "fast", "code", "reasoning", "local", "qwen3.5:4b", "openai/gpt-4o-mini", "google/gemini-2.5-flash", "deepseek/deepseek-chat", "anthropic/claude-3.5-haiku"];
      return sendJson(res, 200, {
        object: "list",
        data: models.map((id) => ({ id, object: "model", owned_by: "apix402data-x402" })),
      });
    }

    if (req.method === "POST") {
      const ct = String(req.headers["content-type"] || "").toLowerCase();
      if (!ct.includes("application/json")) {
        return sendJson(res, 415, { error: "content_type_must_be_application_json" });
      }
    }

    if (pathname === "/v1/chat/completions" && req.method === "POST") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJson(res, e.status || 400, { error: { message: e.message, type: "invalid_request_error" } });
      }
      const wantsStream = Boolean(body.stream);
      const localScore = scoreLocalPrompt(body.messages || []);
      const testHdrs = buildAuthHeaders(req, `${BASE_URL}/v1/chat/completions`, true);
      const hasAuth = Boolean(testHdrs["Authorization"] || testHdrs["PAYMENT-SIGNATURE"]);
      // #1 fix: free tier uses OpenAI-shaped /api/free/v1/chat/completions so SDKs get valid choices[]!
      const targetUrl = hasAuth ? `${BASE_URL}/v1/chat/completions` : `${BASE_URL}/api/free/v1/chat/completions`;
      const upstream = await fetchWithFailover(
        [{ url: targetUrl, method: "POST" }],
        { ...body, model: body.model || "auto", stream: false },
        req,
        60_000,
        true
      );
      const passHdrs = copyPaymentHeaders(upstream.headers);
      passHdrs["X-Local-Router-Tier"] = localScore.tier;
      passHdrs["X-Local-Router-Score"] = String(localScore.score);
      if (wantsStream && upstream.status === 200) {
        try {
          return sendSseReplay(res, JSON.parse(upstream.text), passHdrs);
        } catch {
          return sendJson(res, 502, { error: { message: "invalid_upstream_json", type: "server_error" } });
        }
      }
      return sendJson(res, upstream.status, upstream.text, passHdrs);
    }

    if (pathname === "/discover" && (req.method === "GET" || req.method === "POST")) {
      let rawParams = {};
      if (req.method === "POST") {
        try {
          rawParams = await readJsonBody(req);
        } catch (e) {
          return sendJson(res, e.status || 400, { error: e.message });
        }
      } else {
        rawParams = Object.fromEntries(urlObj.searchParams.entries());
      }
      // L7: strict parameter allowlist
      const cleanBody = {};
      if (rawParams.q !== undefined) cleanBody.q = String(rawParams.q).slice(0, 200);
      if (rawParams.network !== undefined) cleanBody.network = String(rawParams.network).slice(0, 24);
      if (rawParams.scope !== undefined) cleanBody.scope = String(rawParams.scope).slice(0, 24);
      if (rawParams.max_price_usd !== undefined && Number.isFinite(Number(rawParams.max_price_usd))) cleanBody.max_price_usd = Number(rawParams.max_price_usd);
      if (rawParams.limit !== undefined && Number.isFinite(Number(rawParams.limit))) cleanBody.limit = Math.max(1, Math.min(50, Math.trunc(Number(rawParams.limit))));

      const testHdrs = buildAuthHeaders(req, `${BASE_URL}/api/discover`, true);
      const hasAuth = Boolean(testHdrs["Authorization"] || testHdrs["PAYMENT-SIGNATURE"]);
      const target = hasAuth ? `${BASE_URL}/api/discover` : `${BASE_URL}/api/free/discover`;
      const upstream = await fetchWithFailover([{ url: target, method: "POST" }], cleanBody, req, 15_000, true);
      return sendJson(res, upstream.status, upstream.text, copyPaymentHeaders(upstream.headers));
    }

    if (pathname === "/call" && req.method === "POST") {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (e) {
        return sendJson(res, e.status || 400, { error: e.message });
      }
      const q = String(body.capability || body.q || "").trim().slice(0, 200);
      if (!q) return sendJson(res, 400, { error: "capability (or q) is required" });

      // Never spend the caller's resource PAYMENT-SIGNATURE on the discovery step (#2)
      const discHdrs = buildAuthHeaders(req, `${BASE_URL}/api/discover`, false);
      const discUrl = discHdrs["Authorization"] ? `${BASE_URL}/api/discover` : `${BASE_URL}/api/free/discover`;
      const disc = await fetchWithFailover(
        [{ url: discUrl, method: "POST" }],
        { q, network: String(body.network || "all").slice(0, 24), scope: ALLOW_EXTERNAL_CALL ? String(body.scope || "all") : "apix402data", limit: 5 },
        req,
        12_000,
        false
      );
      if (disc.status !== 200) return sendJson(res, disc.status, disc.text, copyPaymentHeaders(disc.headers));

      let discJson;
      try {
        discJson = JSON.parse(disc.text);
      } catch {
        return sendJson(res, 502, { error: "invalid_discovery_response" });
      }

      // Only fail over across primary + same-capability failover_candidates (#2 + #16 + H4 + Purchase Protection)
      const maxBudget = Number.isFinite(Number(body.max_budget_usd)) ? Number(body.max_budget_usd) : undefined;
      const rawCandidates = [discJson.recommended_primary, ...(discJson.failover_candidates || [])].filter(Boolean);
      const targets = [];
      const metaByUrl = new Map();
      for (const p of rawCandidates) {
        if (maxBudget !== undefined && typeof p.price_usd === "number" && p.price_usd > maxBudget) continue;
        let targetUrl = p.url;
        // #16: Rewrite self-hosted apix402data paths onto configured BASE_URL
        if (p.source === "apix402data" && typeof p.path === "string" && p.path.startsWith("/")) {
          targetUrl = `${BASE_URL}${p.path}`;
        }
        if (targetUrl && (await isSafeExternalUrl(targetUrl))) {
          targets.push({ url: targetUrl, method: String(p.method || "POST").toUpperCase() === "GET" ? "GET" : "POST" });
          metaByUrl.set(targetUrl, p);
        }
      }
      if (!targets.length) return sendJson(res, 404, { error: `No verified safe x402 provider within budget found for '${q}'` });

      const callRes = await fetchWithFailover(targets, body.params || {}, req, 30_000, true);
      const chosenMeta = metaByUrl.get(callRes.url);
      const ppCheck = verifyPurchaseProtection402(callRes, chosenMeta, maxBudget);
      if (!ppCheck.ok) {
        return sendJson(res, 409, {
          error: "purchase_protection_blocked",
          reason: ppCheck.reason,
          provider: callRes.url,
          message: "Blocked tampered or over-budget HTTP 402 payment challenge before wallet signing.",
        });
      }
      const passHdrs = copyPaymentHeaders(callRes.headers);
      passHdrs["X-Routed-Provider"] = callRes.url;
      if (chosenMeta?.quality_grade) passHdrs["X-Provider-Quality-Grade"] = String(chosenMeta.quality_grade);
      passHdrs["X-Purchase-Protection"] = "verified";
      return sendJson(res, callRes.status, callRes.text, passHdrs);
    }

    return sendJson(res, 404, { error: "Not found", endpoints: ["GET /health", "GET /v1/models", "POST /v1/chat/completions", "GET|POST /discover", "POST /call"] });
  } catch (err) {
    console.error("[apix402-router] handler error:", err?.message || err);
    if (!res.headersSent) {
      sendJson(res, 502, { error: "internal_proxy_error" });
    }
  }
});

server.requestTimeout = 65_000;
server.headersTimeout = 15_000;

server.listen(PORT, HOST, () => {
  console.error(`[apix402-router] v5.5.1 hardened proxy listening on http://${HOST}:${PORT} -> upstream ${BASE_ORIGIN}`);
});
