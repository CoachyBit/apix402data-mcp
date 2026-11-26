"""
apix402data 1-File Open-Source Solana + Polymarket Loop Scanner (Zero API Keys)

Polls pre-warmed (<10ms) Solana priority fees, SPL token rug-checks, and Polymarket
24h volume / bid-ask spread movers via x402 (Solana USDC or Base USDC) or free preview.

Usage:
  # Free 10-call preview (no wallet needed):
  python solana_polymarket_scanner.py --free --once

  # Continuous 15s loop with Base or Solana x402 wallet / session token:
  export X402_SESSION_TOKEN="x402s_..."   # or mint at https://apix402data.com/pay
  python solana_polymarket_scanner.py --interval 15 --mint JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN
"""
from __future__ import annotations

import argparse
import os
import time
import urllib.request
import json

BASE_URL = os.getenv("APIX402_BASE_URL", "https://apix402data.com").rstrip("/")


def call_api(path: str, payload: dict, free: bool = False, session_token: str = "") -> tuple[int, dict, int]:
    ep = f"/api/free/{path.removeprefix('/api/')}" if free else path
    headers = {"Content-Type": "application/json", "User-Agent": "apix402-scanner/1.0"}
    if session_token and not free:
        headers["Authorization"] = f"Bearer {session_token}"
    req = urllib.request.Request(
        f"{BASE_URL}{ep}",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            ms = int((time.perf_counter() - t0) * 1000)
            return resp.status, json.loads(resp.read().decode("utf-8")), ms
    except urllib.error.HTTPError as e:
        ms = int((time.perf_counter() - t0) * 1000)
        body = {}
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            pass
        return e.code, body, ms


def run_cycle(mint: str, free: bool, session_token: str) -> None:
    st1, fee, ms1 = call_api("/api/solana/priority-fee", {}, free=free, session_token=session_token)
    st2, risk, ms2 = call_api("/api/solana/token-risk", {"mint": mint}, free=free, session_token=session_token)
    st3, poly, ms3 = call_api("/api/markets/polymarket", {"limit": 5}, free=free, session_token=session_token)

    print(f"\n=== apix402data Live Scan ({time.strftime('%H:%M:%S')}) ===")
    if st1 == 200:
        pf = fee.get("priority_fee_microlamports") or {}
        print(f"[Solana Fee {ms1}ms] slot={fee.get('slot')} congestion={fee.get('congestion_level')} p50={pf.get('p50')} p75={pf.get('p75')} p95={pf.get('p95')} uL")
    else:
        print(f"[Solana Fee {st1} {ms1}ms] {fee.get('error', 'payment_required')}")

    if st2 == 200:
        mkt = risk.get("market") or {}
        print(f"[SPL Risk  {ms2}ms] {risk.get('symbol') or mint[:8]} score={risk.get('risk_score')}/100 ({risk.get('risk_band')}) safe={risk.get('safe_to_trade')} liq=${mkt.get('liquidity_usd', 0):,.0f}")
    else:
        print(f"[SPL Risk  {st2} {ms2}ms] {risk.get('error', 'payment_required')}")

    if st3 == 200:
        print(f"[Polymarket {ms3}ms] Top {poly.get('count', 0)} 24h Volume Movers:")
        for m in (poly.get("markets") or [])[:5]:
            print(f"  - ${m.get('volume_24h_usd', 0):>10,.0f} | spread={m.get('spread_bps')}bps | {m.get('question', '')[:72]}")
    else:
        print(f"[Polymarket {st3} {ms3}ms] {poly.get('error', 'payment_required')}")


def main() -> None:
    ap = argparse.ArgumentParser(description="apix402data Solana + Polymarket live loop scanner")
    ap.add_argument("--free", action="store_true", help="Use free 10-call /api/free/* preview")
    ap.add_argument("--once", action="store_true", help="Run a single cycle and exit")
    ap.add_argument("--interval", type=int, default=15, help="Loop interval in seconds (default 15)")
    ap.add_argument("--mint", default="JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", help="Solana SPL mint to monitor")
    args = ap.parse_args()
    tok = os.getenv("X402_SESSION_TOKEN", "").strip()

    while True:
        run_cycle(args.mint, args.free, tok)
        if args.once:
            break
        time.sleep(max(5, args.interval))


if __name__ == "__main__":
    main()
