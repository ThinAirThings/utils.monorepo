export default {
  docsLinks: ["https://metrobundler.dev/docs/configuration/"],
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4.1',
  },
  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY!,
    LIMIT: 35, // Default scrape limit
    DEPTH: 2, // Default scrape depth
  },
};