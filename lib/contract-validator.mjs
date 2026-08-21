import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { contexts } from './args.mjs';
import { pathExists } from './fs-utils.mjs';

export const contractFiles = [
  'experience-brief.md', 'journey.md', 'screen-map.md', 'state-matrix.md',
  'interaction-contract.md', 'visual-direction.md', 'platform-rules.md',
  'component-contract.md', 'acceptance-checklist.md', 'evidence-manifest.json',
];

const artifactRules = {
  'experience-brief.md': { ids: ['BRF'], sections: ['Objective', 'Context', 'Constraints', 'Acceptance Criteria'] },
  'journey.md': { ids: ['JNY', 'SCR', 'ST', 'ACC'], sections: ['Primary Journey', 'Recovery'] },
  'screen-map.md': { ids: ['SCR', 'JNY', 'ST', 'CMP'], sections: ['Screen Inventory', 'Navigation'] },
  'state-matrix.md': { ids: ['ST', 'SCR', 'CMP'], sections: ['State Coverage'] },
  'interaction-contract.md': { ids: ['CMP', 'ST', 'ACC'], sections: ['Interaction Rules', 'Recovery'] },
  'visual-direction.md': { ids: ['SCR', 'CMP', 'ACC'], sections: ['Hierarchy', 'Visual System'] },
  'platform-rules.md': { ids: ['SCR', 'ACC'], sections: ['Platform Matrix', 'Accessibility'] },
  'component-contract.md': { ids: ['CMP', 'SCR', 'ST', 'ACC'], sections: ['Component Inventory', 'Acceptance'] },
  'acceptance-checklist.md': { ids: ['ACC', 'EVD'], sections: ['Acceptance Matrix', 'Release Decision'] },
};

const rulesPath = fileURLToPath(new URL('../schemas/artifact-rules.json', import.meta.url));

const idPattern = /\\b(BRF|JNY|SCR|ST|CMP|ACC|EVD)-\\d{3,}\\b/g;

function unique(values) { return [...new Set(values)]; }
function extractIds(text, prefix) { return unique([...text.matchAll(new RegExp(`\\b${prefix}-\\d{3,}\\b`, 'g'))].map((m) => m[0])); }
function missingSections(content, sections) {
  return sections.filter((section) => !new RegExp(`^#{1,4}\\s+.*${section}`, 'im').test(content));
}
function placeholderFindings(content) {
  return [...content.matchAll(/\[(Project|Surface|Component|State|Owner|Describe|TBD|TODO)[^\]]*\]|\{\{[^}]+\}\}/gi)].map((m) => m[0]);
}

export async function loadContract(dir) {
  const contents = {};
  for (const file of contractFiles) {
    const path = join(dir, file);
    if (await pathExists(path)) contents[file] = await readFile(path, 'utf8');
  }
  return contents;
}

