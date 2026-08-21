import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function validateSkill(packageRoot) {
  const skillPath = join(packageRoot, 'SKILL.md');
  const rawContent = await readFile(skillPath, 'utf8');
  const content = rawContent.replace(/\r\n/g, '\n');
  if (!content.startsWith('---\n')) throw new Error('SKILL.md must start with YAML frontmatter.');
  const end = content.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('SKILL.md frontmatter must close with --- on its own line.');
  const frontmatter = content.slice(4, end);
  if (!/^name:\s*[^\n]+$/m.test(frontmatter)) throw new Error('SKILL.md frontmatter requires name.');
  if (!/^description:\s*[^\n]+$/m.test(frontmatter)) throw new Error('SKILL.md frontmatter requires description.');
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() || '';
  if (!/^[-a-z0-9]+$/.test(name)) throw new Error('Skill name must use lowercase letters, numbers, and hyphens.');
  return { path: skillPath, valid: true, name };
}
