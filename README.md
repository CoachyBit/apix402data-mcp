<div align="center">

# x402Pilot (`apix402data-mcp`)

### The Trust, Discovery Transport & Execution Layer for the x402 Ecosystem

[![Website](https://img.shields.io/badge/Website-apix402data.com-0ea5e9?style=for-the-badge)](https://apix402data.com)
[![Live Radar](https://img.shields.io/badge/Live%20Radar-66%2C800%2B%20Verified%20APIs-10b981?style=for-the-badge)](https://apix402data.com/live)
[![Dead Registry](https://img.shields.io/badge/Graveyard-4%2C180%2B%20Blocked-ef4444?style=for-the-badge)](https://apix402data.com/dead)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-75%20Endpoints-6366f1?style=for-the-badge)](https://apix402data.com/openapi.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](./LICENSE)

**Website:** [https://apix402data.com](https://apix402data.com) &nbsp;·&nbsp; **MCP Endpoint:** `https://apix402data.com/mcp` &nbsp;·&nbsp; **JWKS:** [`/.well-known/x402pilot-jwks.json`](https://apix402data.com/.well-known/x402pilot-jwks.json) &nbsp;·&nbsp; **Support:** [support@apix402data.com](mailto:support@apix402data.com)

</div>

---

## Why x402Pilot? — Discovery Transport & Purchase Protection First

The x402 ecosystem now spans **120,000+ catalog listings** across Coinbase CDP Bazaar and PayAI — including offline servers, stale schemas, price-baiting endpoints, and drainer traps.

**x402Pilot** is the **discovery transport, trust oracle, and guarded execution layer** that sits between your AI agent's wallet and the open x402 network:

| Core Infrastructure Moat | What It Does | Endpoint / Transport |
|---|---|---|
| **Active Ecosystem Discovery** | Searches **66,800+ live quality-verified x402 endpoints** (A+ to F grades, `<50ms` inverted index, 1-shot `sample_request` blueprints, `fallback_chain`, `% below median` savings) | `POST /api/discover` (`5 free / 24h UTC`, then `$0.0015`) |
| **Offline-Verifiable Ed25519 Attestations** | Every discovery result, handshake check, and execution receipt is cryptographically signed with our public Ed25519 key | `GET /.well-known/x402pilot-jwks.json` (Free) |
| **1-Line Wallet Purchase Protection Shield** | Drop-in JS/Python wrapper that blocks dead, price-baiting, or quarantined endpoints **before** your agent signs a USDC payment | `import { createShieldedFetch } from 'apix402data-mcp/shield'` |
| **1-Call Pilot Execute + Spend Policies** | OpenRouter + Brex for x402: discover → enforce per-call/daily USD caps, min grade (`A+`–`C`), & host allowlists → execute → signed CSV/JSON receipts | `POST /api/pilot/execute`, `/api/agent/session-policy`, `/api/agent/session-receipts` |
| **30/90/365-Day Reputation History** | Historical daily uptime, latency, price & grade time-series across the x402 ecosystem + live State of x402 Market Report | `GET /api/discover/history`, `GET /api/discover/market-report` (Free) |
| **Graveyard & Seller Downtime Alerts** | Public quarantined registry of **4,180+ offline & invalid APIs** + instant HTTPS webhook alerts if your seller endpoint drops | `GET /api/discover/dead`, `POST /api/discover/alerts/subscribe` (Free) |

---

## Quick Start (Zero API Keys Required)

### 1. Streamable HTTP MCP (Claude, ChatGPT, Cursor, Windsurf, OpenClaw)

Connect directly to our hosted Streamable HTTP MCP transport — **zero local setup**:

```json
{
  "mcpServers": {
    "x402pilot": {
      "url": "https://apix402data.com/mcp"
    }
  }
}
```

### 2. Local CLI / Stdio Transport (`npx`)

```bash
# Start the x402Pilot MCP stdio bridge
npx -y apix402data-mcp

# Or run the x402Pilot Discovery & Smart Router CLI
npx -y x402pilot
```

### 3. 1-Line Purchase Protection Shield (Node.js & Python)

Wrap any x402 wallet `fetch` call so your agent **never pays a dead, hijacked, or price-baiting endpoint**:

```js
import { createShieldedFetch } from "apix402data-mcp/shield";

const safeFetch = createShieldedFetch(fetch, {
  maxPriceUsd: 0.05,
  minGrade: "B",
  verifySignature: true, // Offline Ed25519 JWKS verification
});

const res = await safeFetch("https://some-x402-seller.example/api/data");
```

### 4. Try Live Discovery Right Now (5 Free Searches Every 24h UTC)

```bash
curl -s -X POST https://apix402data.com/api/free/discover \
  -H "Content-Type: application/json" \
  -d '{"query":"crypto news","limit":5}'
```

### 5. 1-Call Pilot Execute with Brex-Style Spend Policy

```bash
# Lock a prompt-injection-proof spend policy on your x402s_ session
curl -s -X POST https://apix402data.com/api/agent/session-policy \
  -H "Authorization: Bearer x402s_YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"max_per_call_usd":0.02,"daily_cap_usd":1.00,"min_grade":"A","locked":true}'

# Discover + verify + execute in one call with an Ed25519 receipt
curl -s -X POST https://apix402data.com/api/pilot/execute \
  -H "Authorization: Bearer x402s_YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"query":"base gas prices","method":"GET"}'
```

---

## Complete 75-Endpoint API Catalog

Every paid endpoint supports **HTTP 402** (Solana SPL USDC via PayAI & Base ERC-20 USDC via Coinbase CDP with `$0` buyer gas), **Stripe MPP**, and **prepaid `x402s_` session tokens** ([apix402data.com/pay](https://apix402data.com/pay)) — plus **5 free discovery calls / 24h UTC** and **1 free preview** on paid tools via `/api/free/<path>`.

### 1. x402Pilot Discovery Transport, Trust & Execution (Core)
| Endpoint | Price | Description |
|---|---|---|
| `POST /api/discover` | `$0.0015` *(5 free/24h)* | Health-probed, 5-pillar quality-verified x402 ecosystem search (`66,800+` live endpoints) |
| `POST /api/pilot/execute` | Session | 1-call OpenRouter-style x402 discover → policy check → execute → Ed25519 receipt |
| `GET/POST /api/agent/session-policy` | Free | Programmable Brex-style spend caps, min grade (`A+`–`C`), host allowlist & `locked: true` |
| `GET /api/agent/session-receipts` | Free | Export itemized Ed25519-attested spend receipts (JSON or formula-safe CSV) |
| `POST /api/agent/session-open` | `$1.00` | Open a pre-funded `$1.00` agent session tunnel returning an HMAC `x402s_` bearer token |
| `GET /api/agent/session-status` | Free | Check prepaid `x402s_` session balance and expiry |
| `POST /api/discover/verify-handshake` | Free | Real-time pre-purchase 402 handshake verifier + signed Ed25519 attestation |
| `GET /api/discover/history` | Free | 30/90/365-day historical uptime, latency, price & grade time-series |
| `GET /api/discover/market-report` | Free | Live State of x402 ecosystem report (alive/offline rates, bad actors, price medians) |
| `GET /api/discover/dead` | Free | Verified graveyard registry of dead, 404/5xx, timed-out & quarantined endpoints |
| `POST /api/discover/submit` | Free | Free x402 seller submission (any facilitator/chain) — probed & graded immediately |
| `POST /api/discover/alerts/subscribe` | Free | Free seller downtime & grade-drop HTTPS webhook alerts |
| `POST /api/discover/report` | Free | Report a failed, price-baiting, or malicious x402 endpoint for immediate re-probe |
| `GET /.well-known/x402pilot-jwks.json` | Free | Public Ed25519 JWKS for offline cryptographic verification |

### 2. Solana, Multi-Chain RPC, Polymarket & Smart LLM Routing
| Endpoint | Price | Description |
|---|---|---|
| `POST /api/rpc` | `$0.001` | Keyless multi-chain JSON-RPC proxy (Solana, Base, Ethereum, Arbitrum, Optimism) |
| `POST /api/solana/priority-fee` | `$0.001` | Live Solana priority fee percentiles (`p50`/`p75`/`p95`) + Jito tip floor |
| `POST /api/solana/token-risk` | `$0.002` | Solana SPL / Token-2022 rug check: mint/freeze authority, top holders & liquidity |
| `POST /api/solana/wallet-holdings` | `$0.002` | Keyless Solana SOL + SPL token portfolio, USD valuation & recent activity |
| `POST /api/markets/polymarket` | `$0.002` | Live Polymarket active markets, 24h volume leaders, odds & bid/ask spreads |
| `POST /api/social/farcaster-lookup` | `$0.002` | Keyless Base `0x` wallet ↔ Farcaster FID, username, followers & ENS lookup |
| `POST /api/llm/chat` | `$0.002` | Frontier LLM router (OpenRouter + dual-GPU local failover) |
| `POST /api/router/route` | `$0.002` | All-in-one x402 smart LLM + live Solana/Polymarket context router |
| `POST /v1/chat/completions` | `$0.002` | OpenAI-compatible smart router with auto complexity scoring |

### 3. On-Chain Token, Gas, DEX & Transaction Intelligence
| Endpoint | Price | Description |
|---|---|---|
| `POST /api/chain/gas` | `$0.002` | Multi-chain gas prices & USD action costs with cheapest-chain recommendation |
| `POST /api/chain/rpc-consensus` | `$0.002` | Cross-check block height & latency across public RPCs to detect stale nodes |
| `POST /api/allowance/check` | `$0.002` | ERC-20 token balance & spender allowance check on-chain |
| `POST /api/tokens/trending` | `$0.002` | Trending DEX pools by network with liquidity filtering |
| `POST /api/tokens/newest` | `$0.002` | Newly launched DEX pools filtered by chain & liquidity |
| `POST /api/onchain/prices` | `$0.003` | Batched multi-token on-chain price & spread lookup in one call |
| `POST /api/token/snapshot` | `$0.003` | Live token price, liquidity, FDV, volume & order flow |
| `POST /api/token/indicators` | `$0.005` | Computed VWAP, RSI(14), EMA(9/21), MACD & volatility from live pools |
| `POST /api/tx/decode` | `$0.005` | Decode any EVM transaction into structured fields + plain-English explanation |
| `POST /api/token/risk` | `$0.010` | On-chain EVM token contract risk scan & safety verdict |

### 4. Agent Security Firewalls, DeFi & Cryptographic Verification
| Endpoint | Price | Description |
|---|---|---|
| `POST /api/security/preflight-402` | `$0.002` | Pre-flight x402 security firewall: unpaid probe, spend-cap & prompt-injection audit |
| `POST /api/crypto/news` | `$0.002` | Crypto news with per-article sentiment, tickers & aggregate mood |
| `POST /api/crypto/whale-flows` | `$0.003` | 24h whale wallet & institutional treasury flows on Base & Ethereum |
| `POST /api/defi/intent-routing` | `$0.003` | Cross-chain intent settlement & route scoring across L2s and Ethereum |
| `POST /api/crypto/exploit-radar` | `$0.005` | Smart contract exploit & drainer telemetry inspecting bytecode & 48h feeds |
| `POST /api/defi/yield-matrix` | `$0.005` | Cross-chain real-yield DeFi pool rankings (`TVL >= $5M`) |
| `POST /api/defi/arbitrage-radar` | `$0.005` | Cross-chain DEX price dispersion & yield-carry arbitrage telemetry |
| `POST /api/agent/execution-firewall` | `$0.020` | Pre-execution EVM calldata firewall with `eth_call` dry-run & infinite-approval detection |
| `POST /api/agent/gas-sponsor-check` | `$0.020` | EIP-4337 Paymaster & gas-sponsorship eligibility telemetry |
| `POST /api/agent/escrow-arbitration` | `$0.020` | Deterministic & AI-synthesized dispute resolution & SLA verification |
| `POST /api/market/convergence-index` | `$0.030` | Social/news momentum vs. on-chain capital flow & SEC financial convergence |
| `POST /api/agent/preflight` | `$0.050` | Real-time risk, regulatory & compliance pre-flight checks for autonomous agents |
| `POST /api/agent/reputation-mesh` | `$0.050` | Counterparty & agent wallet reputation mesh across on-chain & x402 settlement history |
| `POST /api/agent/mev-shield-check` | `$0.050` | Pre-submission MEV, sandwich-attack & private-RPC relay telemetry |
| `POST /api/crypto/state-attestation` | `$0.050` | Verifiable state-commitment cache anchored to live EVM RPC block hashes |
| `POST /api/crypto/zk-receipt-verify` | `$0.050` | Structural, hash-commitment & Merkle/EIP-712 proof-envelope verification |

### 5. Autonomous Execution Workflows & Bypass Primitives
| Endpoint | Price | Description |
|---|---|---|
| `POST /api/bypass/sweep` | `$0.005` | Autonomous dust & multi-token balance sweep planner |
| `POST /api/bypass/cross-execute` | `$0.005` | Cross-chain execution & bridge-route coordinator |
| `POST /api/chain/nonce-unstick` | `$0.005` | Pending EVM nonce collision & gas-bump replacement builder |
| `POST /api/rails/route-select` | `$0.005` | Optimal payment rail selector (Solana PayAI vs. Base CDP vs. Stripe MPP) |
| `POST /api/agent/ephemeral-key` | `$0.010` | Scoped ephemeral session-key policy generator |
| `POST /api/execution/stealth-slice` | `$0.010` | TWAP / stealth order-slicing execution schedule |
| `POST /api/guard/preflight-bypass` | `$0.010` | Pre-flight guard & fallback bypass verifier |
| `POST /api/security/approval-purge` | `$0.010` | High-risk ERC-20 unlimited approval revocation builder |
| `POST /api/trust/wallet-attest` | `$0.010` | Wallet counterparty trust attestation |
| `POST /api/workflow/state-gate` | `$0.010` | Conditional on-chain state-gate trigger |

### 6. Web, News & SEC EDGAR Research (+ Free Pre-Check Endpoints)
| Endpoint | Price | Description |
|---|---|---|
| `POST /api/search` | `$0.002` | Web search enrichment with relevance scoring, NER & sentiment |
| `POST /api/news` | `$0.002` | Real-time news aggregation with NER, sentiment & topic classification |
| `POST /api/company` | `$0.002` | SEC EDGAR company intelligence with filings, CIK & news sentiment |
| `POST /api/clean-url` | `$0.002` | Clean Markdown URL extraction with optional summarization & NER |
| `GET /api/*/check` & `/api/free/status` | Free | Free pre-flight validation & quota checks (`/search/check`, `/news/check`, `/company/check`, `/clean-url/check`, `/security/preflight-402/check`, `/free/status`) |
| `GET /health`, `/pricing`, `/openapi.json`, `/llms.txt`, `/.well-known/mcp.json`, `/mcp_manifest.json` | Free | Health telemetry, pricing, OpenAPI 3.1 spec & AI discovery manifests |

---

## Links & Support

- **Website & Interactive Discovery:** [https://apix402data.com](https://apix402data.com)
- **Live Network Radar:** [https://apix402data.com/live](https://apix402data.com/live)
- **Dead & Blocked Endpoint Graveyard:** [https://apix402data.com/dead](https://apix402data.com/dead)
- **OpenAPI 3.1 Spec:** [https://apix402data.com/openapi.json](https://apix402data.com/openapi.json)
- **Support Email:** [support@apix402data.com](mailto:support@apix402data.com)
- **Support / Privacy / Terms:** [apix402data.com/support](https://apix402data.com/support) · [Privacy](https://apix402data.com/privacy) · [Terms](https://apix402data.com/terms)
- **GitHub Issues:** [github.com/CoachyBit/apix402data-mcp/issues](https://github.com/CoachyBit/apix402data-mcp/issues)
