import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../fixtures/', import.meta.url);
const fixtures = {
  'website': { expected: 'web-experience', files: { 'package.json': { dependencies: { astro: '^5.0.0' } }, 'src/pages/index.astro': '<main>Marketing landing page</main>', 'src/content/pricing.md': '# Pricing' } },
  'web-app': { expected: 'web-app', files: { 'package.json': { dependencies: { next: '^15.0.0', react: '^19.0.0' } }, 'app/dashboard/page.tsx': 'export default function Dashboard(){return <form />}', 'src/auth/session.ts': 'export const session = {}' } },
  'game': { expected: 'game-experience', files: { 'project.godot': '[application]\nconfig/name="Sky Harbor"', 'scenes/hud.tscn': '[gd_scene]', 'scripts/player.gd': 'func update(): pass' } },
  'playable-web-game': { expected: 'playable-web-game', files: { 'package.json': { dependencies: { phaser: '^3.0.0' } }, 'src/game/gameLoop.ts': 'requestAnimationFrame(gameLoop)', 'src/game/input.ts': 'const controls = { keyboard: true }', 'public/assets/player.png': 'fixture' } },
  'content-site': { expected: 'web-experience', files: { 'package.json': { dependencies: { astro: '^5.0.0' } }, 'src/pages/about.astro': '<article>About</article>', 'src/content/blog/launch.md': '# Launch' } },
  'design-system': { expected: 'web-app', files: { 'package.json': { dependencies: { react: '^19.0.0', storybook: '^8.0.0' } }, 'src/components/Button.stories.tsx': 'export default {}', 'src/components/Button.tsx': 'export function Button(){}' } },
  'desktop-shell': { expected: 'web-app', files: { 'package.json': { dependencies: { electron: '^32.0.0', react: '^19.0.0' } }, 'src/windows/settings.tsx': 'export default function Settings(){return <form />}', 'src/auth/account.ts': 'export const account = {}' } },
  'commerce-app': { expected: 'web-app', files: { 'package.json': { dependencies: { vue: '^3.0.0' } }, 'src/pages/checkout.vue': '<template><form /></template>', 'src/pages/orders.vue': '<template><table /></template>' } },
};

for (const [name, fixture] of Object.entries(fixtures)) {
  const dir = new URL(`${name}/`, root);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('expected.json', dir), `${JSON.stringify({ fixture: name, expectedContext: fixture.expected }, null, 2)}\n`);
  for (const [relative, value] of Object.entries(fixture.files)) {
    const target = new URL(relative, dir);
    await mkdir(new URL('./', target), { recursive: true });
    const content = typeof value === 'string' ? value : JSON.stringify({ name: `${name}-fixture`, ...value }, null, 2);
    await writeFile(target, content);
  }
}
console.log(`Generated ${Object.keys(fixtures).length} fixtures.`);
