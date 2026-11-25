"""
LangChain / LangGraph drop-in tools for apix402data.com (40%-80% cheaper than Exa/Firecrawl/CoinGecko).

Usage:
    from adapters.langchain_tools import get_langchain_tools
    tools = get_langchain_tools(session_token="x402s_...")  # or set X402_SESSION_TOKEN env
"""
from __future__ import annotations
import json
import os
import urllib.request
from typing import Any

BASE_URL = os.getenv("APIX402_BASE_URL", "https://apix402data.com").rstrip("/")


def _call_apix402(path: str, payload: dict[str, Any] | None = None, session_token: str | None = None) -> dict[str, Any]:
    tok = session_token or os.getenv("X402_SESSION_TOKEN", "").strip()
    headers = {"Content-Type": "application/json", "User-Agent": "apix402data-langchain/1.0"}
    if tok:
        headers["Authorization"] = f"Bearer {tok}"
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(payload or {}).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def apix402_search(query: str, num_results: int = 5, session_token: str | None = None) -> dict[str, Any]:
    """Live web & news search ($0.002/call, Exa-compatible)."""
    return _call_apix402("/v1/x402/search", {"query": query, "numResults": num_results}, session_token)


def apix402_scrape(url: str, session_token: str | None = None) -> dict[str, Any]:
    """Scrape any public HTTPS URL into clean LLM Markdown ($0.002/call, Firecrawl-compatible)."""
    return _call_apix402("/v1/x402/scrape", {"url": url}, session_token)


def apix402_token_prices(ids: str = "bitcoin,ethereum,solana", vs_currencies: str = "usd", session_token: str | None = None) -> dict[str, Any]:
    """Live crypto spot prices + 24h stats ($0.003/call, CoinGecko-compatible)."""
    return _call_apix402("/api/v3/x402/simple/price", {"ids": ids, "vs_currencies": vs_currencies, "include_24hr_change": True}, session_token)


def apix402_defi_yields(chain: str = "base", session_token: str | None = None) -> dict[str, Any]:
    """Risk-adjusted DeFi yield matrix across Base/ETH/Arbitrum/Solana ($0.25/call)."""
    return _call_apix402("/api/defi/yield-matrix", {"chain": chain}, session_token)


def apix402_token_risk(address: str, chain: str = "base", session_token: str | None = None) -> dict[str, Any]:
    """Smart-contract & DEX liquidity rug-risk telemetry ($0.01/call)."""
    return _call_apix402("/api/token/risk", {"address": address, "chain": chain}, session_token)


def get_langchain_tools(session_token: str | None = None) -> list[Any]:
    """Return LangChain StructuredTool instances if langchain_core is installed, else raw callables."""
    fns = [apix402_search, apix402_scrape, apix402_token_prices, apix402_defi_yields, apix402_token_risk]
    try:
        from langchain_core.tools import StructuredTool
    except ImportError:
        return fns
    return [
        StructuredTool.from_function(
            func=lambda fn=f, **kw: fn(**kw, session_token=session_token),
            name=f.__name__,
            description=(f.__doc__ or f.__name__).strip(),
        )
        for f in fns
    ]
