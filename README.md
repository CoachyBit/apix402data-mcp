# x402Pilot + apix402data MCP Server (`apix402data-mcp`)

[![x402Pilot Verified Grade A+](https://apix402data.com/badge?url=https://apix402data.com/api/discover)](https://apix402data.com/)
[![Glama MCP Connector Score](https://glama.ai/mcp/connectors/com.apix402data/x402-data-api/badges/score.svg)](https://glama.ai/mcp/connectors/com.apix402data/x402-data-api)

**x402Pilot** is the autonomous **x402 Ecosystem Endpoint Finder, Quality Grader (`A+`–`F`), Purchase Protection Shield & OpenAI-Compatible Smart Router** (`bin/router.mjs` + `bin/cli.mjs`), backed by **51 live pay-per-call endpoints** accepting **Solana USDC (PayAI)** and **Base USDC (Coinbase CDP)**.

### x402Pilot — Autonomous x402 Ecosystem Finder & Purchase Shield (`npx x402pilot`)
Point any AI agent, OpenClaw bot, Cursor, Continue, or OpenAI SDK at `http://127.0.0.1:8403` (or directly at `https://apix402data.com`):
```bash
# Start x402Pilot local hardened proxy (zero dependencies, Node >= 18):
npx -y -p apix402data-mcp@latest x402pilot

# Or point OpenClaw / Cursor / OpenAI SDK directly at:
# OPENAI_BASE_URL=http://127.0.0.1:8403/v1   model="auto" | "eco" | "code" | "reasoning" | "local"
```
- **Active Network-Wide Quality & Deal Discovery (`GET|POST /discover`):** **5 FREE tries every 24 hours** (then `$0.0015/call` on Solana or Base USDC). Continuously probes live x402 endpoints across Coinbase CDP Bazaar, PayAI Discovery, and seller `/.well-known/x402` manifests — quarantining dead/404/5xx APIs and bad actors so agents always get verified, high-quality, best-deal endpoints in `<15ms`.
- **Buyer Purchase Protection (`POST /call` + `/api/discover/verify-handshake` + `/api/discover/report`):** Pins verified price & recipient wallet before signing, blocks tampered or over-budget `402` payment challenges before a wallet ever signs, and downgrades/quarantines endpoints reported for bad data until the seller repairs and re-verifies.
- **OpenAI-Compatible Drop-In Smart Router (`POST /v1/chat/completions`):** Supports `stream: true` SSE replay, automatic complexity routing, and `<10ms` live Solana/Polymarket grounding.
- **Security Hardened:** Localhost-only Host/Origin CSRF & DNS-rebinding guards, `redirect: "manual"`, strict `x402s_` session scoping (never forwards user `OPENAI_API_KEY`).

- **Live Public Radar (`$0`, Pre-Warmed `<10ms`):** `https://apix402data.com/live` — real-time Solana priority fees, SPL rug checks, Polymarket 24h volume & bid/ask spreads, and keyless multi-chain RPC demos.
- **Dual-Chain x402 Settlement (Solana + Base USDC):** Every `402` response advertises both **Base (`eip155:8453`)** and **Solana (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`)** USDC `accepts[]` with `$0` buyer gas.
- **1-File Starter Scanner:** [`examples/solana_polymarket_scanner.py`](./examples/solana_polymarket_scanner.py) — zero-API-key Solana + Polymarket loop scanner ready in 1 command.

- **Local Stdio MCP Server (`bin/cli.mjs`):** Implements JSON-RPC `initialize`, `ping`, `tools/list`, and `tools/call` locally in Node.js (`>=18`, zero external dependencies) with built-in support for `X402_SESSION_TOKEN` (`x402s_...`), `X402_PAYMENT_SIGNATURE`, and automatic `/api/free/*` preview routing.
- **Docker Support:** Includes a standalone `Dockerfile` (`node:22-alpine`) for containerized MCP runners.
- **Remote Streamable HTTP MCP Endpoint:** `https://apix402data.com/mcp` (`15` flagship MCP tools)
- **A2A Messaging Endpoint:** `https://apix402data.com/a2a` (`message/send`, `tasks/get`) & `POST /message:send`
- **1 Free Try -> Paid Rollover (via `/mcp` or REST):** `GET https://apix402data.com/api/free/status` & `POST https://apix402data.com/api/free/<tool_path>` (call #1 returns live data; call #2 automatically rolls over to HTTP 402 with Solana + Base USDC `accepts[]` and `/pay` top-up link)
- **Card / Apple Pay Top-Up (Claude Web & Mobile):** `https://apix402data.com/pay` — mints an instant 30-day `session_token` (`x402s_...`) to pass in any MCP tool call or `Authorization: Bearer` header
- **OpenAPI 3.1 Spec:** `https://apix402data.com/openapi.json`
- **x402 / Bazaar Manifest:** `https://apix402data.com/.well-known/x402.json`
- **Framework Adapters (`adapters/`):** Ready-to-use integrations for **LangChain** (`adapters/langchain_tools.py`), **ElizaOS** (`adapters/elizaos_plugin.mjs`), and **Coinbase AgentKit** (`adapters/agentkit_provider.mjs`)
- **A2A Agent Card:** `https://apix402data.com/.well-known/agent-card.json`
- **Agent Docs (`llms.txt`):** `https://apix402data.com/llms.txt`
- **Agent Skill (`SKILL.md`):** `https://apix402data.com/SKILL.md` ([SKILL.md](./SKILL.md))
- **Workflow Packages (JSON):** `https://apix402data.com/packages`

## Connect in Claude Desktop / Cursor / Windsurf / OpenCode

```json
{
  "mcpServers": {
    "apix402data": {
      "type": "streamable-http",
      "url": "https://apix402data.com/mcp"
    }
  }
}
```

Or via stdio bridge:

```json
{
  "mcpServers": {
    "apix402data": {
      "command": "npx",
      "args": ["-y", "apix402data-mcp"]
    }
  }
}
```

## 30-Second Copy-Paste Recipes (Most Used by Agents)

Top active endpoints: `/api/token/risk` (`$0.01`), `/api/company` (`$0.002`), `/api/clean-url` (`$0.002`), `/api/defi/yield-matrix` (`$0.03`), and `/api/crypto/news` (`$0.002`).

```bash
# Try free right now (10 lifetime preview calls, no wallet required)
curl -s -X POST https://apix402data.com/api/free/token/risk \
  -H "Content-Type: application/json" \
  -d '{"address":"0x940181a94A35A4569E4529A3CDfB74e38FD98631","chain":"base"}'
```

## Tool Categories (`48` Paid Endpoints, `$0.001–$0.05` USDC on Solana & Base + Stripe MPP/Tempo)
- **Solana, Multi-Chain RPC, Polymarket & Social (`$0.001–$0.002`):** `/api/rpc` (`$0.001`, Solana/Base/Eth/Arb/OP), `/api/solana/priority-fee` (`$0.001`), `/api/solana/token-risk` (`$0.002`), `/api/solana/wallet-holdings` (`$0.002`), `/api/markets/polymarket` (`$0.002`), `/api/social/farcaster-lookup` (`$0.002`), `/api/llm/chat` (`$0.002`, OpenRouter frontier + dual-GPU local failover)
- **Agent Workflows & Bypass:** `/api/bypass/sweep` (`$0.005`), `/api/agent/ephemeral-key`, `/api/bypass/cross-execute` (`$0.005`), `/api/guard/preflight-bypass`, `/api/execution/stealth-slice`, `/api/security/approval-purge`, `/api/rails/route-select`, `/api/workflow/state-gate`, `/api/trust/wallet-attest`, `/api/chain/nonce-unstick`
- **Token & Chain Data:** `/api/token/snapshot`, `/api/token/risk`, `/api/tx/decode`, `/api/chain/gas`, `/api/tokens/trending`, `/api/tokens/newest`, `/api/token/indicators`, `/api/onchain/prices`, `/api/chain/rpc-consensus`, `/api/allowance/check`
- **Crypto, DeFi & Security:** `/api/crypto/news` (`$0.002`), `/api/crypto/whale-flows` (`$0.003`), `/api/crypto/exploit-radar` (`$0.005`), `/api/crypto/state-attestation`, `/api/crypto/zk-receipt-verify`, `/api/defi/yield-matrix` (`$0.005`), `/api/defi/arbitrage-radar` (`$0.005`), `/api/defi/intent-routing` (`$0.003`), `/api/security/preflight-402`, `/api/agent/execution-firewall`, `/api/agent/mev-shield-check`, `/api/agent/reputation-mesh`
- **Web, News & SEC Research:** `/api/search`, `/api/news`, `/api/company`, `/api/clean-url`

## Payment Rails
- **x402 (Solana SPL USDC & Base ERC-20 USDC):** `$0` buyer gas via Coinbase CDP facilitator (`GThvpKNLrFQmxxdM9kTKJmwBvqjzdoJCckoMeZaDZiJ6` on Solana, `0x17ea1c2afc105d8e9c976ed65aa97c65cf5720f6` on Base)
- **Stripe MPP:** Card payments for `>= $0.01` / session calls
- **Session Tunnel:** `POST /api/agent/session-open` (`$1.00` pre-funded bearer token)

## Support & Links
- **Email:** [support@apix402data.com](mailto:support@apix402data.com)
- **Website & Live Radar:** https://apix402data.com · https://apix402data.com/live
- **Support, Privacy & Terms:** https://apix402data.com/support · https://apix402data.com/privacy · https://apix402data.com/terms
- **Issues:** https://github.com/CoachyBit/apix402data-mcp/issues
