/**
 * ElizaOS plugin for apix402data.com (zero external dependencies, Node >= 18).
 * Exposes web search ($0.002), URL-to-Markdown scrape ($0.002), token prices ($0.003),
 * and DeFi yield matrix actions via X402_SESSION_TOKEN or X402_PAYMENT_SIGNATURE.
 */
const BASE_URL = (process.env.APIX402_BASE_URL || "https://apix402data.com").replace(/\/$/, "");

async function callApix402(path, body = {}) {
  const headers = { "Content-Type": "application/json", "User-Agent": "apix402data-elizaos/1.0" };
  if (process.env.X402_SESSION_TOKEN) headers["Authorization"] = `Bearer ${process.env.X402_SESSION_TOKEN}`;
  if (process.env.X402_PAYMENT_SIGNATURE) headers["PAYMENT-SIGNATURE"] = process.env.X402_PAYMENT_SIGNATURE;
  const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

export const apix402dataPlugin = {
  name: "apix402data",
  description: "Pay-per-call search, Firecrawl scrape, CoinGecko prices, and DeFi telemetry via x402 / session tokens.",
  actions: [
    {
      name: "APIX402_WEB_SEARCH",
      similes: ["WEB_SEARCH", "EXA_SEARCH", "SEARCH_NEWS"],
      description: "Search live web & news via apix402data ($0.002/call).",
      validate: async () => true,
      handler: async (_runtime, message, _state, _opts, callback) => {
        const query = message?.content?.text || "Base x402 ecosystem";
        const out = await callApix402("/api/search", { query, limit: 5 });
        if (callback) await callback({ text: JSON.stringify(out.data) });
        return out;
      },
    },
    {
      name: "APIX402_SCRAPE_URL",
      similes: ["CLEAN_URL", "READ_WEBPAGE"],
      description: "Extract clean LLM Markdown from any public HTTPS URL ($0.002/call).",
      validate: async () => true,
      handler: async (_runtime, message, _state, _opts, callback) => {
        const match = String(message?.content?.text || "").match(/https:\/\/\S+/i);
        if (!match) return { status: 400, data: { error: "No https:// URL found in message" } };
        const out = await callApix402("/api/clean-url", { url: match[0] });
        if (callback) await callback({ text: JSON.stringify(out.data) });
        return out;
      },
    },
    {
      name: "APIX402_TOKEN_PRICE",
      similes: ["ONCHAIN_PRICE", "TOKEN_PRICE"],
      description: "Fetch live on-chain token prices ($0.003/call).",
      validate: async () => true,
      handler: async (_runtime, message, _state, _opts, callback) => {
        const tokens = message?.content?.tokens || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,0x4200000000000000000000000000000000000006";
        const out = await callApix402("/api/onchain/prices", { tokens });
        if (callback) await callback({ text: JSON.stringify(out.data) });
        return out;
      },
    },
  ],
};

export default apix402dataPlugin;
