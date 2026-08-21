import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkEvidence } from '../lib/evidence-validator.mjs';
import { parseArgs } from '../lib/args.mjs';

const projectRoot = await mkdtemp(join(tmpdir(), 'interfacecraft-adversarial-'));
const dir = join(projectRoot, 'design', 'experience-contract');
try {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'evidence.png'), 'evidence');
  const invalidManifest = {
    contractVersion: '0.3', project: 'negative', context: 'web-app', items: [
      { id: 'EVD-001', type: 'screenshot', path: 'evidence.png', states: ['ST-001', 'BROKEN'], criteria: ['ACC-001'], status: 'unknown' },
      { id: 'EVD-002', type: 'screenshot', path: '../../../escaped.png', states: ['ST-001'], criteria: ['ACC-001'], status: 'ready' },
    ],
  };
  await writeFile(join(dir, 'evidence-manifest.json'), `${JSON.stringify(invalidManifest, null, 2)}\n`);
  const result = await checkEvidence({ dir, projectRoot, strict: false });
  assert.equal(result.schemaValid, false);
  assert.equal(result.items[1].pathEscapesRoot, true);
  assert.ok(result.items[0].errors.some((error) => error.includes('invalid status')));
  assert.ok(result.items[0].errors.some((error) => error.includes('all states')));
  await assert.rejects(() => checkEvidence({ dir, projectRoot, strict: true }), /Evidence validation failed/);
  assert.throws(() => parseArgs(['detect-context', '--min-score']), /requires a value/);
  assert.throws(() => parseArgs(['scaffold', '--dir', '--strict']), /requires a value/);
  console.log(JSON.stringify({ adversarial: 'pass', checks: ['path-escape', 'status-enum', 'full-reference-validation', 'missing-option-value'] }));
} finally {
  await rm(projectRoot, { recursive: true, force: true });
}
