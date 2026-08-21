import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { contexts } from './args.mjs';
import { listFiles, projectRelative } from './fs-utils.mjs';

const weights = {
  'web-experience': { publicPage: 0.30, content: 0.20, marketing: 0.22, noAppSignals: 0.12, genericWeb: 0.10 },
  'web-app': { frontendFramework: 0.34, appRoutes: 0.22, formsData: 0.18, authSignals: 0.14, appShell: 0.12, commerce: 0.28, designSystem: 0.12 },
  'game-experience': { engineProject: 0.48, gameplayCode: 0.20, hudSignals: 0.14, inputBindings: 0.10, assetTree: 0.08 },
  'playable-web-game': { browserEngine: 0.36, canvasSignals: 0.22, gameLoop: 0.18, controls: 0.14, renderAssets: 0.10 },
};

const packages = {
  frontendFramework: /\b(next|react|vue|svelte|angular|nuxt|remix|astro|solid)\b/i,
  browserEngine: /\b(phaser|pixi|three|babylon|playcanvas|matter-js|kaboom|melonjs)\b/i,
  gameLoop: /requestAnimationFrame|gameLoop|update\s*\(|render\s*\(/i,
  controls: /keyboard|controller|gamepad|pointerlock|touchstart|arrowkeys|wasd/i,
  authSignals: /auth|login|session|oauth|account|profile/i,
  formsData: /form|schema|query|mutation|table|dashboard|settings/i,
};

function bump(signals, key, weight, evidence) {
  signals.push({ key, weight, evidence });
}

export async function detectContext(projectDir) {
  const files = await listFiles(projectDir, 5);
  const names = projectRelative(projectDir, files);
  const packageNames = names.filter((name) => name === 'package.json' || name.endsWith('/package.json'));
  const packageTexts = [];
  for (const file of packageNames.slice(0, 20)) {
    try { packageTexts.push(await readFile(join(projectDir, file), 'utf8')); } catch { /* ignore unreadable */ }
  }
  const blob = `${names.join('\n')}\n${packageTexts.join('\n')}`;
  const scores = Object.fromEntries(contexts.map((context) => [context, { raw: 0, score: 0, signals: [] }]));

  if (names.some((name) => /(^|\/)project\.godot$|\.uproject$|(^|\/)Assets\/ProjectSettings(\/|$)/i.test(name))) {
    bump(scores['game-experience'].signals, 'engineProject', weights['game-experience'].engineProject, 'Godot, Unreal, or Unity project fingerprint');
  }
  if (/(^|\/)(player|enemy|npc|combat|quest|level|scene|hud|inventory)(\/|\.|$)/i.test(blob)) {
    bump(scores['game-experience'].signals, 'gameplayCode', weights['game-experience'].gameplayCode, 'Gameplay-oriented file or directory names');
    bump(scores['game-experience'].signals, 'hudSignals', weights['game-experience'].hudSignals, 'Game HUD/inventory surface signal');
  }
  if (packages.frontendFramework.test(blob)) bump(scores['web-app'].signals, 'frontendFramework', weights['web-app'].frontendFramework, 'Frontend framework dependency');
  if (packages.formsData.test(blob)) {
    bump(scores['web-app'].signals, 'formsData', weights['web-app'].formsData, 'Data/form/application surface signal');
    bump(scores['web-app'].signals, 'appRoutes', weights['web-app'].appRoutes, 'Application route or feature signal');
  }
  if (names.some((name) => /(^|\/)(pages|routes|views|screens|dashboard|checkout|orders|settings|admin)(\/|\.|$)/i.test(name))) {
    bump(scores['web-app'].signals, 'appRoutes', weights['web-app'].appRoutes, 'Application route or feature path');
  }
  if (packages.authSignals.test(blob)) bump(scores['web-app'].signals, 'authSignals', weights['web-app'].authSignals, 'Authentication/account signal');
  if (/(^|\/)(checkout|cart|orders|inventory|products|billing)(\.|\/|$)/i.test(blob)) bump(scores['web-app'].signals, 'commerce', weights['web-app'].commerce, 'Commerce workflow or transactional route');
  if (/(storybook|design[-_ ]system|tokens|stories\.tsx|components\/)/i.test(blob)) bump(scores['web-app'].signals, 'designSystem', weights['web-app'].designSystem, 'Component library or design-system signal');
  if (packages.browserEngine.test(blob)) bump(scores['playable-web-game'].signals, 'browserEngine', weights['playable-web-game'].browserEngine, 'Browser game/rendering engine dependency');
  if (names.some((name) => /(^|\/)(canvas|game|playfield|engine|renderer)(\/|\.|$)/i.test(name))) bump(scores['playable-web-game'].signals, 'canvasSignals', weights['playable-web-game'].canvasSignals, 'Canvas/game/rendering file path');
  if (packages.gameLoop.test(blob)) bump(scores['playable-web-game'].signals, 'gameLoop', weights['playable-web-game'].gameLoop, 'Animation or game loop signal');
  if (packages.controls.test(blob)) bump(scores['playable-web-game'].signals, 'controls', weights['playable-web-game'].controls, 'Interactive input signal');
  if (names.some((name) => /(^|\/)(index|about|landing|marketing|pages)(\.|\/)/i.test(name))) {
    bump(scores['web-experience'].signals, 'publicPage', weights['web-experience'].publicPage, 'Public page or marketing surface');
    bump(scores['web-experience'].signals, 'marketing', weights['web-experience'].marketing, 'Content/marketing route signal');
  }
  if (/(content|copy|blog|docs|mdx|article|pricing|features)/i.test(blob)) bump(scores['web-experience'].signals, 'content', weights['web-experience'].content, 'Content-heavy surface signal');
  if (names.some((name) => /(^|\/)(src|app|components|pages)(\/|$)/i.test(name))) bump(scores['web-experience'].signals, 'genericWeb', weights['web-experience'].genericWeb, 'Generic web project structure');

  for (const result of Object.values(scores)) {
    result.raw = result.signals.reduce((sum, signal) => sum + signal.weight, 0);
    result.score = Math.min(1, Number(result.raw.toFixed(3)));
  }
  const ranking = contexts.map((context) => ({ context, score: scores[context].score, signals: scores[context].signals })).sort((a, b) => b.score - a.score);
  const winner = ranking[0];
  const runnerUp = ranking[1];
  const margin = Number((winner.score - runnerUp.score).toFixed(3));
  const confidence = winner.score >= 0.7 && margin >= 0.15 ? 'high' : winner.score >= 0.45 && margin >= 0.08 ? 'medium' : 'low';
  return { projectDir, recommendedContext: winner.context, confidence, margin, scores: ranking, reviewRequired: confidence === 'low' || margin < 0.08, signals: names.slice(0, 80) };
}
