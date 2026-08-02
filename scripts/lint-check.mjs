import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['app', 'components', 'lib/pos', 'prisma'];
const forbidden = [
  {
    pattern: /card number|credit card number|cc number/i,
    message: 'Do not collect card numbers. Card payments must be external-terminal records only.',
  },
  {
    pattern: /plain[- ]?text pin/i,
    message: 'Do not store plain-text PINs.',
  },
  {
    pattern: /TODO|FIXME/,
    message: 'No TODO/FIXME placeholders in production POS code.',
  },
];

const files = [];

for (const root of roots) walk(root);

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) {
      throw new Error(`${rule.message}\nFile: ${file}`);
    }
  }
}

console.log(`lint-check passed (${files.length} files scanned)`);

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (/\.(ts|tsx|prisma)$/.test(full) && !full.includes(`${join('app', 'api', 'erlc')}`)) files.push(full);
  }
}
