import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { contexts } from './args.mjs';
import { contractFiles } from './contract-validator.mjs';
import { pathExists } from './fs-utils.mjs';

export async function scaffold({ packageRoot, options }) {
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
  for (const file of contractFiles) await writeFile(join(options.dir, file), await (await import('node:fs/promises')).readFile(join(packageRoot, 'templates', 'experience-contract', file)));
  await writeFile(join(options.dir, 'contract.meta.json'), `${JSON.stringify({ contractVersion: '0.3', context: options.context, project: { name: '', platform: '', owner: '' }, traceability: { enabled: true, idFormat: 'PREFIX-###' } }, null, 2)}\n`);
  console.log(`Scaffolded ${options.context} Experience Contract v0.3 at ${options.dir}`);
}
