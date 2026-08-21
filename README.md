# InterfaceCraft Studio

**InterfaceCraft Studio** is an Experience Engineering System for agent-built interfaces. It helps coding agents design, specify, implement, and verify UI/UX for games, websites, web applications, and playable web games through a state-first, evidence-based Experience Contract.

The package does not compete on the number of visual styles or palettes. Its purpose is to connect intent, user/player journey, interface states, interaction behavior, visual tokens, platform adaptation, implementation handoff, accessibility, and proof.

## Install from npm

After the package is published:

```bash
npm install --global interfacecraft-studio
interfacecraft-studio install --target both
```

The CLI requires **Node.js 18 or newer**, uses only Node.js standard-library APIs, and is designed for macOS, Windows, and Linux. No Bash, PowerShell, Python, or platform-specific path syntax is required.

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

## v0.3 contract workflow

Scaffold a contract inside a project before designing or implementing a substantial experience:

```bash
interfacecraft-studio scaffold --dir ./design/experience-contract --context web-app
```

Available contexts are `web-experience`, `web-app`, `game-experience`, and `playable-web-game`. The scaffold creates the brief, journey, screen map, state matrix, interaction contract, visual direction, platform rules, component contract, acceptance checklist, evidence manifest, and v0.3 metadata.

Every artifact uses stable traceability IDs:

| Prefix | Meaning |
|---|---|
| `BRF-*` | Brief and intent |
| `JNY-*` | Journey and decisions |
| `SCR-*` | Screen, HUD, menu, or surface |
| `ST-*` | State |
| `CMP-*` | Component |
| `ACC-*` | Acceptance criterion |
| `EVD-*` | Evidence |

The intended chain is **Journey → Screen → State → Component → Acceptance → Evidence**. An acceptance criterion without evidence, or a state without a surface and component owner, is incomplete.

## Scored context detection

Inspect project context before selecting an adapter:

```bash
interfacecraft-studio detect-context --project-dir . --min-score 0.55
```

The detector returns a ranked list with `score`, `confidence`, `margin`, signal evidence, and `reviewRequired`. A low-confidence or narrow-margin result should be confirmed by a human rather than silently treated as truth.

## Semantic validation

Structural validation is useful while drafting. Release and handoff validation should be semantic:

```bash
interfacecraft-studio validate-contract \
  --dir ./design/experience-contract \
  --semantic \
  --strict

interfacecraft-studio check-evidence \
  --dir ./design/experience-contract \
  --strict
```

Semantic validation checks required sections, machine-readable metadata, stable IDs, evidence references, state coverage, and cross-artifact traceability links. The rules are published in `schemas/artifact-rules.json`; the graph shape is defined in `schemas/traceability.schema.json`.

## Completion record and provenance

After contract and evidence review, write a neutral completion record:

```bash
interfacecraft-studio record-completion \
  --project-dir . \
  --dir ./design/experience-contract \
  --task "Design and verify the settings flow" \
  --agent-surface codex \
  --approval pending
```

This creates `.interfacecraft/completion-record.json` and `.interfacecraft/COMPLETION.md`. The v0.3 record includes semantic validation status, evidence counts, traceability node/edge counts, timestamp, optional self-reported agent surface, human approval state, and a SHA-256 integrity hint.

The record is **provenance, not identity**. It shows that the InterfaceCraft workflow was applied and validated; it does not prove which model, agent, user, or machine performed the task.

## Real-world fixture evaluation

The repository includes eight representative mini-project fixtures covering public websites, authenticated web apps, native games, playable browser games, content sites, design systems, desktop shells, and commerce apps. Run the scoring evaluation with:

```bash
npm run test:fixtures
```

The fixture corpus is a regression boundary for context routing. It currently achieves **8/8 expected context classifications** and reports confidence and margin for every case.

## Using the skill

In **Claude Code**, use `/interfacecraft-studio` when the skill is installed in a Claude Code skill directory, or ask Claude to use InterfaceCraft Studio for a design task. In **Codex**, use `/skills` or `$interfacecraft-studio` depending on the client surface, or ask Codex to use the skill explicitly. Project-local installation is recommended when contract and proof artifacts belong in version control.

## Repository layout

```text
interfacecraft-studio/
├── SKILL.md
├── agents/openai.yaml
├── .claude-plugin/plugin.json
├── references/
├── templates/experience-contract/
├── schemas/
├── lib/                          # Modular runtime: installer, detector, validators, provenance
├── fixtures/                     # Eight real-world mini-project evaluation fixtures
├── tests/                        # Field, semantic, and fixture evaluation tests
├── demo/state-playground/
├── bin/interfacecraft-studio.mjs # Thin CLI router
├── package.json
└── README.md
```

## Development and release

Run the complete local gate:

```bash
npm ci
npm test
npm run validate
npm run pack:check
npm pack
```

`npm test` runs the cross-platform field test, semantic contract test, and eight-fixture context evaluation. GitHub Actions runs the same package gate on Node 18 and current LTS across Ubuntu, macOS, and Windows.

The package version is currently `0.3.0` in development. The source repository is [lenhonbp/interfacecraft-studio](https://github.com/lenhonbp/interfacecraft-studio). Publish only after reviewing the changelog, package contents, npm identity, and release tag:

```bash
npm login
npm publish --access public
```

## Compatibility notes

The canonical skill format is agent-neutral: one `SKILL.md` plus optional references, templates, scripts, schemas, and metadata. Claude Code and Codex discover the same skill content through their own locations, while `agents/openai.yaml` and `.claude-plugin/plugin.json` provide optional host-specific metadata. The CLI copies the same trusted content to the selected target and never executes downloaded content.

A single npm package cannot force every agent to discover a skill automatically because each agent has its own discovery path and permissions. Use the explicit install target, verify with `doctor`, and restart the agent when its discovery index requires it.

## License

MIT. See `LICENSE`.
