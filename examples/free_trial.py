"""Quickstart: test apix402data.com using the 10-call free trial (no wallet required)."""

import httpx

BASE = "https://apix402data.com"

status = httpx.get(f"{BASE}/api/free/status", timeout=15.0).json()
print("Free trial status:", status["used"], "/", status["limit"], "remaining:", status["remaining"])

resp = httpx.post(
    f"{BASE}/api/free/chain/gas",
    json={"action": "swap USDC to ETH"},
    timeout=20.0,
)
print("HTTP", resp.status_code, resp.json())
