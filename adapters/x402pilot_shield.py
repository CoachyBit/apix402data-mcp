"""
x402Pilot 1-Line Wallet Guardrail Wrapper (Python)

Wraps any httpx / x402HttpxClient call so every paid x402 request is pre-verified against
x402Pilot's live Handshake Verifier & Bad-Actor Shield BEFORE your wallet signs a USDC payment.

Usage:
    from x402pilot_shield import X402PilotShield
    shield = X402PilotShield(max_budget_usd=0.01)
    verdict = await shield.verify_before_pay("https://some-x402-api.com/endpoint")
    if verdict["safe_to_pay"]:
        resp = await x402_http.post("https://some-x402-api.com/endpoint", json={...})
"""
from __future__ import annotations

import httpx


class X402PilotShield:
    def __init__(self, max_budget_usd: float = 0.05, pilot_base_url: str = "https://apix402data.com"):
        self.max_budget_usd = float(max_budget_usd)
        self.pilot_base_url = pilot_base_url.rstrip("/")

    async def verify_before_pay(self, target_url: str, max_budget_usd: float | None = None) -> dict:
        """Free real-time pre-purchase handshake check (live 402 price, USDC rail, payTo & Bad-Actor Shield)."""
        budget = self.max_budget_usd if max_budget_usd is None else float(max_budget_usd)
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=False) as cl:
            r = await cl.post(
                f"{self.pilot_base_url}/api/discover/verify-handshake",
                json={"url": target_url, "max_budget_usd": budget},
            )
            r.raise_for_status()
            return r.json()

    async def shielded_post(self, x402_client, target_url: str, json_body: dict | None = None, max_budget_usd: float | None = None):
        """Verify live handshake + budget BEFORE executing a paid x402 POST; auto-reports 5xx to protect the network."""
        verdict = await self.verify_before_pay(target_url, max_budget_usd=max_budget_usd)
        if not verdict.get("safe_to_pay"):
            raise PermissionError(
                f"x402Pilot Shield blocked payment to {target_url}: "
                f"safety={verdict.get('safety_status')} within_budget={verdict.get('within_budget')} reason={verdict.get('reason')}"
            )
        resp = await x402_client.post(target_url, json=json_body or {})
        if resp.status_code >= 500:
            try:
                async with httpx.AsyncClient(timeout=5.0) as cl:
                    await cl.post(
                        f"{self.pilot_base_url}/api/discover/report",
                        json={"url": target_url, "issue": f"dead_http_{resp.status_code}"},
                    )
            except Exception:
                pass
        return resp
