import { homedir } from 'node:os';
import { cp, mkdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathExists, replaceTree } from './fs-utils.mjs';

export const skillName = 'interfacecraft-studio';
export const skillFiles = ['SKILL.md', 'references', 'templates', 'schemas', 'agents', '.claude-plugin', 'demo'];

export function homePath(...parts) { return join(homedir(), ...parts); }

export function targets(options, projectDir) {
  const project = resolve(projectDir);
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

export async function installSkill({ packageRoot, options }) {
  for (const [label, destination] of targets(options, options.projectDir)) {
    if (await pathExists(destination) && !options.force) throw new Error(`Destination exists: ${destination}. Re-run with --force to replace it.`);
    console.log(`${options.dryRun ? 'would install' : 'installing'}  ${label} -> ${destination}`);
    if (options.dryRun) continue;
    await replaceTree(destination, true, false);
    for (const file of skillFiles) {
      const source = join(packageRoot, file);
      if (!(await pathExists(source))) continue;
      const target = join(destination, file);
      const sourceStat = await stat(source);
      await mkdir(dirname(target), { recursive: true });
      await cp(source, target, { recursive: sourceStat.isDirectory() });
    }
  }
  if (!options.dryRun) console.log('\nInstallation complete. Restart the agent if it does not discover the skill automatically.');
}
