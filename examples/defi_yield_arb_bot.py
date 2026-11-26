"""
DeFi yield & cross-chain arbitrage monitor example for apix402data.

Free preview (10 lifetime calls, no wallet):
  py defi_yield_arb_bot.py --free

Paid x402 mode (Base USDC, $0 ETH gas):
  set PRIVATE_KEY=0x...
  py defi_yield_arb_bot.py
"""
import argparse
import asyncio
import os
import httpx

BASE = "https://apix402data.com"


async def run(free: bool):
    prefix = "/api/free" if free else "/api"
    if free:
        async with httpx.AsyncClient(timeout=30) as http:
            r1 = await http.post(f"{BASE}{prefix}/defi/yield-matrix", json={"chain": "base"})
            r2 = await http.post(
                f"{BASE}{prefix}/workflow/cross-chain-arb-executor",
                json={"asset": "WETH", "source_chain": "base", "destination_chain": "arbitrum", "amount_usd": 10000.0},
            )
            print("yield-matrix:", r1.status_code, r1.json().get("top_opportunity_pool"))
            print("arb-executor:", r2.status_code, r2.json().get("spread_bps"))
        return

    from eth_account import Account
    from x402 import x402Client
    from x402.http.clients import x402_httpx_transport
    from x402.mechanisms.evm.exact import register_exact_evm_client

    client = x402Client()
    register_exact_evm_client(client, Account.from_key(os.environ["PRIVATE_KEY"]))
    async with httpx.AsyncClient(transport=x402_httpx_transport(client), timeout=60) as http:
        r1 = await http.post(f"{BASE}/api/defi/yield-matrix", json={"chain": "base"})
        r2 = await http.post(
            f"{BASE}/api/defi/arbitrage-radar",
            json={"asset": "WETH", "chain": "base"},
        )
        print("yield-matrix:", r1.status_code, r1.json().get("top_opportunity_pool"))
        print("arbitrage-radar:", r2.status_code, r2.json().get("best_spread_bps"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--free", action="store_true")
    args = ap.parse_args()
    asyncio.run(run(args.free))
