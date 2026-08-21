#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillName = 'interfacecraft-studio';
const skillFiles = ['SKILL.md', 'references', 'templates', 'schemas', 'agents', '.claude-plugin', 'demo'];
const contractTemplateDir = join(packageRoot, 'templates', 'experience-contract');
const contractFiles = [
  'experience-brief.md',
  'journey.md',
  'screen-map.md',
  'state-matrix.md',
  'interaction-contract.md',
  'visual-direction.md',
  'platform-rules.md',
  'component-contract.md',
  'acceptance-checklist.md',
  'evidence-manifest.json',
];
const contexts = ['web-experience', 'web-app', 'game-experience', 'playable-web-game'];
const approvals = ['not-requested', 'pending', 'approved', 'rejected'];

function printHelp() {
  console.log(`
${skillName} — cross-agent experience engineering toolkit

Usage:
  npx interfacecraft-studio install [options]
  npx interfacecraft-studio scaffold [options]
  npx interfacecraft-studio detect-context [options]
  npx interfacecraft-studio validate-contract [options]
  npx interfacecraft-studio check-evidence [options]
  npx interfacecraft-studio record-completion [options]
  npx interfacecraft-studio verify-completion [options]
  npx interfacecraft-studio doctor
  npx interfacecraft-studio validate

Options:
  --target <name>       claude | codex | both | project (default: both)
  --project-dir <path>  Project directory for project install, detection, provenance
  --dir <path>          Contract directory (default: design/experience-contract)
  --context <name>      web-experience | web-app | game-experience | playable-web-game
  --strict              Fail on placeholders or pending evidence
  --force               Replace an existing installation or contract
  --dry-run             Print actions without changing files
  --task <text>         Human-readable completed task description
  --agent-surface <id>  Self-reported surface: claude-code, codex, manual, unknown
  --approval <status>   not-requested | pending | approved | rejected
  --notes <text>        Human approval or risk notes
  --help                Show this help

Examples:
  npx interfacecraft-studio install --target both
  npx interfacecraft-studio scaffold --dir ./design/experience-contract --context web-app
  npx interfacecraft-studio detect-context --project-dir .
  npx interfacecraft-studio validate-contract --dir ./design/experience-contract
  npx interfacecraft-studio check-evidence --dir ./design/experience-contract
  npx interfacecraft-studio record-completion --project-dir . --task "Design settings flow"
  npx interfacecraft-studio verify-completion --project-dir .
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'install';
  const options = {
    target: 'both',
    projectDir: process.cwd(),
    dir: resolve(process.cwd(), 'design', 'experience-contract'),
    context: 'web-app',
    force: false,
    dryRun: false,
    strict: false,
    task: 'Experience Contract completion',
    agentSurface: process.env.INTERFACECRAFT_AGENT || 'unknown',
    approval: 'not-requested',
    notes: '',
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--task') options.task = args[++i];
    else if (arg === '--agent-surface') options.agentSurface = args[++i];
    else if (arg === '--approval') options.approval = args[++i];
    else if (arg === '--notes') options.notes = args[++i];
    else if (arg === '--target') options.target = args[++i];
    else if (arg === '--project-dir') options.projectDir = resolve(args[++i]);
    else if (arg === '--dir') options.dir = resolve(args[++i]);
    else if (arg === '--context') options.context = args[++i];
    else throw new Error(`Unknown option: ${arg}`);
  }
  return { command, options };
}

function homePath(...parts) {
  return join(homedir(), ...parts);
}

function targets(options) {
  const project = resolve(options.projectDir);
  const map = {
    claude: homePath('.claude', 'skills', skillName),
    codex: homePath('.agents', 'skills', skillName),
    projectClaude: join(project, '.claude', 'skills', skillName),
    projectCodex: join(project, '.agents', 'skills', skillName),
  };
  if (options.target === 'claude') return [['Claude Code', map.claude]];
  if (options.target === 'codex') return [['Codex', map.codex]];
  if (options.target === 'project') return [['Claude Code project', map.projectClaude], ['Codex project', map.projectCodex]];
  if (options.target === 'both') return [['Claude Code', map.claude], ['Codex', map.codex]];
  throw new Error(`Invalid target '${options.target}'. Use claude, codex, both, or project.`);
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copySkill(destination, { force = false, dryRun = false } = {}) {
  if (await pathExists(destination)) {
    if (!force) throw new Error(`Destination exists: ${destination}. Re-run with --force to replace it.`);
    if (!dryRun) await rm(destination, { recursive: true, force: true });
  }
  if (dryRun) return;
  await mkdir(destination, { recursive: true });
  for (const file of skillFiles) {
    const source = join(packageRoot, file);
    const target = join(destination, file);
    if (await pathExists(source)) await cp(source, target, { recursive: true });
  }
}

async function validate() {
  const skillPath = join(packageRoot, 'SKILL.md');
  const content = await readFile(skillPath, 'utf8');
  if (!content.startsWith('---\n')) throw new Error('SKILL.md must start with YAML frontmatter.');
  const end = content.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('SKILL.md frontmatter must close with --- on its own line.');
  const frontmatter = content.slice(4, end);
  if (!/^name:\s*[^\n]+$/m.test(frontmatter)) throw new Error('SKILL.md frontmatter requires name.');
  if (!/^description:\s*[^\n]+$/m.test(frontmatter)) throw new Error('SKILL.md frontmatter requires description.');
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() || '';
  if (!/^[-a-z0-9]+$/.test(name)) throw new Error('Skill name must use lowercase letters, numbers, and hyphens.');
  console.log(`Valid skill: ${skillPath}`);
}

async function scaffold(options) {
  if (!contexts.includes(options.context)) throw new Error(`Invalid context '${options.context}'. Use ${contexts.join(', ')}.`);
  if (await pathExists(options.dir)) {
    if (!options.force) throw new Error(`Contract directory exists: ${options.dir}. Use --force to replace it.`);
    if (!options.dryRun) await rm(options.dir, { recursive: true, force: true });
  }
  if (options.dryRun) {
    console.log(`would scaffold ${options.context} contract -> ${options.dir}`);
    return;
  }
  await mkdir(options.dir, { recursive: true });
  for (const file of contractFiles) await cp(join(contractTemplateDir, file), join(options.dir, file));
  await writeFile(join(options.dir, 'contract.meta.json'), `${JSON.stringify({ contractVersion: '0.2', context: options.context }, null, 2)}\n`);
  console.log(`Scaffolded ${options.context} Experience Contract at ${options.dir}`);
}

async function listFiles(root, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  let entries = [];
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const output = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build'].includes(entry.name)) continue;
    const full = join(root, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(full, maxDepth, currentDepth + 1));
    else output.push(full);
  }
  return output;
}

async function detectContext(options) {
  const projectDir = resolve(options.projectDir);
  const files = await listFiles(projectDir, 4);
  const names = files.map((file) => relative(projectDir, file).replaceAll('\\', '/'));
  const packageFiles = names.filter((name) => name === 'package.json' || name.endsWith('/package.json'));
  const packageText = [];
  for (const file of packageFiles.slice(0, 10)) {
    try { packageText.push(await readFile(join(projectDir, file), 'utf8')); } catch { /* ignore unreadable file */ }
  }
  const packageBlob = packageText.join('\n').toLowerCase();
  let context = 'web-experience';
  let confidence = 'low';
  let reason = 'No framework or engine fingerprint found; defaulting to web-experience.';
  if (names.some((name) => name.endsWith('project.godot') || name.endsWith('.uproject') || name.includes('Assets/ProjectSettings'))) {
    context = 'game-experience'; confidence = 'high'; reason = 'Game engine project fingerprint detected.';
  } else if (/(phaser|pixi\.js|three|babylon|playcanvas)/.test(packageBlob) || names.some((name) => /(^|\/)(game|playfield|canvas|engine)(\/|\.)/i.test(name))) {
    context = 'playable-web-game'; confidence = 'medium'; reason = 'Browser game or rendering engine fingerprint detected.';
  } else if (/(next|react|vue|svelte|angular|nuxt|remix|astro)/.test(packageBlob)) {
    context = 'web-app'; confidence = 'medium'; reason = 'Frontend framework fingerprint detected; use web-experience if primarily public content.';
  } else if (names.some((name) => /(^|\/)(index|about|landing|marketing|pages)(\.|\/)/i.test(name))) {
    context = 'web-experience'; confidence = 'medium'; reason = 'Public website file fingerprint detected.';
  }
  console.log(JSON.stringify({ projectDir, context, confidence, reason, signals: names.slice(0, 40) }, null, 2));
}

async function readContractFiles(dir) {
  const missing = [];
  for (const file of contractFiles) if (!(await pathExists(join(dir, file)))) missing.push(file);
  return missing;
}

async function validateContract(options) {
  const dir = resolve(options.dir);
  const missing = await readContractFiles(dir);
  if (missing.length) throw new Error(`Contract is missing required files: ${missing.join(', ')}`);
  const warnings = [];
  for (const file of contractFiles.filter((name) => name.endsWith('.md'))) {
    const content = await readFile(join(dir, file), 'utf8');
    if (/\[(Project|Surface|Component)/.test(content)) warnings.push(`${file}: contains scaffold placeholders`);
    if (content.includes('| | |') || content.includes('| | | |')) warnings.push(`${file}: contains empty table rows`);
  }
  const metaPath = join(dir, 'contract.meta.json');
  if (await pathExists(metaPath)) {
    try {
      const meta = JSON.parse(await readFile(metaPath, 'utf8'));
      if (meta.contractVersion !== '0.2') warnings.push('contract.meta.json: expected contractVersion 0.2');
      if (!contexts.includes(meta.context)) warnings.push('contract.meta.json: invalid context');
    } catch {
      throw new Error('contract.meta.json is not valid JSON.');
    }
  } else warnings.push('contract.meta.json: missing metadata file');
  if (warnings.length && options.strict) throw new Error(`Contract validation failed:\n- ${warnings.join('\n- ')}`);
  return { dir, valid: true, warnings };
}

async function checkEvidence(options) {
  const dir = resolve(options.dir);
  const manifestPath = join(dir, 'evidence-manifest.json');
  if (!(await pathExists(manifestPath))) throw new Error(`Evidence manifest not found: ${manifestPath}`);
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { throw new Error('evidence-manifest.json is not valid JSON.'); }
  if (!Array.isArray(manifest.items)) throw new Error('Evidence manifest must contain an items array.');
  const results = [];
  for (const item of manifest.items) {
    const candidatePaths = item.path ? [join(dir, item.path), join(dir, '..', '..', item.path)] : [];
    const existingPath = (await Promise.all(candidatePaths.map(async (candidate) => (await pathExists(candidate)) ? candidate : null))).find(Boolean) || null;
    results.push({ id: item.id || 'unnamed', status: item.status || 'missing', path: item.path || null, resolvedPath: existingPath, exists: Boolean(existingPath) });
  }
  const pending = results.filter((item) => item.status === 'pending' || !item.exists);
  if (pending.length && options.strict) throw new Error(`Evidence validation failed: ${pending.length} item(s) pending or missing.`);
  return { manifest: manifestPath, total: results.length, ready: results.length - pending.length, pending: pending.length, items: results };
}

function hashRecord(record) {
  const payload = { ...record };
  delete payload.contentHash;
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

function statusFrom(validation, evidence) {
  if (validation.warnings.length || evidence.pending > 0) return 'ready-with-risks';
  return 'ready';
}

async function loadPackageVersion() {
  try {
    const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

async function recordCompletion(options) {
  if (!approvals.includes(options.approval)) throw new Error(`Invalid approval '${options.approval}'. Use ${approvals.join(', ')}.`);
  const projectDir = resolve(options.projectDir);
  const contract = await validateContract({ ...options, strict: false });
  const evidence = await checkEvidence({ ...options, strict: false });
  let context = 'unknown';
  const metaPath = join(resolve(options.dir), 'contract.meta.json');
  if (await pathExists(metaPath)) {
    try { context = JSON.parse(await readFile(metaPath, 'utf8')).context || context; } catch { /* validation already reports malformed metadata */ }
  }
  const version = await loadPackageVersion();
  const record = {
    recordVersion: '1.0',
    generatedBy: { name: skillName, version },
    contractVersion: '0.2',
    context: contexts.includes(context) ? context : 'unknown',
    task: options.task,
    status: statusFrom(contract, evidence),
    completedAt: new Date().toISOString(),
    agentSurface: options.agentSurface || 'unknown',
    validation: {
      contract: contract.warnings.length ? 'passed-with-warnings' : 'passed',
      evidence: evidence.pending ? 'passed-with-pending' : 'passed',
      evidenceCount: evidence.total,
      pendingEvidenceCount: evidence.pending,
      warnings: contract.warnings,
    },
    humanApproval: { status: options.approval, notes: options.notes || '' },
  };
  record.contentHash = hashRecord(record);
  const outputDir = join(projectDir, '.interfacecraft');
  if (!options.dryRun) {
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, 'completion-record.json'), `${JSON.stringify(record, null, 2)}\n`);
    const line = `InterfaceCraft Studio v${version} · Contract validated · Evidence: ${evidence.total} items · Status: ${record.status}`;
    const markdown = `# InterfaceCraft Completion\n\n${line}\n\n- Context: ${record.context}\n- Task: ${record.task}\n- Agent surface: ${record.agentSurface}\n- Completed at: ${record.completedAt}\n- Record integrity: ${record.contentHash}\n- Human approval: ${record.humanApproval.status}\n${record.notes ? `- Notes: ${record.notes}\n` : ''}`;
    await writeFile(join(outputDir, 'COMPLETION.md'), `${markdown}\n`);
    console.log(line);
    console.log(`Wrote ${join(outputDir, 'completion-record.json')}`);
  } else console.log(`would write completion record -> ${join(outputDir, 'completion-record.json')}`);
}

