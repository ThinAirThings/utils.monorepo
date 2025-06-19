import { Command } from 'commander';
import scrapeCommand from './commands/scrape.js';
import getPackagesCommand from './commands/getpackages.js';

import dotenv from 'dotenv';
dotenv.config();

function setupCLI() {
  const program = new Command();
  program
    .name('thinair-docs')
    .description('Scrape docs pages and generate a consolidated markdown guide for Cursor')
    .version('0.1.0');

  // Add the scrape command from scrape.ts
  program.addCommand(scrapeCommand);

  program.addCommand(getPackagesCommand);

  program.parseAsync(process.argv);
}

setupCLI();