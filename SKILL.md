---
name: x402pilot-apix402data
description: x402Pilot (Autonomous x402 Ecosystem Finder, A+ to F Quality Grader, Verified Dead-Endpoint Graveyard & Purchase Protection Shield) + 51 pay-per-call Solana (PayAI) & Base (Coinbase CDP) USDC endpoints (15 uniform verb_noun MCP tools). 5 free daily tries on /api/free/discover, 1 free try on all other tools.
version: 5.1.0
updated: 2026-11-21
homepage: https://apix402data.com
mcp: https://apix402data.com/mcp
openapi: https://apix402data.com/openapi.json
llms_txt: https://apix402data.com/llms.txt
pricing: https://apix402data.com/pricing
---

# x402Pilot + apix402data — Claude & Agent Skill Guide

Use this skill when an autonomous agent needs **live quality-graded (`A+`-`F`) x402 ecosystem endpoint discovery & Purchase Protection (`x402Pilot`), keyless multi-chain JSON-RPC, Solana priority fees & SPL rug checks, EVM gas & token risk, historical OHLCV indicators, live Polymarket odds/spreads, DeFi yields, crypto news, or clean web RAG extraction** via HTTP 402 (USDC on **Solana** `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` or **Base** `eip155:8453`), Stripe MPP/Tempo, or MCP Streamable HTTP (`https://apix402data.com/mcp`).

## x402Pilot Discovery & Purchase Protection Endpoints
- `POST /api/free/discover` (5 FREE tries every 24h UTC) -> `POST /api/discover` (`$0.0015`) — Live network-wide quality-graded (`A+`-`F`) & best-deal x402 endpoint finder across Coinbase CDP Bazaar, PayAI & seller manifests
- `POST /api/discover/verify-handshake` (`$0.00` FREE) — Real-time pre-purchase handshake verifier (checks live 402 price, budget cap, USDC contract & `payTo` wallet BEFORE signing)
- `GET /api/discover/dead` (`$0.00` FREE) — Verified dead-endpoint & quarantined bad-actor graveyard registry
- `POST /api/discover/submit` (`$0.00` FREE) — Multi-facilitator seller submission & live quality re-verification
- `POST /api/discover/report` (`$0.00` FREE) — Buyer bad-data / scam report (triggers live re-probe & instant grade downgrade/quarantine)
- `POST /v1/chat/completions` (`$0.002`) — OpenAI-compatible drop-in smart router (`model="auto"`, SSE streaming, live Solana/Polymarket grounding)

## Cross-Referenced Discovery Endpoints
- `GET /live` — Free real-time public radar (Solana fees, Polymarket movers, multi-chain RPC demos)
- `GET /SKILL.md` — This skill guide (Markdown)
- `GET /llms.txt` — LLM-readable service & quick-start guide
- `GET /openapi.json` — Full OpenAPI 3.1 spec with `x-payment-info` & request/response schemas
- `GET /pricing` — Live machine-readable price list & valid tickers/categories
- `POST /mcp` — MCP Streamable HTTP endpoint (15 uniform `verb_noun` flagship tools with 15/15 `outputSchema`)
- `GET /.well-known/mcp.json` | `GET /.well-known/x402` | `GET /.well-known/agent-card.json` | `GET /.well-known/ai-plugin.json`