async function verifyCompletion(options) {
  const path = join(resolve(options.projectDir), '.interfacecraft', 'completion-record.json');
  if (!(await pathExists(path))) throw new Error(`Completion record not found: ${path}`);
  let record;
  try { record = JSON.parse(await readFile(path, 'utf8')); } catch { throw new Error('completion-record.json is not valid JSON.'); }
  const expected = hashRecord(record);
  const valid = expected === record.contentHash;
  const result = { path, valid, contentHash: record.contentHash, expectedHash: expected, status: record.status, context: record.context, generatedBy: record.generatedBy };
  if (!valid && options.strict) throw new Error(`Completion record integrity check failed. Expected ${expected}, found ${record.contentHash}.`);
  console.log(JSON.stringify(result, null, 2));
}

async function doctor(options) {
  console.log(`Package root: ${packageRoot}`);
  console.log(`Platform: ${process.platform} | Node: ${process.version}`);
  for (const [label, destination] of [
    ['Claude Code user', homePath('.claude', 'skills', skillName)],
    ['Codex user', homePath('.agents', 'skills', skillName)],
    ['Claude Code project', join(resolve(options.projectDir), '.claude', 'skills', skillName)],
    ['Codex project', join(resolve(options.projectDir), '.agents', 'skills', skillName)],
    ['Completion record', join(resolve(options.projectDir), '.interfacecraft', 'completion-record.json')],
  ]) console.log(`${(await pathExists(destination)) ? 'installed' : 'missing '}  ${label}: ${destination}`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp();
  if (command === 'validate') return validate();
  if (command === 'doctor') return doctor(options);
  if (command === 'install') {
    await validate();
    for (const [label, destination] of targets(options)) {
      console.log(`${options.dryRun ? 'would install' : 'installing'}  ${label} -> ${destination}`);
      await copySkill(destination, options);
    }
    if (!options.dryRun) console.log('\nInstallation complete. Restart the agent if it does not discover the skill automatically.');
    return;
  }
  if (command === 'scaffold') return scaffold(options);
  if (command === 'detect-context') return detectContext(options);
  if (command === 'validate-contract') return console.log(JSON.stringify(await validateContract(options), null, 2));
  if (command === 'check-evidence') return console.log(JSON.stringify(await checkEvidence(options), null, 2));
  if (command === 'record-completion') return recordCompletion(options);
  if (command === 'verify-completion') return verifyCompletion(options);
  throw new Error(`Unknown command '${command}'.`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
