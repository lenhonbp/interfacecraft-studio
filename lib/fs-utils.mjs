import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

export async function pathExists(path) {
  try { await stat(path); return true; } catch { return false; }
}

export async function writeJson(path, value) {
  await mkdir(join(path, '..'), { recursive: true }).catch(() => {});
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function listFiles(root, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];
  let entries = [];
  try { entries = await readdir(root, { withFileTypes: true }); } catch { return []; }
  const output = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
    const full = join(root, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(full, maxDepth, currentDepth + 1));
    else output.push(full);
  }
  return output;
}

export function projectRelative(projectDir, files) {
  return files.map((file) => relative(projectDir, file).replaceAll('\\', '/'));
}

export async function copyTree(source, destination) {
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
}

export async function replaceTree(destination, force, dryRun) {
  if (await pathExists(destination)) {
    if (!force) throw new Error(`Destination exists: ${destination}. Re-run with --force to replace it.`);
    if (!dryRun) await rm(destination, { recursive: true, force: true });
  }
  if (!dryRun) await mkdir(destination, { recursive: true });
}
