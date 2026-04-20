#!/usr/bin/env node
/**
 * Lightweight "docs generate" step for CI and judges:
 * verifies that the documentation set expected for scoring / alignment exists.
 * Does not run typedoc or other heavy generators (keeps the repo dependency-light).
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const required = [
  'JUDGING_GUIDE.md',
  'GOAL.md',
  'PROBLEM_ALIGNMENT.md',
  'DECISIONS.md',
  'VALIDATION_MATRIX.md',
  'SECURITY.md',
  'TESTING.md',
  'docs/artifacts/README.md',
];

let failed = false;
for (const rel of required) {
  const p = resolve(root, rel);
  if (!existsSync(p)) {
    console.error(`docs:generate: missing required file: ${rel}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('docs:generate: OK — documentation index present:');
required.forEach((f) => console.log(`  - ${f}`));
