#!/usr/bin/env node
/**
 * Palette guard: every `<family>-<shade>` class used in src/ must exist in
 * tailwind.config.js. Catches typos such as `bg-brand-550` before the browser
 * silently drops the style.
 *
 * Usage: npm run lint:tokens
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(here, '..');
const configPath = path.join(frontendDir, 'tailwind.config.js');
const srcDir = path.join(frontendDir, 'src');

// Import the real Tailwind config instead of parsing it - the palette stays the
// single source of truth and this script can never drift from it.
const tailwindConfig = (await import(pathToFileURL(configPath).href)).default;
const colorFamilies = tailwindConfig?.theme?.extend?.colors;
if (!colorFamilies) throw new Error('tailwind.config.js does not define theme.extend.colors');

const palette = new Map(
  Object.entries(colorFamilies).map(([family, shades]) => [family, new Set(Object.keys(shades || {}))]),
);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(jsx?|css|html)$/.test(entry.name) ? [full] : [];
  });
}

const families = [...palette.keys()];
const usageRe = new RegExp(`(?<![A-Za-z0-9-])((?:${families.join('|')})-(\\d{2,3}))(?![\\w-])`, 'g');

const problems = [];
const used = new Map();

for (const file of walk(srcDir)) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    let match;
    usageRe.lastIndex = 0;
    while ((match = usageRe.exec(line))) {
      const [, token, shade] = match;
      const family = token.slice(0, token.lastIndexOf('-'));
      const known = palette.get(family);
      used.set(token, (used.get(token) || 0) + 1);
      if (!known || !known.has(shade)) {
        problems.push({
          file: path.relative(frontendDir, file),
          line: index + 1,
          token,
          reason: known
            ? `${family} has no shade ${shade} (have ${[...known].join(', ')})`
            : `unknown family ${family}`,
        });
      }
    }
  });
}

console.log(`palette families: ${families.map((family) => `${family}(${palette.get(family).size})`).join(', ')}`);
console.log(`distinct palette tokens used: ${used.size}`);

if (problems.length) {
  console.error(`\n${problems.length} unknown palette token(s):`);
  for (const problem of problems) {
    console.error(`  ${problem.file}:${problem.line}  ${problem.token}  -> ${problem.reason}`);
  }
  process.exit(1);
}

console.log('all palette tokens resolve against tailwind.config.js [OK]');
