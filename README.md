# apix402data MCP & x402 API

Remote **MCP Streamable HTTP** server and **HTTP 402** pay-per-call crypto, DeFi, EVM pre-flight, SEC EDGAR, news, and web-intelligence API (`46` paid tools + `10` free lifetime preview calls).

- **Remote MCP Endpoint:** `https://apix402data.com/mcp` (`14` non-overlapping flagship MCP tools)
- **Free Preview (10 lifetime calls via `/mcp` or REST):** `GET https://apix402data.com/api/free/status` & `POST https://apix402data.com/api/free/<tool_path>`
- **Card / Apple Pay Top-Up (Claude Web & Mobile):** `https://apix402data.com/pay` — mints an instant 30-day `session_token` (`x402s_...`) to pass in any MCP tool call or `Authorization: Bearer` header
- **OpenAPI 3.1 Spec:** `https://apix402data.com/openapi.json`
- **x402 / Bazaar Manifest:** `https://apix402data.com/.well-known/x402.json`
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

Top active endpoints: `/api/token/risk` (`$0.01`), `/api/company` (`$0.002`), `/api/clean-url` (`$0.002`), `/api/defi/yield-matrix` (`$0.03`), `/api/crypto/news` (`$0.002`), `/api/workflow/tx-guardian-suite` (`$0.04`).

```bash
# Try free right now (10 lifetime preview calls, no wallet required)
curl -s -X POST https://apix402data.com/api/free/token/risk \
  -H "Content-Type: application/json" \
  -d '{"address":"0x940181a94A35A4569E4529A3CDfB74e38FD98631","chain":"base"}'
```

## Tool Categories (`46` Paid Endpoints, `$0.002–$0.05` USDC on Base + Stripe MPP/Tempo)
- **Mega-Workflows (`v5.3`, 0% GPU):** `/api/workflow/tx-guardian-suite`, `/api/workflow/protocol-due-diligence`, `/api/workflow/defi-position-shield`, `/api/workflow/agent-treasury-audit`, `/api/workflow/cross-chain-arb-executor`
- **Agent Workflows & Bypass (`v5.2`):** `/api/bypass/sweep`, `/api/agent/ephemeral-key`, `/api/bypass/cross-execute`, `/api/guard/preflight-bypass`, `/api/execution/stealth-slice`, `/api/security/approval-purge`, `/api/rails/route-select`, `/api/workflow/state-gate`, `/api/trust/wallet-attest`, `/api/chain/nonce-unstick`
- **Token & Chain Data:** `/api/token/snapshot`, `/api/token/risk`, `/api/tx/decode`, `/api/chain/gas`, `/api/tokens/trending`, `/api/tokens/newest`, `/api/token/indicators`, `/api/onchain/prices`, `/api/chain/rpc-consensus`, `/api/allowance/check`
- **Crypto, DeFi & Security:** `/api/crypto/news`, `/api/crypto/whale-flows`, `/api/crypto/exploit-radar`, `/api/crypto/state-attestation`, `/api/crypto/zk-receipt-verify`, `/api/defi/yield-matrix`, `/api/defi/arbitrage-radar`, `/api/defi/intent-routing`, `/api/security/preflight-402`, `/api/agent/execution-firewall`, `/api/agent/mev-shield-check`, `/api/agent/reputation-mesh`
- **Web, News & SEC Research:** `/api/search`, `/api/news`, `/api/company`, `/api/clean-url`

## Payment Rails
- **x402 (Base USDC, EIP-3009):** `$0` buyer gas via Coinbase CDP facilitator
- **Stripe MPP:** Card payments for `>= $0.50` / session calls
- **Session Tunnel:** `POST /api/agent/session-open` (`$1.00` pre-funded bearer token)
