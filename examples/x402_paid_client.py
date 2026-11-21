"""Paid x402 client quickstart for apix402data.com (Base USDC, $0 buyer gas via EIP-3009)."""

import asyncio
import os
import httpx
from eth_account import Account
from x402 import x402Client
from x402.http import x402HTTPClient
from x402.mechanisms.evm.exact import register_exact_evm_client


async def main():
    private_key = os.environ["EVM_PRIVATE_KEY"]  # Fund with Base USDC ($0 ETH needed)
    acct = Account.from_key(private_key)
    xc = x402Client()
    register_exact_evm_client(xc, acct)
    hc = x402HTTPClient(xc)

    url = "https://apix402data.com/api/guard/preflight-bypass"
    body = {
        "chain": "base",
        "from": acct.address,
        "to": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "data": "0x313ce567",
    }

    async with httpx.AsyncClient(timeout=30.0) as cl:
        r1 = await cl.post(url, json=body)
        if r1.status_code != 402:
            print(r1.status_code, r1.json())
            return
        req = hc.get_payment_required_response(lambda k: r1.headers.get(k), r1.content)
        payload = await hc.create_payment_payload(req)
        hdrs = hc.encode_payment_signature_header(payload)
        r2 = await cl.post(url, json=body, headers=hdrs)
        print("HTTP", r2.status_code, r2.json())


if __name__ == "__main__":
    asyncio.run(main())
