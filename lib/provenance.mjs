import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { approvals } from './args.mjs';
import { pathExists } from './fs-utils.mjs';
import { validateContract } from './contract-validator.mjs';
import { checkEvidence } from './evidence-validator.mjs';
import { validateJsonSchema } from './schema-validator.mjs';

function hashRecord(record) {
  const payload = { ...record };
  delete payload.contentHash;
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

async function packageVersion(packageRoot) {
  try { return JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')).version; } catch { return 'unknown'; }
}

export async function recordCompletion({ packageRoot, options }) {
  if (!approvals.includes(options.approval)) throw new Error(`Invalid approval '${options.approval}'. Use ${approvals.join(', ')}.`);
  const contract = await validateContract({ dir: options.dir, strict: false, semantic: true });
  const evidence = await checkEvidence({ dir: options.dir, strict: false });
  const metaPath = join(resolve(options.dir), 'contract.meta.json');
  let meta = {};
  if (await pathExists(metaPath)) meta = JSON.parse(await readFile(metaPath, 'utf8'));
  const version = await packageVersion(packageRoot);
  const record = {
    recordVersion: '1.1',
    generatedBy: { name: 'interfacecraft-studio', version },
    contractVersion: String(meta.contractVersion || '0.3'),
    context: meta.context || 'unknown',
    task: options.task,
    status: contract.errors.length || evidence.pending ? 'ready-with-risks' : 'ready',
    completedAt: new Date().toISOString(),
    agentSurface: options.agentSurface || 'unknown',
    validation: {
      mode: 'semantic',
      contract: contract.errors.length ? 'failed' : contract.warnings.length ? 'passed-with-warnings' : 'passed',
      evidence: evidence.pending ? 'passed-with-pending' : 'passed',
      evidenceCount: evidence.total,
      pendingEvidenceCount: evidence.pending,
      errors: contract.errors,
      warnings: contract.warnings,
      traceability: { nodes: Object.values(contract.graph).filter(Array.isArray).reduce((sum, value) => sum + value.length, 0), edges: contract.graph.edges.length },
    },
    humanApproval: { status: options.approval, notes: options.notes || '' },
  };
  record.contentHash = hashRecord(record);
  const schema = await validateJsonSchema('completion-record.schema.json', record);
  if (!schema.valid) throw new Error(`Generated completion record does not conform to schema: ${schema.errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ')}`);
  const outputDir = join(resolve(options.projectDir), '.interfacecraft');
  if (options.dryRun) { console.log(`would write completion record -> ${join(outputDir, 'completion-record.json')}`); return record; }
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, 'completion-record.json'), `${JSON.stringify(record, null, 2)}\n`);
  const line = `InterfaceCraft Studio v${version} · Semantic contract ${record.validation.contract} · Evidence: ${evidence.total} · Status: ${record.status}`;
  const markdown = `# InterfaceCraft Completion\n\n${line}\n\n- Context: ${record.context}\n- Task: ${record.task}\n- Agent surface: ${record.agentSurface}\n- Traceability nodes: ${record.validation.traceability.nodes}\n- Traceability edges: ${record.validation.traceability.edges}\n- Completed at: ${record.completedAt}\n- Record integrity: ${record.contentHash}\n- Human approval: ${record.humanApproval.status}\n- Approval notes: ${record.humanApproval.notes || '(none)'}\n`;
  await writeFile(join(outputDir, 'COMPLETION.md'), `${markdown}\n`);
  console.log(line);
  console.log(`Wrote ${join(outputDir, 'completion-record.json')}`);
}

export async function verifyCompletion(projectDir, strict = false) {
  const path = join(resolve(projectDir), '.interfacecraft', 'completion-record.json');
  if (!(await pathExists(path))) throw new Error(`Completion record not found: ${path}`);
  const record = JSON.parse(await readFile(path, 'utf8'));
  const expectedHash = hashRecord(record);
  const integrityValid = expectedHash === record.contentHash;
  const schema = await validateJsonSchema('completion-record.schema.json', record);
  const valid = integrityValid && schema.valid;
  const result = { path, valid, integrityValid, schemaValid: schema.valid, schemaErrors: schema.errors, contentHash: record.contentHash, expectedHash, status: record.status, context: record.context, generatedBy: record.generatedBy };
  if (!valid && strict) throw new Error(`Completion record verification failed: ${!integrityValid ? `hash expected ${expectedHash}, found ${record.contentHash}` : ''}${!schema.valid ? ` schema errors ${schema.errors.map((error) => error.message).join('; ')}` : ''}`);
  console.log(JSON.stringify(result, null, 2));
}
