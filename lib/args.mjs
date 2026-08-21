import { resolve } from 'node:path';

export const contexts = ['web-experience', 'web-app', 'game-experience', 'playable-web-game'];
export const approvals = ['not-requested', 'pending', 'approved', 'rejected'];

export function parseArgs(argv, cwd = process.cwd()) {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith('-') ? args.shift() : 'install';
  const options = {
    target: 'both',
    projectDir: cwd,
    dir: resolve(cwd, 'design', 'experience-contract'),
    context: 'web-app',
    force: false,
    dryRun: false,
    strict: false,
    semantic: false,
    trace: false,
    task: 'Experience Contract completion',
    agentSurface: process.env.INTERFACECRAFT_AGENT || 'unknown',
    approval: 'not-requested',
    notes: '',
    minScore: 0,
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--semantic') options.semantic = true;
    else if (arg === '--trace') options.trace = true;
    else if (arg === '--task') options.task = args[++i];
    else if (arg === '--agent-surface') options.agentSurface = args[++i];
    else if (arg === '--approval') options.approval = args[++i];
    else if (arg === '--notes') options.notes = args[++i];
    else if (arg === '--target') options.target = args[++i];
    else if (arg === '--project-dir') options.projectDir = resolve(args[++i]);
    else if (arg === '--dir') options.dir = resolve(args[++i]);
    else if (arg === '--context') options.context = args[++i];
    else if (arg === '--min-score') options.minScore = Number(args[++i]);
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!Number.isFinite(options.minScore) || options.minScore < 0 || options.minScore > 1) {
    throw new Error('--min-score must be a number from 0 to 1.');
  }
  return { command, options };
}

export function printHelp(skillName) {
  console.log(`
${skillName} — experience engineering toolkit v0.3

Usage:
  npx interfacecraft-studio <command> [options]

Commands:
  install             Install for Claude Code, Codex, or project-local agents
  scaffold            Create an Experience Contract
  detect-context      Score project signals and recommend a context
  validate-contract   Validate artifacts semantically and traceability links
  check-evidence      Validate evidence manifest and referenced files
  record-completion   Write neutral completion provenance
  verify-completion   Verify completion record integrity
  doctor              Inspect installations and project artifacts
  validate            Validate the packaged SKILL.md

Options:
  --target <name>       claude | codex | both | project (default: both)
  --project-dir <path>  Project directory for detection, install, and provenance
  --dir <path>          Contract directory (default: design/experience-contract)
  --context <name>      web-experience | web-app | game-experience | playable-web-game
  --semantic            Enable semantic and traceability validation
  --trace               Print traceability graph details
  --strict              Fail on warnings, unresolved links, or pending evidence
  --min-score <n>       Minimum context score from 0 to 1
  --force               Replace existing installation or contract
  --dry-run             Print actions without changing files
  --task <text>         Human-readable completed task description
  --agent-surface <id>  claude-code | codex | manual | unknown
  --approval <status>   not-requested | pending | approved | rejected
  --notes <text>        Human approval or risk notes

Examples:
  npx interfacecraft-studio scaffold --context web-app
  npx interfacecraft-studio detect-context --project-dir . --min-score 0.55
  npx interfacecraft-studio validate-contract --dir ./design/experience-contract --semantic --strict
  npx interfacecraft-studio record-completion --project-dir . --trace
`);
}
