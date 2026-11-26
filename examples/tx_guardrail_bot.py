"""
Pre-swap Base token & calldata guardrail example for apix402data.

Free preview (10 lifetime calls, no wallet):
  py tx_guardrail_bot.py --free

Paid x402 mode (Base USDC, $0 ETH gas):
  set PRIVATE_KEY=0x...
  py tx_guardrail_bot.py
"""
import argparse
import asyncio
import os
import httpx

BASE = "https://apix402data.com"
TOKEN = "0x940181a94A35A4569E4529A3CDfB74e38FD98631"  # AERO on Base
TARGET_ROUTER = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
CALLDATA = "0x313ce567"


async def run(free: bool):
    if free:
        async with httpx.AsyncClient(timeout=30) as http:
            r1 = await http.post(f"{BASE}/api/free/token/risk", json={"address": TOKEN, "chain": "base"})
            r2 = await http.post(
                f"{BASE}/api/free/workflow/tx-guardian-suite",
                json={"chain": "base", "to": TARGET_ROUTER, "data": CALLDATA},
            )
            print("token/risk:", r1.status_code, r1.json().get("risk_band"))
            print("tx-guardian:", r2.status_code, r2.json().get("safe_to_sign_or_broadcast"))
        return

    from eth_account import Account
    from x402 import x402Client
    from x402.http.clients import x402_httpx_transport
    from x402.mechanisms.evm.exact import register_exact_evm_client

    client = x402Client()
    register_exact_evm_client(client, Account.from_key(os.environ["PRIVATE_KEY"]))
    async with httpx.AsyncClient(transport=x402_httpx_transport(client), timeout=60) as http:
        r1 = await http.post(f"{BASE}/api/token/risk", json={"address": TOKEN, "chain": "base"})
        r2 = await http.post(
            f"{BASE}/api/agent/execution-firewall",
            json={"chain": "base", "to": TARGET_ROUTER, "data": CALLDATA},
        )
        print("token/risk:", r1.status_code, r1.json().get("risk_band"))
        print("execution-firewall:", r2.status_code, r2.json().get("safe_to_execute"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--free", action="store_true")
    args = ap.parse_args()
    asyncio.run(run(args.free))
