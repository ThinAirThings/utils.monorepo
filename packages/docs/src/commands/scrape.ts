import { Command } from 'commander'
import { cosmiconfigSync } from 'cosmiconfig'

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai'; // Ensure OPENAI_API_KEY environment variable is set
import FirecrawlApp from '@mendable/firecrawl-js';

import fs from 'fs/promises'
import path from 'path'

export interface ScrapeConfig {
  links: string[]
  output?: string
}

const SYSTEM_PROMPT = `You are a coding assistant that reads official documentation for programming libraries and explains how to use them clearly and practically.
Given the documentation for a library, extract and present the following:
Overview: A high-level summary of what the library does and its main use cases.
Installation: How to install or import the library in a project.
Basic Usage: The simplest example(s) of how to use the library, including minimal setup.
Core Functions / Classes: A list of the most commonly used APIs (functions, classes, methods), each with:
A one-sentence summary
As many code examples (spanning over diverse topics) as possible but no more than 10, with comments explaining key parts
Advanced Features (optional): A summary of any advanced capabilities (e.g., plugins, extensions, configuration).
Common Pitfalls (optional): Any warnings or things developers commonly get wrong when using the library.
Further Reading: Links or references to helpful guides or extended documentation, if available.
Your output should be clean, structured, and written so a developer can quickly understand how to get started and be productive with the library.
`

function getLibraryNameFromUrl(url: string): string {
  // Try to extract a reasonable folder name from the URL
  try {
    const { hostname, pathname } = new URL(url);
    // For github.com, use org/repo, else use hostname/path
    if (hostname === 'raw.githubusercontent.com') {
      const parts = url.match(/^https:\/\/raw.githubusercontent\.com\/([^\/]+)\/([^\/]+)/);
      if (parts && parts[2] && parts[3]) {
        return `${parts[2]}-${parts[3]}`; // org-repo format
      }

      // If we can't parse org/repo, fallback to a hostname-based name
      if (parts && parts[1] && parts[2]) {
        return `${parts[1]}-${parts[2]}`; // org-repo format
      }

      if (parts && parts[1]) {
        return parts[1]; // Just the org if we can't parse repo
      }

      return 'github-repo'; // Fallback if we can't parse org/repo
    }
    // For other hosts, use the first part of the path or the hostname
    const pathPart = pathname.split('/').filter(Boolean)[0];
    return pathPart ? `${hostname}-${pathPart}` : hostname;
  } catch {
    return 'unknown';
  }
}

const scrapeCommand = new Command('scrape')
  .description('Scrape docs links and generate merged markdown documentation')
  .option('--config <path>', 'Path to configuration file (default: thinair.docs.config.js or thinair.docs.config.ts)')
  .action(async (options) => {
    const explorer = cosmiconfigSync('thinair', {
      searchPlaces: [
        options.config, 
        'thinair.docs.config.ts',
        'thinair.docs.config.js'
      ].filter(Boolean),
    })

    const result = explorer.search()
    if (!result) {
      console.error('Configuration file not found.')
      process.exit(1)
    }
    const config = result.config
    if (!Array.isArray(config.docsLinks) || config.docsLinks.length === 0) {
      console.error('No links found in configuration.')
      process.exit(1)
    }

    const firecrawl_api = config.firecrawl?.apiKey || process.env.FIRECRAWL_API_KEY;
    if (!firecrawl_api) {
      console.error('Firecrawl API key must be provided via --api-key or FIRECRAWL_API_KEY.')
      process.exit(1)
    }

    const SCRAPE_LIMITS = {
      TOTAL: config.firecrawl.LIMIT || 35,
      DEPTH: config.firecrawl.DEPTH || 2,
    }


    const app = new FirecrawlApp({apiKey: firecrawl_api});
    const scrapedDocs: { url: string, content: string, folder: string }[] = []

    const docsDir = path.resolve(process.cwd(), 'docs');
    await fs.mkdir(docsDir, { recursive: true });

    for (const url of config.docsLinks) {
      const libFolder = getLibraryNameFromUrl(url);
      let libDir = path.join(docsDir, libFolder);

      const docFile = path.join(libDir, 'DOCS.md');
      if (
        await fs.stat(libDir).then(() => true).catch(() => false) &&
        await fs.stat(docFile).then(() => true).catch(() => false)
      ) {
        console.log(`Skipping ${url} (DOCS.md already exists at ${docFile})`);
        continue;
      }

      await fs.mkdir(libDir, { recursive: true });

      let docContent = '';
      if (!url.includes('github.com')) {
        console.log(`Crawling and scraping ${url}...`);
        // Use crawlUrl instead of scrapeUrl
        const crawlResult = await app.crawlUrl(url, {
          limit: SCRAPE_LIMITS.TOTAL,
          maxDepth: SCRAPE_LIMITS.DEPTH,
          scrapeOptions: {
            formats: ['markdown', 'html'],
          },
        });

        if ('data' in crawlResult) {
          // Join the content of all FirecrawlDocument objects into a single markdown string
          docContent = Array.isArray(crawlResult.data)
            ? crawlResult.data.map(doc => doc.html || doc.markdown || '').join('\n\n')
            : String(crawlResult.data);
        } else {
          console.error(`Error scraping ${url}: ${crawlResult.error || 'Unknown error'}`);
          docContent = `# Documentation for ${url}\n\n(Failed to crawl: ${crawlResult.error || 'Unknown error'})`;
        }
      } else {
        console.log(`Fetching GitHub README for ${url}...`);
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
          }
          docContent = await res.text();
        }  catch (error) {
          console.error(`Error fetching ${url}:`, error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          docContent = `# Documentation for ${url}\n\n(Failed to fetch: ${errorMsg})`;
        }
      }

      if (docContent && /<[^>]+>/.test(docContent)) {
        // Extract only the text within HTML elements
        docContent = docContent.replace(/<[^>]+>/g, '').trim();
      }

      const { text } = await generateText({
        model: openai('gpt-4o'),
        system: SYSTEM_PROMPT,
        prompt: docContent += '\n\nsynthesize the above text to give me exactly what I need to know about this library to use it effectively. Keep track of all examples.',
        maxTokens: 5000, // Adjust as needed
      });

      await fs.writeFile(docFile, text);
      scrapedDocs.push({ url, content: text, folder: libFolder });
    }

    console.log('Merging documentation with AI...');

    const prompt = `${scrapedDocs.map((d, i) => `---\n\n# Document ${i + 1} (${d.url})\n\n${d.content}`).join('\n\n')}
Provide a cohesive, structured markdown document.`

    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: SYSTEM_PROMPT,
      prompt,
      maxTokens: 5000, // Adjust as needed
    });

    const outPath = path.resolve(process.cwd(), config.output || 'DOCS.md')
    await fs.writeFile(outPath, text)
    console.log(`Documentation written to ${outPath}`)
    console.log(`Individual docs written to ${docsDir}/<library>/DOCS.md`)
  })

export default scrapeCommand