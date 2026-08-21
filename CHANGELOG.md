# Changelog

All notable changes to InterfaceCraft Studio are documented here.

## [0.2.0] — Release candidate

### Added

- Experience Contract workflow for `web-experience`, `web-app`, `game-experience`, and `playable-web-game` contexts.
- State-first templates for journeys, screen maps, state matrices, interaction contracts, visual direction, platform rules, component contracts, acceptance criteria, and evidence manifests.
- Cross-platform Node.js CLI commands for installation, context detection, contract scaffolding, contract validation, evidence validation, completion records, and provenance verification.
- Neutral `.interfacecraft/completion-record.json` and human-readable `COMPLETION.md` artifacts with SHA-256 integrity hints.
- Claude Code and Codex metadata, project-local and user-global installation targets, machine-readable JSON schemas, and an offline state playground proof kit.
- Cross-platform `npm test` field test and GitHub Actions coverage for Node 18 and current LTS on Ubuntu, macOS, and Windows.

### Fixed

- Normalized CRLF line endings during SKILL.md validation so Windows checkouts pass the same frontmatter validation as Unix-like systems.

### Release status

This version is a release candidate. The package has passed local and GitHub Actions validation. npm publication and the `v0.2.0` tag remain separately authorized release actions.
