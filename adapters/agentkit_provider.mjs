/**
 * Coinbase AgentKit-compatible action provider for apix402data.com.
 * Uses X402_SESSION_TOKEN (x402s_...) or passes through x402-wrapped fetch if provided.
 */
const BASE_URL = (process.env.APIX402_BASE_URL || "https://apix402data.com").replace(/\/$/, "");

export function apix402ActionProvider({ fetchFn = fetch, sessionToken = process.env.X402_SESSION_TOKEN } = {}) {
  const post = async (path, body) => {
    const headers = { "Content-Type": "application/json", "User-Agent": "apix402data-agentkit/1.0" };
    if (sessionToken) headers["Authorization"] = `Bearer ${sessionToken}`;
    const res = await fetchFn(`${BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    return res.json();
  };

  return {
    name: "apix402data",
    getActions: () => [
      {
        name: "apix402_search",
        description: "Live web & news search ($0.002/call, Exa /v1/x402/search drop-in).",
        invoke: ({ query, numResults = 5 }) => post("/v1/x402/search", { query, numResults }),
      },
      {
        name: "apix402_scrape",
        description: "Scrape public HTTPS URL to clean LLM Markdown ($0.002/call, Firecrawl /v1/x402/scrape drop-in).",
        invoke: ({ url }) => post("/v1/x402/scrape", { url }),
      },
      {
        name: "apix402_simple_price",
        description: "CoinGecko-compatible token spot prices ($0.003/call).",
        invoke: ({ ids = "bitcoin,ethereum", vs_currencies = "usd" }) =>
          post("/api/v3/x402/simple/price", { ids, vs_currencies, include_24hr_change: true }),
      },
      {
        name: "apix402_defi_yields",
        description: "Risk-adjusted DeFi yield rankings across Base/ETH/Arbitrum/Solana ($0.25/call).",
        invoke: ({ chain = "base" }) => post("/api/defi/yield-matrix", { chain }),
      },
      {
        name: "apix402_token_risk",
        description: "Smart-contract & DEX liquidity rug-risk check ($0.01/call).",
        invoke: ({ address, chain = "base" }) => post("/api/token/risk", { address, chain }),
      },
    ],
  };
}
