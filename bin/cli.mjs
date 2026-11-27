#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "tools_catalog.json"), "utf8"));
const BASE_URL = (process.env.APIX402_BASE_URL || "https://apix402data.com").replace(/\/+$/, "");

const TOOL_ROUTES = {
  discover_x402_endpoints: "/api/discover",
  call_chain_rpc: "/api/rpc",
  get_solana_priority_fee: "/api/solana/priority-fee",
  check_solana_token_risk: "/api/solana/token-risk",
  get_solana_wallet_holdings: "/api/solana/wallet-holdings",
  get_evm_gas_price: "/api/chain/gas",
  check_evm_token_risk: "/api/token/risk",
  get_token_ohlc_indicators: "/api/token/indicators",
  get_polymarket_markets: "/api/markets/polymarket",
  get_defi_yield_pools: "/api/defi/yield-matrix",
  get_crypto_news: "/api/crypto/news",
  search_web: "/api/search",
  fetch_web_markdown: "/api/clean-url",
  open_agent_session: "/api/agent/session-open",
  get_agent_session_status: "/api/agent/session-status",
  // Legacy aliases preserved for backward compatibility
  x402pilot_discover: "/api/discover",
  chain_rpc_call: "/api/rpc",
  solana_priority_fee: "/api/solana/priority-fee",
  solana_token_risk: "/api/solana/token-risk",
  solana_wallet_holdings: "/api/solana/wallet-holdings",
  polymarket_markets: "/api/markets/polymarket",
  farcaster_identity: "/api/social/farcaster-lookup",
  web_search: "/api/search",
  web_fetch_markdown: "/api/clean-url",
  news_crypto_feed: "/api/crypto/news",
  sec_company_lookup: "/api/company",
  evm_token_risk: "/api/token/risk",
  defi_yield_pools: "/api/defi/yield-matrix",
  agent_session_open: "/api/agent/session-open",
  agent_session_status: "/api/agent/session-status",
};

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function callTool(name, rawArgs) {
  const route = TOOL_ROUTES[name];
  if (!route) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
    };
  }
  const args = rawArgs && typeof rawArgs === "object" ? { ...rawArgs } : {};
  const sessionToken = String(args.session_token || process.env.X402_SESSION_TOKEN || "").trim();
  delete args.session_token;

  const paySig = String(process.env.X402_PAYMENT_SIGNATURE || "").trim();
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  let targetPath = route;

  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  } else if (paySig) {
    headers["PAYMENT-SIGNATURE"] = paySig;
  } else if (route !== "/api/agent/session-open" && route !== "/api/agent/session-status") {
    targetPath = "/api/free" + route.slice("/api".length);
  }

  const isGet = route === "/api/agent/session-status";
  const res = await fetch(`${BASE_URL}${targetPath}`, {
    method: isGet ? "GET" : "POST",
    headers,
    ...(isGet ? {} : { body: JSON.stringify(args) }),
  });
  const text = await res.text();
  return {
    isError: res.status >= 400,
    content: [{ type: "text", text: text || `HTTP ${res.status}` }],
  };
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }
  const { id, method, params } = req;
  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return;
  }
  if (id === undefined || id === null) return;

  try {
    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "apix402data-mcp", version: "5.5.2" },
        },
      });
    } else if (method === "ping") {
      send({ jsonrpc: "2.0", id, result: {} });
    } else if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    } else if (method === "tools/call") {
      const name = params?.name;
      const result = await callTool(name, params?.arguments);
      send({ jsonrpc: "2.0", id, result });
    } else {
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (err) {
    send({
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: err?.message || "Internal error" },
    });
  }
});
