import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathExists } from './fs-utils.mjs';

export async function checkEvidence({ dir, strict = false }) {
  const contractDir = resolve(dir);
  const manifestPath = join(contractDir, 'evidence-manifest.json');
  if (!(await pathExists(manifestPath))) throw new Error(`Evidence manifest not found: ${manifestPath}`);
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { throw new Error('evidence-manifest.json is not valid JSON.'); }
  if (!Array.isArray(manifest.items)) throw new Error('Evidence manifest must contain an items array.');
  const results = [];
  for (const item of manifest.items) {
    const candidates = item.path ? [join(contractDir, item.path), join(contractDir, '..', '..', item.path)] : [];
    const resolvedPath = (await Promise.all(candidates.map(async (candidate) => (await pathExists(candidate)) ? candidate : null))).find(Boolean) || null;
    const idValid = /^EVD-\d{3,}$/.test(item.id || '');
    const criteriaValid = Array.isArray(item.criteria) && item.criteria.some((id) => /^ACC-\d{3,}$/.test(id));
    const statesValid = Array.isArray(item.states) && item.states.some((id) => /^ST-\d{3,}$/.test(id));
    const status = item.status || 'missing';
    results.push({ id: item.id || 'unnamed', status, path: item.path || null, resolvedPath, exists: Boolean(resolvedPath), idValid, criteriaValid, statesValid });
  }
  const pending = results.filter((item) => item.status === 'pending' || !item.exists || (strict && (!item.idValid || !item.criteriaValid || !item.statesValid)));
  const result = { manifest: manifestPath, total: results.length, ready: results.length - pending.length, pending: pending.length, items: results };
  if (pending.length && strict) throw new Error(`Evidence validation failed: ${pending.length} item(s) pending, malformed, or missing.`);
  return result;
}
