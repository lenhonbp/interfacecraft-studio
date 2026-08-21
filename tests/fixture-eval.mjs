import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { detectContext } from '../lib/context-detector.mjs';

const root = resolve(new URL('../fixtures/', import.meta.url).pathname);
const names = ['website', 'web-app', 'game', 'playable-web-game', 'content-site', 'design-system', 'desktop-shell', 'commerce-app'];
const rows = [];
for (const name of names) {
  const dir = join(root, name);
  const expected = JSON.parse(await readFile(join(dir, 'expected.json'), 'utf8')).expectedContext;
  const result = await detectContext(dir);
  rows.push({ fixture: name, expected, actual: result.recommendedContext, score: result.scores[0].score, confidence: result.confidence, margin: result.margin, reviewRequired: result.reviewRequired, pass: expected === result.recommendedContext });
}
const passed = rows.filter((row) => row.pass).length;
const report = { total: rows.length, passed, accuracy: Number((passed / rows.length).toFixed(3)), rows };
console.log(JSON.stringify(report, null, 2));
if (passed !== rows.length) process.exitCode = 1;