## Payment & Reliability Protocol
1. **Free Validation First (`$0.00`):** Call `POST /api/discover/verify-handshake`, `GET /api/discover/dead`, or `GET /api/search/check`, `/api/company/check`, `/api/news/check`, `/api/clean-url/check` before paying.
2. **Free Tries -> Paid Rollover:** `discover_x402_endpoints` / `POST /api/free/discover` includes **5 FREE tries every 24h UTC** (6th call rolls over to `$0.0015` HTTP 402); all other paid tools include **1 free try** per IP (call #2 rolls over to HTTP 402).
3. **HTTP 402 (`x402` v2 — Solana + Base USDC):** Paid routes return `402` with `PAYMENT-REQUIRED` advertising BOTH Base (`eip155:8453`, `payTo` `0x17ea1c2afc105d8e9c976ed65aa97c65cf5720f6`) and Solana (`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`, `payTo` `GThvpKNLrFQmxxdM9kTKJmwBvqjzdoJCckoMeZaDZiJ6`). Retry with `PAYMENT-SIGNATURE` (or `X-PAYMENT`); receive `PAYMENT-RESPONSE`. Settlement occurs ONLY on `<400` responses (zero charge on error).
4. **Stripe MPP + Tempo (routes `>= $0.01`):** `402` also includes `WWW-Authenticate: Payment` challenge; retry with `Authorization: Payment <credential>`.
5. **Prepaid 30-Day Session (`x402s_...`):** Top up via `/pay` or `open_agent_session` (`POST /api/agent/session-open`), then pass `Authorization: Bearer x402s_...` (or `session_token` in MCP `tools/call`). Inspect anytime with `get_agent_session_status` (free).
6. **Idempotency & Replay Safety:** Send `Idempotency-Key: <uuid>` for 15-minute duplicate-charge protection. Replayed nonces return `409 Conflict`.

## Agent Workflow Packages (Curated Multi-Step Bundles)

### Package 1: Autonomous Agent Pre-Flight & Transaction Guardrail Pack
Validate 402 paywalls, counterparty reputation, calldata/approvals, MEV risk, gas sponsorship, and task escrow before signing or spending USDC.
- `POST /api/security/preflight-402` (`$0.002`, x402) — Audit any 402/x402 target URL for SSRF, pricing bounds, and prompt-injection risk (free pre-check: GET /api/security/preflight-402/check?url=<URL>). Example body: `{"url":"https://apix402data.com/api/search","max_acceptable_usd":0.05,"deep_audit":false}`
- `POST /api/agent/preflight` (`$0.05`, x402 + Stripe MPP/Tempo) — Deep pre-flight target/contract verification. Example body: `{"target":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}`
- `POST /api/agent/reputation-mesh` (`$0.05`, x402 + Stripe MPP/Tempo) — Counterparty wallet/contract reputation & risk mesh. Example body: `{"address":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","chain":"base"}`
- `POST /api/agent/execution-firewall` (`$0.02`, x402 + Stripe MPP/Tempo) — Calldata & ERC-20 approval simulation firewall before signing. Example body: `{"to":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913","data":"0x095ea7b300000000000000000000000017ea1c2afc105d8e9c976ed65aa97c65cf5720f600000000000000000000000000000000000000000000000000000000000f4240","chain":"base"}`
- `POST /api/agent/mev-shield-check` (`$0.05`, x402 + Stripe MPP/Tempo) — MEV / sandwich-attack risk & slippage protection check. Example body: `{"chain":"base","swap_value_usd":25000.0,"slippage_tolerance_bps":50}`
- `POST /api/agent/gas-sponsor-check` (`$0.02`, x402 + Stripe MPP/Tempo) — Gas estimation & paymaster/sponsorability check. Example body: `{"chain":"base","estimated_gas_limit":180000}`
- `POST /api/agent/escrow-arbitration` (`$0.02`, x402 + Stripe MPP/Tempo) — Hash-committed task/delivery escrow verification. Example body: `{"task_spec_hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","delivery_payload_hash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}`

### Package 2: Public Company & Market Due-Diligence Pack
SEC EDGAR XBRL GAAP financials, cross-signal market convergence, protocol TVL/contract due diligence, and treasury portfolio audits.
- `POST /api/company` (`$0.002`, x402) — SEC EDGAR XBRL GAAP financials, filings & news; supports batch 'tickers' up to 5 (free pre-check: GET /api/company/check?ticker=<SYMBOL>). Example body: `{"ticker":"NVDA","include_news":true}`
- `POST /api/market/convergence-index` (`$0.03`, x402 + Stripe MPP/Tempo) — Cross-signal market convergence score across crypto, macro, and news. Example body: `{"seed":"USDC"}`

### Package 3: Solana, Multi-Chain RPC, Polymarket & DeFi High-Frequency Pack
Sub-10ms pre-warmed Solana priority fees, SPL token rug-checks, keyless multi-chain JSON-RPC, Polymarket odds/spreads, Base whale flows, and DeFi arb.
- `POST /api/rpc` (`$0.001`, x402) — Keyless multi-chain JSON-RPC proxy (Solana, Base, Ethereum, Arbitrum, Optimism). Example body: `{"chain":"solana","method":"getSlot","params":"[]"}`
- `POST /api/solana/priority-fee` (`$0.001`, x402) — Live Solana priority fee percentiles (p50/p75/p95) + Jito tip floor. Example body: `{}`
- `POST /api/solana/token-risk` (`$0.002`, x402) — Solana SPL / Token-2022 rug check (mint/freeze authority, top holders, DEX liquidity). Example body: `{"mint":"JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"}`
- `POST /api/solana/wallet-holdings` (`$0.002`, x402) — Keyless Solana SOL + SPL token portfolio & recent signatures. Example body: `{"wallet":"GThvpKNLrFQmxxdM9kTKJmwBvqjzdoJCckoMeZaDZiJ6"}`
- `POST /api/markets/polymarket` (`$0.002`, x402) — Live Polymarket 24h volume leaders, implied odds & bid/ask spreads. Example body: `{"limit":10}`
- `POST /api/social/farcaster-lookup` (`$0.002`, x402) — Keyless Base 0x wallet <-> Farcaster FID, followers & ENS lookup. Example body: `{"identity":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}`
- `POST /api/crypto/whale-flows` (`$0.003`, x402) — 24h Base L2 & cross-venue whale transfer & flow intelligence. Example body: `{"token":"USDC"}`
- `POST /api/crypto/news` (`$0.002`, x402) — Real-time crypto news & sentiment feed. Example body: `{"asset":"USDC","limit":5}`
- `POST /api/defi/arbitrage-radar` (`$0.005`, x402) — Cross-DEX arbitrage & spread detection. Example body: `{"asset":"WETH","chain":"base"}`
- `POST /api/defi/intent-routing` (`$0.003`, x402) — Optimal cross-chain bridge & intent route. Example body: `{"asset":"USDC","source_chain":"base","destination_chain":"arbitrum","amount_usd":25000.0}`
- `POST /api/defi/yield-matrix` (`$0.005`, x402) — Live DeFi yield & TVL matrix. Example body: `{"chain":"base"}`

### Package 4: Web Research, Clean Extraction & Session Pack
Live web/news search with field projection, SSRF-safe clean Markdown extraction for RAG, and 30-day prepaid session tunnels.
- `POST /api/search` (`$0.002`, x402) — Live web & news search JSON; supports 'fields' projection & 'queries' batch up to 5 (free pre-check: GET /api/search/check?q=<query>). Example body: `{"query":"Base x402 ecosystem adoption","limit":5,"fields":["title","url","snippet"]}`
- `POST /api/news` (`$0.002`, x402) — Structured news & sentiment intelligence (free pre-check: GET /api/news/check?category=<cat>&q=<query>). Example body: `{"topic":"artificial intelligence regulation","limit":5}`
- `POST /api/clean-url` (`$0.002`, x402) — SSRF-safe webpage-to-clean-Markdown extraction for RAG/LLMs (free pre-check: GET /api/clean-url/check?url=<URL>). Example body: `{"url":"https://www.sec.gov/edgar/searchedgar/companysearch"}`
- `POST /api/agent/session-open` (`$1.00`, x402 + Stripe MPP/Tempo) — Prepaid 30-day x402s_... Bearer session tunnel for high-frequency multi-step workflows. Example body: `{"payer_address":"0x02870E5A7B965404BF608630b0Cb90304675BecE","ttl_minutes":60}`

## 30-Second Copy-Paste Recipes (Top-Demanded Endpoints)

Most active & pre-warmed endpoints: `/api/rpc` (`$0.001`), `/api/solana/priority-fee` (`$0.001`), `/api/solana/token-risk` (`$0.002`), `/api/markets/polymarket` (`$0.002`), `/api/crypto/news` (`$0.002`), `/api/crypto/exploit-radar` (`$0.005`), and `/api/token/risk` (`$0.01`).

### 1. Try Free Right Now (No Wallet — 1 Free Try, Call #2 Rolls Over to Paid)
```bash
curl -s -X POST https://apix402data.com/api/free/markets/polymarket   -H "Content-Type: application/json"   -d '{"limit":5}'
```

### 2. Pre-Swap Guardrail in 1 Call (`x402` Python / LangChain / CrewAI)
```python
# pip install "x402[httpx]" eth-account
r = await http.post("https://apix402data.com/api/agent/execution-firewall",
    json={"chain": "base", "to": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "data": "0x313ce567"})
```

### 3. Batch SEC EDGAR Company Research (`$0.002 × N`)
```bash
# Paid via x402 or Bearer x402s_... session token from https://apix402data.com/pay
curl -s -X POST https://apix402data.com/api/company   -H "Content-Type: application/json" -H "Authorization: Bearer $X402_SESSION_TOKEN"   -d '{"tickers":["NVDA","COIN","MSTR"],"include_news":true}'
```

## MCP Streamable HTTP Quick Config
```json
{
  "mcpServers": {
    "apix402data": {
      "url": "https://apix402data.com/mcp",
      "type": "streamable-http",
      "payment": {"protocol": "x402", "network": "eip155:8453", "asset": "USDC"}
    }
  }
}
```
