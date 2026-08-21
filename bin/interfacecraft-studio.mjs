#!/usr/bin/env node

import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, printHelp } from '../lib/args.mjs';
import { detectContext } from '../lib/context-detector.mjs';
import { validateContract } from '../lib/contract-validator.mjs';
import { checkEvidence } from '../lib/evidence-validator.mjs';
import { installSkill, homePath, skillName, targets } from '../lib/installer.mjs';
import { pathExists } from '../lib/fs-utils.mjs';
import { scaffold } from '../lib/scaffolder.mjs';
import { validateSkill } from '../lib/skill-validator.mjs';
import { recordCompletion, verifyCompletion } from '../lib/provenance.mjs';

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

async function doctor(options) {
  console.log(`Package root: ${packageRoot}`);
  console.log(`Platform: ${process.platform} | Node: ${process.version}`);
  const checks = [
    ...targets({ target: 'both' }, options.projectDir).map(([label, path]) => [label, path]),
    ['Claude Code project', join(resolve(options.projectDir), '.claude', 'skills', skillName)],
    ['Codex project', join(resolve(options.projectDir), '.agents', 'skills', skillName)],
    ['Completion record', join(resolve(options.projectDir), '.interfacecraft', 'completion-record.json')],
  ];
  for (const [label, path] of checks) console.log(`${(await pathExists(path)) ? 'installed' : 'missing '}  ${label}: ${path}`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (options.help) return printHelp(skillName);
  if (command === 'validate') {
    const result = await validateSkill(packageRoot);
    console.log(`Valid skill: ${result.path}`);
    return;
  }
  if (command === 'doctor') return doctor(options);
  if (command === 'install') {
    await validateSkill(packageRoot);
    return installSkill({ packageRoot, options });
  }
  if (command === 'scaffold') return scaffold({ packageRoot, options });
  if (command === 'detect-context') return console.log(JSON.stringify(await detectContext(resolve(options.projectDir)), null, 2));
  if (command === 'validate-contract') return console.log(JSON.stringify(await validateContract({ dir: options.dir, strict: options.strict, semantic: options.semantic || options.strict }), null, 2));
  if (command === 'check-evidence') return console.log(JSON.stringify(await checkEvidence({ dir: options.dir, strict: options.strict }), null, 2));
  if (command === 'record-completion') return recordCompletion({ packageRoot, options });
  if (command === 'verify-completion') return verifyCompletion(options.projectDir, options.strict);
  throw new Error(`Unknown command '${command}'.`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
