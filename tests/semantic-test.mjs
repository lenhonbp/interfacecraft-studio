import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { validateContract } from '../lib/contract-validator.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dir = await mkdtemp(join(tmpdir(), 'interfacecraft-semantic-'));
const files = {
  'experience-brief.md': '# Experience Brief\n\n## Objective\n`BRF-001` Improve settings.\n\n## Context\nweb-app\n\n## Constraints\nNone.\n\n## Acceptance Criteria\n`ACC-001` Settings save is observable.\n',
  'journey.md': '# Journey\n\n## Primary Journey\n`JNY-001` uses `SCR-001`, `ST-001`, and `ACC-001`.\n\n## Recovery\n`EVD-001` captures recovery.\n',
  'screen-map.md': '# Screen Map\n\n## Screen Inventory\n`SCR-001` settings screen uses `ST-001` and `CMP-001`.\n\n## Navigation\n`JNY-001` navigates to `SCR-001`.\n',
  'state-matrix.md': '# State Matrix\n\n## State Coverage\n`ST-001` on `SCR-001` is owned by `CMP-001`.\n',
  'interaction-contract.md': '# Interaction Contract\n\n## Interaction Rules\n`CMP-001` handles `ST-001` for `ACC-001`.\n\n## Recovery\n`EVD-001` records recovery.\n',
  'visual-direction.md': '# Visual Direction\n\n## Hierarchy\n`SCR-001` prioritizes `ACC-001`.\n\n## Visual System\n`CMP-001` uses semantic tokens.\n',
  'platform-rules.md': '# Platform Rules\n\n## Platform Matrix\n`SCR-001` supports desktop.\n\n## Accessibility\n`ACC-001` is keyboard accessible.\n',
  'component-contract.md': '# Component Contract\n\n## Component Inventory\n`CMP-001` owns `SCR-001`, `ST-001`, and `ACC-001`.\n\n## Acceptance\n`ACC-001` is testable.\n',
  'acceptance-checklist.md': '# Acceptance Checklist\n\n## Acceptance Matrix\n`ACC-001` is proven by `EVD-001`.\n\n## Release Decision\nready\n',
  'evidence-manifest.json': JSON.stringify({ contractVersion: '0.3', project: 'semantic-fixture', context: 'web-app', items: [{ id: 'EVD-001', path: 'evidence/settings.md', screen: 'SCR-001', states: ['ST-001'], criteria: ['ACC-001'], status: 'ready' }] }, null, 2),
  'contract.meta.json': JSON.stringify({ contractVersion: '0.3', context: 'web-app', traceability: { enabled: true } }, null, 2),
};
try {
  await mkdir(join(dir, 'evidence'), { recursive: true });
  await writeFile(join(dir, 'evidence', 'settings.md'), 'validated evidence');
  for (const [name, content] of Object.entries(files)) await writeFile(join(dir, name), content);
  const result = await validateContract({ dir, semantic: true, strict: true });
  assert.equal(result.valid, true);
  assert.ok(result.graph.edges.length > 0);
  console.log(JSON.stringify({ semantic: 'pass', nodes: result.graph, errors: result.errors }, null, 2));
} finally {
  await rm(dir, { recursive: true, force: true });
}
