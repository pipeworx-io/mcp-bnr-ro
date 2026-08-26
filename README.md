# mcp-bnr-ro

National Bank of Romania (Banca Naţională a României, BNR) FX reference rates MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `bnr_exchange_rates` | Latest National Bank of Romania (BNR) official FX reference rates, parsed from BNR's daily XML feed. Returns the reference date plus an array of currency rates. Each rate is RON (Romanian leu) per `multiplier` units of the currency (multiplier is 1 unless noted, e.g. 100 for HUF/JPY/KRW), so the per-1-unit rate = value / multiplier. Currencies are ISO 4217 codes (plus XAU gold, XDR SDR). |
| `bnr_exchange_rates_history` | Historical National Bank of Romania (BNR) official FX reference rates, parsed from XML. With no arguments (or period="10days") returns the last 10 published business days. Pass year=YYYY (e.g. 2024) to return every published day in that calendar year. Returns an array of daily entries, each { date, rates:[{currency, value, multiplier}] }. Each rate is RON per `multiplier` units of the currency; per-1-unit rate = value / multiplier. Currencies are ISO 4217 codes. Note the currency set can vary across dates. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "bnr-ro": {
      "url": "https://gateway.pipeworx.io/bnr-ro/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/bnr-ro/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Bnr Ro data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
