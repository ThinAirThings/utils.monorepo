# Docs Scraper CLI

A TypeScript-based command-line tool that fetches documentation pages via Firecrawl and uses AI (GPT-4.1) to merge and summarize them into a single Markdown guide.

## Features

- Configuration-driven with [cosmiconfig] for TypeScript config files  
- Firecrawl API integration for reliable web scraping  
- AI summarization and structured output via [ai-sdk]  
- Type-safe CLI commands powered by [commander] and [@commander-js/extra-typings]  
- Outputs a single Markdown file documenting your library  

## Installation

```bash
# Clone the repo
git clone https://github.com/ThinAirThings/thinair-docs.git
cd thinair-docs

# Install dependencies
npm install
```

## Build & Run

### Build

Compile the TypeScript source:

```bash
npm run build
```

### Run (built)

```bash
node dist/cli.js <command>
```

### Run (using ts-node)

```bash
npx ts-node src/cli.ts <command>
```

A list of available commands can be found by running with the --help modifier

## Configuration

Create a `thinair.docs.config.ts` in your project root:

```ts
export default {
  docsLinks: [],
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4.1',
  },
  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY!,
  },
};
```

Create a `.env` file:

```bash
OPENAI_API_KEY=*****
FIRECRAWL_API_KEY=*****
```

## CLI Usage

```bash
# Show help
npx thinair-docs --help

# Run with default config path
npx thinair-docs

# Specify config file and output path
npx thinair-docs --config ./cursor.config.ts
```

## Examples Usage

```bash
# Using a custom config and output
npx thinair-docs get-packages # grabs all of the packages from your package manager
npx thinair-docs scrape # scrapes the docs of the packages and creates local synthesized versions
```

[cosmiconfig]: https://github.com/davidtheclark/cosmiconfig  
[firecrawl]: https://www.firecrawl.dev/  
[ai-sdk]: https://ai-sdk.dev/  
[commander]: https://github.com/tj/commander.js  
[@commander-js/extra-typings]: https://github.com/commander-js/extra-typings