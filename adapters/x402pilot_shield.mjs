/**
 * x402Pilot 1-Line Wallet Guardrail Wrapper (JavaScript / Node >= 18)
 *
 * Wraps any `fetch` (including `@x402/fetch` or Coinbase AgentKit fetch) so every paid x402
 * call is pre-verified against x402Pilot's live Handshake Verifier & Bad-Actor Shield BEFORE
 * the wallet signs a USDC payment, enforcing your max budget and auto-reporting failures.
 *
 * Usage:
 *   import { withX402PilotFetch } from "apix402data-mcp/adapters/x402pilot_shield.mjs";
 *   const safeFetch = withX402PilotFetch(fetch, { maxBudgetUsd: 0.01 });
 *   const res = await safeFetch("https://some-x402-api.com/endpoint", { method: "POST", body: "{}" });
 */

const DEFAULT_BASE = "https://apix402data.com";

export function withX402PilotFetch(baseFetch = fetch, options = {}) {
  const pilotBase = String(options.pilotBaseUrl || DEFAULT_BASE).replace(/\/+$/, "");
  const maxBudgetUsd = Number(options.maxBudgetUsd ?? 0.05);
  const autoReportFailures = options.autoReportFailures !== false;

  return async function shieldedFetch(input, init = {}) {
    const targetUrl = typeof input === "string" ? input : input?.url;
    if (!targetUrl || !targetUrl.startsWith("https://")) {
      throw new Error(`x402Pilot Shield blocked non-HTTPS URL: ${targetUrl}`);
    }

    // 1. Free real-time pre-purchase handshake verification BEFORE wallet signing
    const vRes = await fetch(`${pilotBase}/api/discover/verify-handshake`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url: targetUrl, max_budget_usd: maxBudgetUsd }),
    });
    if (!vRes.ok) {
      throw new Error(`x402Pilot handshake check failed (HTTP ${vRes.status})`);
    }
    const verdict = await vRes.json();
    if (!verdict.safe_to_pay) {
      throw new Error(
        `x402Pilot Shield BLOCKED payment to ${targetUrl}: safety=${verdict.safety_status} within_budget=${verdict.within_budget} reason=${verdict.reason || "unverified"}`
      );
    }

    // 2. Execute the actual x402 call using the caller's payment-enabled fetch
    const resp = await baseFetch(input, init);

    // 3. Auto-report confirmed 5xx failures to protect the rest of the x402 network
    if (autoReportFailures && resp.status >= 500) {
      fetch(`${pilotBase}/api/discover/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, issue: `dead_http_${resp.status}` }),
      }).catch(() => {});
    }
    return resp;
  };
}
