# mcp-bnr-ro

National Bank of Romania (Banca Naţională a României, BNR) FX reference rates MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Bnr Ro data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
