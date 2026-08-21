# Changelog

All notable changes to InterfaceCraft Studio are documented here.

## [0.3.1] — Schema and validation hardening

### Added

- Synchronized shipped Experience Contract, completion-record, traceability, and evidence-manifest schemas with the v0.3 runtime.
- Added `schemas/evidence-manifest.schema.json` with typed evidence items and status enum: `pending`, `ready`, `failed`, `skipped`, and `not-applicable`.
- Added Ajv-backed runtime schema validation and generated scaffold/completion-record conformance tests.
- Added adversarial tests for escaped evidence paths, invalid evidence statuses and IDs, broken references, and missing CLI option values.

### Changed

- Evidence paths are canonicalized with `resolve()` and rejected when absolute or outside the allowed project root.
- Evidence criteria and state references are validated completely rather than accepting a single matching ID.
- Traceability graphs now contain typed nodes and relation-bearing edges derived from `schemas/artifact-rules.json`.
- `--min-score` now gates `detect-context`; option values and enum options are validated before command execution.
- `COMPLETION.md` now renders human approval notes; completion verification checks both SHA-256 integrity and the shipped schema.

### Release status

Version 0.3.1 is prepared for CI and tag validation. npm publication remains a separate action requiring explicit confirmation.

## [0.3.0] — Development release

### Added

- Modular CLI runtime split into argument parsing, installer, context detector, contract validator, evidence validator, scaffolder, skill validator, filesystem utilities, and provenance modules.
- Semantic contract validation backed by `schemas/artifact-rules.json`, including required sections, stable artifact IDs, evidence references, and cross-artifact traceability graph output.
- Traceability IDs connecting `BRF`, `JNY`, `SCR`, `ST`, `CMP`, `ACC`, and `EVD` artifacts.
- Context detector scoring with ranked results, confidence, score margin, signal evidence, and human-review flag.
- Eight real-world mini-project fixtures and evaluation harness with 8/8 expected context classifications.
- Semantic validator test and fixture regression test integrated into `npm test` and the package release gate.

### Fixed

- Installer now copies files and directories correctly across platforms after the CLI modularization.
- CLI package-root resolution uses `fileURLToPath` for Windows-safe URL handling.

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
