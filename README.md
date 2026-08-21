# InterfaceCraft Studio

**InterfaceCraft Studio** is an Experience Engineering System for agent-built interfaces. It helps coding agents design, specify, implement, and verify UI/UX for games, websites, web applications, and playable web games through a single state-first, evidence-based Experience Contract.

The package does not compete on the number of visual styles or palettes. Its purpose is to connect intent, user/player journey, interface states, interaction behavior, visual tokens, platform adaptation, implementation handoff, accessibility, and proof.

## Install from npm

After the package is published:

```bash
npm install --global interfacecraft-studio
interfacecraft-studio install --target both
```

The CLI requires **Node.js 18 or newer** and uses only Node.js standard-library APIs. It is designed for macOS, Windows, and Linux. No Bash, PowerShell, Python, or platform-specific path syntax is required.

For a local checkout or pre-publish test:

```bash
npm install --global .
interfacecraft-studio install --target both
```

## Installation targets

| Target | Destination | Use case |
|---|---|---|
| `claude` | `~/.claude/skills/interfacecraft-studio` | Personal Claude Code skill |
| `codex` | `~/.agents/skills/interfacecraft-studio` | Personal Codex skill |
| `both` | Both user directories | Recommended personal installation |
| `project` | `.claude/skills/interfacecraft-studio` and `.agents/skills/interfacecraft-studio` | Commit the skill with a project or monorepo |

On Windows, `~` resolves through the current user home directory. The CLI uses Node's path APIs, so the same commands work in PowerShell, Command Prompt, Git Bash, macOS Terminal, and Linux shells.

## Experience Contract workflow

Scaffold a contract inside a project before designing or implementing a substantial experience:

```bash
interfacecraft-studio scaffold --dir ./design/experience-contract --context web-app
```

Available contexts are `web-experience`, `web-app`, `game-experience`, and `playable-web-game`. The scaffold creates a brief, journey, screen map, state matrix, interaction contract, visual direction, platform rules, component contract, acceptance checklist, evidence manifest, and contract metadata.

Inspect the project context before choosing an adapter:

```bash
interfacecraft-studio detect-context --project-dir .
```

Validate contract completeness before handoff:

```bash
interfacecraft-studio validate-contract --dir ./design/experience-contract
interfacecraft-studio validate-contract --dir ./design/experience-contract --strict
```

The default validation reports placeholders and empty rows as warnings while a contract is being drafted. `--strict` turns those warnings into failures for CI or release gates.

Validate evidence separately:

```bash
interfacecraft-studio check-evidence --dir ./design/experience-contract
interfacecraft-studio check-evidence --dir ./design/experience-contract --strict
```

The evidence manifest links acceptance criteria to screenshots, manual traversals, recordings, automated checks, or runnable demos. Keep evidence paths project-relative and free of private data.

## Completion record and provenance

After the contract and evidence review, write a neutral completion record to the project root:

```bash
interfacecraft-studio record-completion \
  --project-dir . \
  --dir ./design/experience-contract \
  --task "Design and verify the settings flow" \
  --agent-surface codex \
  --approval pending
```

This creates `.interfacecraft/completion-record.json` and `.interfacecraft/COMPLETION.md`. The record includes the package version, contract version, selected context, task description, validation result, evidence counts, timestamp, optional self-reported agent surface, human approval state, and a SHA-256 integrity hint.

Verify the record later with:

```bash
interfacecraft-studio verify-completion --project-dir . --strict
```

The record is **provenance, not identity**. It shows that the InterfaceCraft workflow was applied and validated; it does not prove which model, agent, user, or machine performed the task. Do not put secrets or private account identifiers in it.

## Using the skill

In **Claude Code**, use `/interfacecraft-studio` when the skill is installed in a Claude Code skill directory, or ask Claude to use InterfaceCraft Studio for a design task. In **Codex**, use `/skills` or `$interfacecraft-studio` depending on the client surface, or ask Codex to use the skill explicitly. Project-local installation is recommended when the contract and proof artifacts belong in version control.

The skill is suitable for game HUDs and menus, website journeys, web app workflows, playable browser games, UX audits, redesigns, design systems, accessibility reviews, and frontend implementation handoff. It is intentionally not a replacement for engine-specific programming skills, a full game studio orchestration framework, or a large visual style catalog.

## Repository layout

```text
interfacecraft-studio/
├── SKILL.md                       # Canonical agent workflow
├── agents/openai.yaml             # Codex display metadata and policy
├── .claude-plugin/plugin.json     # Claude Code plugin metadata
├── references/                    # Progressive-disclosure guidance
├── templates/experience-contract/ # Contract artifacts
├── schemas/                      # Machine-readable contract metadata schema
├── demo/state-playground/         # Runnable state-first proof fixture
├── bin/interfacecraft-studio.mjs  # Cross-platform CLI
├── package.json                   # npm package manifest
└── README.md
```

## Development and release

Validate the skill, CLI, contract tooling, and package contents:

```bash
npm ci
npm test
npm run validate
npm run pack:check
npm pack
```

The package is currently configured as `0.2.0`. The source repository is [lenhonbp/interfacecraft-studio](https://github.com/lenhonbp/interfacecraft-studio). GitHub Actions runs the field test and package checks on Ubuntu, macOS, and Windows. Before publishing, review the package contents with `npm pack --dry-run`, set a real maintainer and license policy, authenticate with npm, and publish with an appropriate release version:

```bash
npm login
npm publish --access public
```

Do not publish until the package name, repository URL, author information, license, and content have been reviewed. A package published to npm cannot be assumed to be private or reversible.

## Compatibility notes

The canonical skill format is agent-neutral: one `SKILL.md` plus optional references, templates, scripts, schemas, and metadata. Claude Code and Codex discover the same skill content through their own locations, while `agents/openai.yaml` and `.claude-plugin/plugin.json` provide optional host-specific metadata. The CLI copies the same trusted content to the selected target and never executes downloaded content.

A single npm package cannot force every agent to discover a skill automatically because each agent has its own discovery path and permissions. Use the explicit install target, verify with `doctor`, and restart the agent when its discovery index requires it.

## License

MIT. See `LICENSE`.
