import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { scaffold } from '../lib/scaffolder.mjs';
import { recordCompletion } from '../lib/provenance.mjs';
import { validateJsonSchema } from '../lib/schema-validator.mjs';

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const projectDir = await mkdtemp(join(tmpdir(), 'interfacecraft-conformance-'));
const dir = join(projectDir, 'design', 'experience-contract');
try {
  await scaffold({ packageRoot, options: { context: 'web-app', dir, force: false, dryRun: false } });
  const meta = JSON.parse(await (await import('node:fs/promises')).readFile(join(dir, 'contract.meta.json'), 'utf8'));
  const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(join(dir, 'evidence-manifest.json'), 'utf8'));
  const metaResult = await validateJsonSchema('experience-contract.schema.json', meta);
  const manifestResult = await validateJsonSchema('evidence-manifest.schema.json', manifest);
  assert.equal(metaResult.valid, true, JSON.stringify(metaResult.errors));
  assert.equal(manifestResult.valid, true, JSON.stringify(manifestResult.errors));
  const record = await recordCompletion({ packageRoot, options: { dir, projectDir, task: 'schema conformance test', agentSurface: 'test', approval: 'not-requested', notes: '', dryRun: true } });
  const recordResult = await validateJsonSchema('completion-record.schema.json', record);
  assert.equal(recordResult.valid, true, JSON.stringify(recordResult.errors));
  console.log(JSON.stringify({ schemaConformance: 'pass', schemas: ['experience-contract.schema.json', 'evidence-manifest.schema.json', 'completion-record.schema.json'] }));
} finally {
  await rm(projectDir, { recursive: true, force: true });
}
