import { defineConfig } from 'tsup';

export default defineConfig([
    // CLI
    {
        entry: ['src/cli.ts'],
        outDir: 'dist',
        format: 'esm',
        skipNodeModulesBundle: true,
        sourcemap: true,
    }
]); 
 