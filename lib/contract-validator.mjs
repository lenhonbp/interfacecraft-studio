import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { contexts } from './args.mjs';
import { pathExists } from './fs-utils.mjs';
import { validateJsonSchema } from './schema-validator.mjs';

export const contractFiles = [
  'experience-brief.md', 'journey.md', 'screen-map.md', 'state-matrix.md',
  'interaction-contract.md', 'visual-direction.md', 'platform-rules.md',
  'component-contract.md', 'acceptance-checklist.md', 'evidence-manifest.json',
];

const rulesPath = fileURLToPath(new URL('../schemas/artifact-rules.json', import.meta.url));
const idPattern = /\b(BRF|JNY|SCR|ST|CMP|ACC|EVD)-\d{3,}\b/g;
const prefixes = { BRF: 'briefs', JNY: 'journeys', SCR: 'screens', ST: 'states', CMP: 'components', ACC: 'acceptances', EVD: 'evidence' };

function unique(values) { return [...new Set(values)]; }
function extractIds(text, prefix) { return unique([...String(text || '').matchAll(new RegExp(`\\b${prefix}-\\d{3,}\\b`, 'g'))].map((m) => m[0])); }
function allIds(text) { return unique([...String(text || '').matchAll(idPattern)].map((m) => m[0])); }
function missingSections(content, sections) { return sections.filter((section) => !new RegExp(`^#{1,4}\\s+.*${section}`, 'im').test(content)); }
function placeholderFindings(content) { return [...content.matchAll(/\[(Project|Surface|Component|State|Owner|Describe|TBD|TODO)[^\]]*\]|\{\{[^}]+\}\}/gi)].map((m) => m[0]); }
function nodeType(id) { return id.match(/^([A-Z]+)-/)?.[1] || 'UNKNOWN'; }

export async function loadContract(dir) {
  const contents = {};
  for (const file of contractFiles) {
    const path = join(dir, file);
    if (await pathExists(path)) contents[file] = await readFile(path, 'utf8');
  }
  return contents;
}

function nodeRecords(contents, rules) {
  const records = [];
  for (const [artifact, rule] of Object.entries(rules.artifacts)) {
    const content = contents[artifact] || '';
    for (const prefix of rule.prefixes) {
      for (const id of extractIds(content, prefix)) records.push({ id, type: prefix, artifact });
    }
  }
  const byId = new Map();
  for (const record of records) {
    if (!byId.has(record.id)) byId.set(record.id, record);
  }
  return [...byId.values()];
}

function addEdge(edges, from, to, relation, artifact) {
  if (from === to) return;
  const key = `${from}|${to}|${relation}`;
  if (!edges.some((edge) => `${edge.from}|${edge.to}|${edge.relation}` === key)) edges.push({ from, to, relation, artifact });
}

export function buildTraceabilityGraph(contents, rules = null) {
  const activeRules = rules || { artifacts: {}, links: [] };
  const nodes = nodeRecords(contents, activeRules);
  const byType = Object.fromEntries(Object.keys(prefixes).map((prefix) => [prefix, nodes.filter((node) => node.type === prefix)]));
  const edges = [];
  for (const link of activeRules.links || []) {
    const sources = byType[link.from] || [];
    const targets = byType[link.to] || [];
    for (const source of sources) {
      for (const target of targets) {
        const sourceArtifacts = Object.entries(contents).filter(([, content]) => String(content).includes(source.id));
        const linked = sourceArtifacts.some(([artifact, content]) => String(content).includes(target.id) || (artifact === 'evidence-manifest.json' && String(content).includes(target.id)));
        if (linked) addEdge(edges, source.id, target.id, link.relation, source.artifact);
      }
    }
  }
  return {
    nodes,
    edges,
    briefs: byType.BRF.map((node) => node.id),
    journeys: byType.JNY.map((node) => node.id),
    screens: byType.SCR.map((node) => node.id),
    states: byType.ST.map((node) => node.id),
    components: byType.CMP.map((node) => node.id),
    acceptances: byType.ACC.map((node) => node.id),
    evidence: byType.EVD.map((node) => node.id),
  };
}

function referencedIds(text, prefix) { return extractIds(text, prefix); }
function formatErrors(errors, label) { return errors.map((error) => `${label}${error.instancePath || '/'} ${error.message}`); }

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
    const metaSchema = await validateJsonSchema('experience-contract.schema.json', meta);
    if (!metaSchema.valid) errors.push(...formatErrors(metaSchema.errors, 'contract.meta.json '));
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
    if (manifest) {
      const manifestSchema = await validateJsonSchema('evidence-manifest.schema.json', manifest);
      if (!manifestSchema.valid) errors.push(...formatErrors(manifestSchema.errors, 'evidence-manifest.json '));
      if (semantic) {
        const allAcceptanceIds = new Set(extractIds(Object.values(contents).join('\n'), 'ACC'));
        const allStateIds = new Set(extractIds(Object.values(contents).join('\n'), 'ST'));
        for (const item of manifest.items || []) {
          if (!Array.isArray(item.criteria) || item.criteria.some((id) => !/^ACC-\d{3,}$/.test(id) || !allAcceptanceIds.has(id))) errors.push(`evidence ${item.id || 'unnamed'} must reference only existing ACC-* criteria`);
          if (!Array.isArray(item.states) || item.states.some((id) => !/^ST-\d{3,}$/.test(id) || !allStateIds.has(id))) errors.push(`evidence ${item.id || 'unnamed'} must reference only existing ST-* states`);
        }
      }
    }
  }

  const graph = buildTraceabilityGraph(contents, rules);
  if (semantic) {
    const acceptanceText = contents['acceptance-checklist.md'] || '';
    const evidenceText = contents['evidence-manifest.json'] || '';
    const stateText = contents['state-matrix.md'] || '';
    const edges = new Set(graph.edges.map((edge) => `${edge.from}|${edge.to}|${edge.relation}`));
    for (const id of graph.acceptances) if (!referencedIds(evidenceText, 'ACC').includes(id)) errors.push(`${id}: no evidence item references this acceptance criterion`);
    for (const id of graph.states) if (!referencedIds(evidenceText, 'ST').includes(id)) warnings.push(`${id}: no evidence item references this state`);
    for (const screenId of referencedIds(stateText, 'SCR')) if (!graph.screens.includes(screenId)) errors.push(`${screenId}: state matrix references an unknown screen`);
    if (graph.screens.length && !referencedIds(stateText, 'SCR').every((id) => graph.screens.includes(id))) errors.push('traceability: state matrix contains unknown screen references');
    if (graph.acceptances.length && !referencedIds(acceptanceText, 'ACC').every((id) => graph.acceptances.includes(id))) errors.push('traceability: acceptance checklist contains unknown acceptance references');
    for (const link of rules.links || []) {
      if (!link.relation) errors.push(`artifact-rules: ${link.from}->${link.to} is missing relation`);
      if (!['BRF', 'JNY', 'SCR', 'ST', 'CMP', 'ACC', 'EVD'].includes(link.from) || !['BRF', 'JNY', 'SCR', 'ST', 'CMP', 'ACC', 'EVD'].includes(link.to)) errors.push(`artifact-rules: invalid typed link ${link.from}->${link.to}`);
    }
    if (graph.acceptances.some((id) => ![...edges].some((edge) => edge.startsWith(`${id}|`) && edge.endsWith('|proven-by')))) warnings.push('traceability: some acceptance criteria have no typed proven-by edge');
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
