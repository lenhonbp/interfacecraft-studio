import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pathExists } from './fs-utils.mjs';
import { validateJsonSchema } from './schema-validator.mjs';

const statusValues = ['pending', 'ready', 'failed', 'skipped', 'not-applicable'];
const evidenceTypes = ['screenshot', 'visual-strip', 'manual-traversal', 'recording', 'automated-check', 'runnable-demo', 'other'];
const idPatterns = {
  evidence: /^EVD-\d{3,}$/,
  state: /^ST-\d{3,}$/,
  criterion: /^ACC-\d{3,}$/,
  screen: /^SCR-\d{3,}$/,
  component: /^CMP-\d{3,}$/,
};

function isInside(root, candidate) {
  const comparison = relative(root, candidate);
  return comparison === '' || (!comparison.startsWith(`..${sep}`) && comparison !== '..' && !isAbsolute(comparison));
}

function validateReferences(item) {
  const errors = [];
  if (!idPatterns.evidence.test(item.id || '')) errors.push('invalid EVD id');
  if (!evidenceTypes.includes(item.type)) errors.push(`invalid evidence type '${item.type || ''}'`);
  if (!statusValues.includes(item.status)) errors.push(`invalid status '${item.status || ''}'`);
  if (!Array.isArray(item.states) || item.states.length === 0 || item.states.some((id) => !idPatterns.state.test(id))) errors.push('all states must be ST-* IDs');
  if (!Array.isArray(item.criteria) || item.criteria.length === 0 || item.criteria.some((id) => !idPatterns.criterion.test(id))) errors.push('all criteria must be ACC-* IDs');
  if (item.screen !== undefined && !idPatterns.screen.test(item.screen)) errors.push('screen must be a SCR-* ID');
  if (item.components !== undefined && (!Array.isArray(item.components) || item.components.some((id) => !idPatterns.component.test(id)))) errors.push('all components must be CMP-* IDs');
  if ((item.status === 'skipped' || item.status === 'not-applicable') && !String(item.notes || '').trim()) errors.push(`${item.status} evidence requires notes`);
  return errors;
}

export async function checkEvidence({ dir, projectRoot, strict = false }) {
  const contractDir = resolve(dir);
  const allowedRoot = resolve(projectRoot || resolve(contractDir, '..', '..'));
  const manifestPath = resolve(contractDir, 'evidence-manifest.json');
  if (!(await pathExists(manifestPath))) throw new Error(`Evidence manifest not found: ${manifestPath}`);
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { throw new Error('evidence-manifest.json is not valid JSON.'); }
  const schema = await validateJsonSchema('evidence-manifest.schema.json', manifest);
  const schemaErrors = schema.errors.map((error) => `${error.instancePath || '/'} ${error.message}`);
  const results = [];
  const seenPaths = new Set();
  const seenIds = new Set();
  for (const item of manifest.items || []) {
    const rawPath = typeof item.path === 'string' ? item.path : '';
    const canonicalPath = rawPath && !isAbsolute(rawPath) ? resolve(contractDir, rawPath) : null;
    const pathEscapesRoot = canonicalPath ? !isInside(allowedRoot, canonicalPath) : true;
    const duplicatePath = canonicalPath ? seenPaths.has(canonicalPath) : false;
    const duplicateId = seenIds.has(item.id);
    if (canonicalPath) seenPaths.add(canonicalPath);
    if (item.id) seenIds.add(item.id);
    const exists = Boolean(canonicalPath && !pathEscapesRoot && await pathExists(canonicalPath));
    const referenceErrors = validateReferences(item);
    const itemErrors = [...referenceErrors];
    if (!rawPath) itemErrors.push('path is required');
    if (pathEscapesRoot) itemErrors.push('path escapes allowed project root or is absolute');
    if (duplicatePath) itemErrors.push('duplicate canonical evidence path');
    if (duplicateId) itemErrors.push('duplicate evidence ID');
    if (!exists) itemErrors.push('evidence path does not exist');
    const ready = item.status === 'ready' && itemErrors.length === 0;
    results.push({ id: item.id || 'unnamed', status: item.status || 'missing', path: rawPath || null, canonicalPath, exists, pathEscapesRoot, ready, errors: itemErrors });
  }
  const blocking = results.filter((item) => !item.ready && item.status !== 'skipped' && item.status !== 'not-applicable');
  const pending = results.filter((item) => !item.ready);
  const result = { manifest: manifestPath, allowedRoot, schemaValid: schema.valid, schemaErrors, total: results.length, ready: results.filter((item) => item.ready).length, pending: pending.length, blocking: blocking.length, items: results };
  if ((schemaErrors.length || blocking.length || (strict && pending.length)) && strict) {
    throw new Error(`Evidence validation failed: ${[...schemaErrors, ...blocking.flatMap((item) => `${item.id}: ${item.errors.join(', ')}`)].join('; ')}`);
  }
  return result;
}