export function buildTraceabilityGraph(contents) {
  const graph = { briefs: [], journeys: [], screens: [], states: [], components: [], acceptances: [], evidence: [], edges: [] };
  const prefixes = { briefs: 'BRF', journeys: 'JNY', screens: 'SCR', states: 'ST', components: 'CMP', acceptances: 'ACC', evidence: 'EVD' };
  for (const [key, prefix] of Object.entries(prefixes)) {
    const source = Object.entries(contents).filter(([file]) => file !== 'evidence-manifest.json').map(([, value]) => value).join('\n');
    graph[key] = extractIds(source, prefix);
  }
  const all = Object.values(contents).join('\n');
  for (const from of ['JNY', 'SCR', 'ST', 'CMP', 'ACC', 'EVD']) {
    for (const to of ['JNY', 'SCR', 'ST', 'CMP', 'ACC', 'EVD']) {
      if (from === to) continue;
      for (const id of extractIds(all, from)) {
        const nearby = all.split(/\n#{1,4}\s+/).find((section) => section.includes(id)) || '';
        for (const target of extractIds(nearby, to)) graph.edges.push({ from: id, to: target });
      }
    }
  }
  graph.edges = graph.edges.filter((edge, index, array) => array.findIndex((candidate) => candidate.from === edge.from && candidate.to === edge.to) === index);
  return graph;
}

function referencedIds(text, prefix) { return extractIds(text, prefix); }

export async function validateContract({ dir, strict = false, semantic = false }) {
  const rules = JSON.parse(await readFile(rulesPath, 'utf8'));
  const warnings = [];
  const errors = [];
  const missing = [];
  const contents = await loadContract(dir);
  for (const file of contractFiles) if (!contents[file]) missing.push(file);
  if (missing.length) errors.push(`Contract is missing required files: ${missing.join(', ')}`);

  let meta = null;
  const metaPath = join(dir, 'contract.meta.json');
  if (await pathExists(metaPath)) {
    try { meta = JSON.parse(await readFile(metaPath, 'utf8')); }
    catch { errors.push('contract.meta.json is not valid JSON.'); }
  } else warnings.push('contract.meta.json: missing metadata file');
  if (meta) {
    if (!['0.2', '0.3'].includes(String(meta.contractVersion))) warnings.push(`contract.meta.json: unsupported contractVersion ${meta.contractVersion}`);
    if (!contexts.includes(meta.context)) errors.push('contract.meta.json: invalid context');
    if (semantic && String(meta.contractVersion) !== '0.3') warnings.push('semantic validation running in legacy compatibility mode for contractVersion 0.2');
  }

  for (const [file, rule] of Object.entries(rules.artifacts)) {
    if (!contents[file]) continue;
    const content = contents[file].replace(/\r\n/g, '\n');
    const placeholders = placeholderFindings(content);
    if (placeholders.length) warnings.push(`${file}: unresolved placeholders (${unique(placeholders).join(', ')})`);
    if (semantic) {
      const sections = missingSections(content, rule.sections);
      if (sections.length) errors.push(`${file}: missing semantic sections (${sections.join(', ')})`);
      const missingIds = rule.prefixes.filter((prefix) => !extractIds(content, prefix).length);
      if (missingIds.length) errors.push(`${file}: missing traceability IDs (${missingIds.join(', ')})`);
    } else if (content.includes('| | |') || content.includes('| | | |')) warnings.push(`${file}: contains empty table rows`);
  }

  let manifest = null;
  if (contents['evidence-manifest.json']) {
    try { manifest = JSON.parse(contents['evidence-manifest.json']); }
    catch { errors.push('evidence-manifest.json is not valid JSON.'); }
    if (manifest && !Array.isArray(manifest.items)) errors.push('evidence-manifest.json must contain an items array.');
    if (semantic && manifest) {
      for (const item of manifest.items || []) {
        if (!/^EVD-\d{3,}$/.test(item.id || '')) errors.push(`evidence item has invalid id: ${item.id || 'missing'}`);
        if (!Array.isArray(item.criteria) || !item.criteria.some((id) => /^ACC-\d{3,}$/.test(id))) errors.push(`evidence ${item.id || 'unnamed'} must reference ACC-* criteria`);
        if (!Array.isArray(item.states) || !item.states.some((id) => /^ST-\d{3,}$/.test(id))) errors.push(`evidence ${item.id || 'unnamed'} must reference ST-* states`);
        if (!item.path) errors.push(`evidence ${item.id || 'unnamed'} is missing path`);
      }
    }
  }

  const graph = buildTraceabilityGraph(contents);
  if (semantic) {
    const acceptanceText = contents['acceptance-checklist.md'] || '';
    const evidenceText = contents['evidence-manifest.json'] || '';
    const stateText = contents['state-matrix.md'] || '';
    for (const id of graph.acceptances) if (!referencedIds(evidenceText, 'ACC').includes(id)) errors.push(`${id}: no evidence item references this acceptance criterion`);
    for (const id of graph.states) if (!referencedIds(evidenceText, 'ST').includes(id)) warnings.push(`${id}: no evidence item references this state`);
    if (graph.screens.length && !referencedIds(stateText, 'SCR').some((id) => graph.screens.includes(id))) errors.push('traceability: screen IDs are not connected to the state matrix');
    if (graph.acceptances.length && !referencedIds(acceptanceText, 'ACC').length) errors.push('traceability: acceptance IDs not present in acceptance checklist');
  }

  const result = {
    dir,
    valid: errors.length === 0,
    mode: semantic ? 'semantic' : 'structural',
    contractVersion: meta?.contractVersion || 'unknown',
    context: meta?.context || 'unknown',
    missing,
    errors,
    warnings,
    graph,
    evidence: manifest ? { total: manifest.items?.length || 0 } : null,
  };
  if ((errors.length || (strict && warnings.length)) && strict) {
    throw new Error(`Contract validation failed:\n${[...errors, ...warnings].map((item) => `- ${item}`).join('\n')}`);
  }
  return result;
}
