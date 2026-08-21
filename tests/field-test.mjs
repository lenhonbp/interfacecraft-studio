import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const cli = join(root, 'bin', 'interfacecraft-studio.mjs');

async function run(args, cwd) {
  return exec(process.execPath, [cli, ...args], { cwd, windowsHide: true });
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function detect(project, expected) {
  const { stdout } = await run(['detect-context', '--project-dir', project], root);
  const result = JSON.parse(stdout);
  assert.equal(result.context, expected, `${project} should detect ${expected}`);
}

const work = await mkdtemp(join(tmpdir(), 'interfacecraft-field-'));
try {
  const website = join(work, 'website');
  const webApp = join(work, 'web-app');
  const playableGame = join(work, 'playable-game');
  const nativeGame = join(work, 'native-game');
  await Promise.all([website, webApp, playableGame, nativeGame].map((dir) => mkdir(dir, { recursive: true })));
  await writeFile(join(website, 'index.html'), '<!doctype html><title>Website</title>\n');
  await writeFile(join(webApp, 'package.json'), '{"dependencies":{"react":"19.0.0","vite":"6.0.0"}}\n');
  await writeFile(join(playableGame, 'package.json'), '{"dependencies":{"phaser":"4.0.0","vite":"6.0.0"}}\n');
  await writeFile(join(nativeGame, 'project.godot'), '[application]\nconfig/name="Field Game"\n');

  await run(['validate'], root);
  await detect(website, 'web-experience');
  await detect(webApp, 'web-app');
  await detect(playableGame, 'playable-web-game');
  await detect(nativeGame, 'game-experience');

  const contract = join(webApp, 'design', 'experience-contract');
  await run(['scaffold', '--dir', contract, '--context', 'web-app'], root);
  const validation = await run(['validate-contract', '--dir', contract], root);
  assert.match(validation.stdout, /"valid": true/);
  const evidence = await run(['check-evidence', '--dir', contract], root);
  assert.match(evidence.stdout, /"pending": 2/);

  await run(['record-completion', '--project-dir', webApp, '--dir', contract, '--task', 'Field test web app', '--agent-surface', 'manual', '--approval', 'pending'], root);
  const verified = await run(['verify-completion', '--project-dir', webApp, '--strict'], root);
  assert.match(verified.stdout, /"valid": true/);
  const recordPath = join(webApp, '.interfacecraft', 'completion-record.json');
  const record = JSON.parse(await readFile(recordPath, 'utf8'));
  record.task = 'Tampered task';
  await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`);
  await assert.rejects(() => run(['verify-completion', '--project-dir', webApp, '--strict'], root));

  const projectInstall = join(work, 'project-install');
  await mkdir(projectInstall, { recursive: true });
  await run(['install', '--target', 'project', '--project-dir', projectInstall], root);
  assert.equal(await exists(join(projectInstall, '.claude', 'skills', 'interfacecraft-studio', 'SKILL.md')), true);
  assert.equal(await exists(join(projectInstall, '.agents', 'skills', 'interfacecraft-studio', 'schemas', 'completion-record.schema.json')), true);

  console.log('InterfaceCraft field test passed');
} finally {
  await rm(work, { recursive: true, force: true });
}
