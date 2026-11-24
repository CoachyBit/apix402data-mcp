"""
SEC EDGAR financials & clean Markdown RAG pipeline for apix402data.

Free preview (10 lifetime calls, no wallet):
  py sec_edgar_rag_pipeline.py --free

Paid x402 mode (Base USDC, $0 ETH gas):
  set PRIVATE_KEY=0x...
  py sec_edgar_rag_pipeline.py
"""
import argparse
import asyncio
import os
import httpx

BASE = "https://apix402data.com"
SEC_URL = "https://www.sec.gov/edgar/searchedgar/companysearch"


async def run(free: bool):
    prefix = "/api/free" if free else "/api"
    if free:
        async with httpx.AsyncClient(timeout=30) as http:
            r1 = await http.post(f"{BASE}{prefix}/company", json={"ticker": "NVDA", "include_news": True})
            r2 = await http.post(f"{BASE}{prefix}/clean-url", json={"url": SEC_URL})
            print("company:", r1.status_code, r1.json().get("company_name"))
            print("clean-url:", r2.status_code, len(r2.json().get("markdown") or ""), "chars")
        return

    from eth_account import Account
    from x402 import x402Client
    from x402.http.clients import x402_httpx_transport
    from x402.mechanisms.evm.exact import register_exact_evm_client

    client = x402Client()
    register_exact_evm_client(client, Account.from_key(os.environ["PRIVATE_KEY"]))
    async with httpx.AsyncClient(transport=x402_httpx_transport(client), timeout=60) as http:
        r1 = await http.post(f"{BASE}/api/company", json={"ticker": "NVDA", "include_news": True})
        r2 = await http.post(f"{BASE}/api/clean-url", json={"url": SEC_URL})
        print("company:", r1.status_code, r1.json().get("company_name"))
        print("clean-url:", r2.status_code, len(r2.json().get("markdown") or ""), "chars")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--free", action="store_true")
    args = ap.parse_args()
    asyncio.run(run(args.free))
