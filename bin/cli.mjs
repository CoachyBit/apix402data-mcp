#!/usr/bin/env node
import readline from "node:readline";

const MCP_URL = process.env.APIX402_MCP_URL || "https://apix402data.com/mcp";
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (process.env.X402_PAYMENT_SIGNATURE) {
      headers["PAYMENT-SIGNATURE"] = process.env.X402_PAYMENT_SIGNATURE;
    }
    const res = await fetch(MCP_URL, { method: "POST", headers, body: trimmed });
    const text = await res.text();
    if (text) process.stdout.write(text.trim() + "\n");
  } catch (err) {
    process.stderr.write(`apix402data-mcp error: ${err?.message || err}\n`);
  }
});
