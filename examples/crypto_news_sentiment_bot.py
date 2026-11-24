"""
Live crypto news & market convergence signal loop for apix402data.

Free preview (10 lifetime calls, no wallet):
  py crypto_news_sentiment_bot.py --free

Paid x402 mode (Base USDC, $0 ETH gas):
  set PRIVATE_KEY=0x...
  py crypto_news_sentiment_bot.py
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
            r1 = await http.post(f"{BASE}{prefix}/crypto/news", json={"asset": "USDC", "limit": 5})
            r2 = await http.post(f"{BASE}{prefix}/market/convergence-index", json={"seed": "USDC"})
            print("crypto/news:", r1.status_code, len(r1.json().get("results") or []), "articles")
            print("convergence:", r2.status_code, r2.json().get("implied_capital_flow"))
        return

    from eth_account import Account
    from x402 import x402Client
    from x402.http.clients import x402_httpx_transport
    from x402.mechanisms.evm.exact import register_exact_evm_client

    client = x402Client()
    register_exact_evm_client(client, Account.from_key(os.environ["PRIVATE_KEY"]))
    async with httpx.AsyncClient(transport=x402_httpx_transport(client), timeout=60) as http:
        r1 = await http.post(f"{BASE}/api/crypto/news", json={"asset": "USDC", "limit": 5})
        r2 = await http.post(f"{BASE}/api/market/convergence-index", json={"seed": "USDC"})
        print("crypto/news:", r1.status_code, len(r1.json().get("results") or []), "articles")
        print("convergence:", r2.status_code, r2.json().get("implied_capital_flow"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--free", action="store_true")
    args = ap.parse_args()
    asyncio.run(run(args.free))
