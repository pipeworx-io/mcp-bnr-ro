interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * National Bank of Romania (Banca Naţională a României, BNR) FX reference rates MCP. Keyless.
 *
 * BNR publishes daily reference exchange rates as XML. We fetch the XML as text and parse it
 * into clean JSON with regex (no XML libraries available in the Worker runtime).
 *
 * Rate semantics: every rate is expressed as RON (Romanian leu) per `multiplier` units of the
 * foreign currency. `multiplier` defaults to 1 and is present (e.g. 100) for currencies quoted
 * per 100 units, such as HUF, IDR, ISK, JPY, KRW. So the per-1-unit rate = value / multiplier.
 * Currencies are ISO 4217 codes; XAU is gold (per gram) and XDR is the IMF Special Drawing Right.
 */


const BASE = 'https://www.bnr.ro';
const UA = 'pipeworx-mcp-bnr-ro/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'exchange_rates',
    description:
      "Latest National Bank of Romania (BNR) official FX reference rates, parsed from BNR's daily XML feed. " +
      'Returns the reference date plus an array of currency rates. Each rate is RON (Romanian leu) per ' +
      '`multiplier` units of the currency (multiplier is 1 unless noted, e.g. 100 for HUF/JPY/KRW), so the ' +
      'per-1-unit rate = value / multiplier. Currencies are ISO 4217 codes (plus XAU gold, XDR SDR).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'exchange_rates_history',
    description:
      'Historical National Bank of Romania (BNR) official FX reference rates, parsed from XML. ' +
      'With no arguments (or period="10days") returns the last 10 published business days. ' +
      'Pass year=YYYY (e.g. 2024) to return every published day in that calendar year. ' +
      'Returns an array of daily entries, each { date, rates:[{currency, value, multiplier}] }. ' +
      'Each rate is RON per `multiplier` units of the currency; per-1-unit rate = value / multiplier. ' +
      'Currencies are ISO 4217 codes. Note the currency set can vary across dates.',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'Use "10days" for the last 10 business days (default). Ignored if year is set.' },
        year: { type: 'integer', description: 'Calendar year, e.g. 2024. Returns the full-year file for that year.' },
      },
    },
  },
];

interface Rate {
  currency: string;
  value: number;
  multiplier: number;
}
interface DailyCube {
  date: string;
  rates: Rate[];
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'exchange_rates': {
      const xml = await bnrGet('/nbrfxrates.xml');
      const cubes = parseCubes(xml);
      const latest = cubes[cubes.length - 1];
      if (!latest) throw new Error('BNR: no rate data found in feed.');
      return {
        source: 'National Bank of Romania (BNR)',
        base_currency: 'RON',
        publishing_date: parsePublishingDate(xml),
        note: 'Each rate is RON per `multiplier` units of the currency; per-1-unit rate = value / multiplier.',
        date: latest.date,
        rates: latest.rates,
      };
    }
    case 'exchange_rates_history': {
      const year = args.year;
      if (year != null) {
        const y = Number(year);
        if (!Number.isInteger(y) || y < 1990 || y > 2100) {
          throw new Error('Argument "year" must be a 4-digit calendar year, e.g. 2024.');
        }
        const xml = await bnrGet(`/files/xml/years/nbrfxrates${y}.xml`);
        return {
          source: 'National Bank of Romania (BNR)',
          base_currency: 'RON',
          note: 'Each rate is RON per `multiplier` units of the currency; per-1-unit rate = value / multiplier. Currency set can vary across dates.',
          year: y,
          days: parseCubes(xml),
        };
      }
      const xml = await bnrGet('/nbrfxrates10days.xml');
      return {
        source: 'National Bank of Romania (BNR)',
        base_currency: 'RON',
        note: 'Each rate is RON per `multiplier` units of the currency; per-1-unit rate = value / multiplier. Currency set can vary across dates.',
        period: '10days',
        days: parseCubes(xml),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function bnrGet(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/xml', 'User-Agent': UA } });
  const body = await res.text();
  if (!res.ok) throw new Error(`BNR: ${res.status} ${body.slice(0, 200)}`);
  return body;
}

/** Parse every <Cube date="..."> block and its <Rate currency="..." multiplier="..?">value</Rate> children. */
function parseCubes(xml: string): DailyCube[] {
  const cubes: DailyCube[] = [];
  const cubeRe = /<Cube\b[^>]*\bdate="([^"]+)"[^>]*>([\s\S]*?)<\/Cube>/g;
  let cubeMatch: RegExpExecArray | null;
  while ((cubeMatch = cubeRe.exec(xml)) !== null) {
    const date = cubeMatch[1];
    const rates: Rate[] = [];
    const rateRe = /<Rate\b([^>]*)>([^<]*)<\/Rate>/g;
    let rateMatch: RegExpExecArray | null;
    while ((rateMatch = rateRe.exec(cubeMatch[2])) !== null) {
      const attrs = rateMatch[1];
      const currency = /\bcurrency="([^"]+)"/.exec(attrs)?.[1];
      if (!currency) continue;
      const multAttr = /\bmultiplier="([^"]+)"/.exec(attrs)?.[1];
      const multiplier = multAttr ? Number(multAttr) : 1;
      const value = Number(rateMatch[2].trim());
      rates.push({ currency, value, multiplier: Number.isFinite(multiplier) ? multiplier : 1 });
    }
    cubes.push({ date, rates });
  }
  return cubes;
}

function parsePublishingDate(xml: string): string | undefined {
  return /<PublishingDate>([^<]+)<\/PublishingDate>/.exec(xml)?.[1]?.trim();
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
