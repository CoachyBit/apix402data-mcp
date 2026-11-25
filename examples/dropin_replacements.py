"""1-Line Drop-In Replacements for CoinGecko x402, Firecrawl, Exa & OpenAI.

Swap your base URL to https://apix402data.com (40%-80% cheaper, USDC on Base via x402).
Requires: pip install httpx eth-account x402
"""
import asyncio
import json
import os
import httpx
from eth_account import Account
from x402 import x402Client
from x402.http import x402HTTPClient
from x402.mechanisms.evm.exact import register_exact_evm_client

BASE = "https://apix402data.com"


async def paid_call(hc: x402HTTPClient, method: str, path: str, body: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as cl:
        r1 = await (cl.get(f"{BASE}{path}") if method == "GET" else cl.post(f"{BASE}{path}", json=body))
        if r1.status_code != 402:
            r1.raise_for_status()
            return r1.json()
        req = hc.get_payment_required_response(lambda n: r1.headers.get(n), r1.content)
        payload = await hc.create_payment_payload(req)
        hdrs = hc.encode_payment_signature_header(payload)
        r2 = await (cl.get(f"{BASE}{path}", headers=hdrs) if method == "GET" else cl.post(f"{BASE}{path}", json=body, headers=hdrs))
        r2.raise_for_status()
        return r2.json()


async def main():
    acct = Account.from_key(os.environ["X402_PRIVATE_KEY"])
    client = x402Client()
    register_exact_evm_client(client, acct)
    hc = x402HTTPClient(client)

    # 1. CoinGecko x402 drop-in ($0.003 vs $0.005)
    prices = await paid_call(
        hc, "GET",
        "/api/v3/x402/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true",
    )
    print("CoinGecko drop-in:", json.dumps(prices, indent=2))

    # 2. Firecrawl drop-in ($0.002 vs $0.01)
    scraped = await paid_call(hc, "POST", "/v1/scrape", {"url": "https://www.sec.gov/edgar/searchedgar/companysearch"})
    print("Firecrawl drop-in markdown chars:", len(scraped["data"]["markdown"]))

    # 3. Exa drop-in ($0.002 vs $0.004-$0.007)
    search = await paid_call(hc, "POST", "/v1/search", {"query": "Base x402 adoption", "numResults": 5})
    print("Exa drop-in results:", len(search["results"]))

    # 4. OpenAI drop-in ($0.0018)
    chat = await paid_call(hc, "POST", "/v1/chat/completions", {
        "model": "x402-auto",
        "messages": [{"role": "user", "content": "What is Base L2? Reply in 1 sentence."}],
    })
    print("OpenAI drop-in:", chat["choices"][0]["message"]["content"])


if __name__ == "__main__":
    asyncio.run(main())
