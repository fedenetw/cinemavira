import { defineConfig } from 'astro/config';

// Sito statico: nessun'integrazione necessaria.
// I contenuti vivono in src/pages (*.md) e gli asset in public/.
export default defineConfig({
  output: 'static',
});
