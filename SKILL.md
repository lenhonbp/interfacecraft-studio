---
name: interfacecraft-studio
description: Experience engineering for agent-built game, website, web app, and playable web game interfaces. Use when designing, implementing, reviewing, or validating UI/UX, user/player journeys, state matrices, HUDs, menus, responsive systems, accessibility, design tokens, component contracts, or implementation-ready experience specifications.
---

# InterfaceCraft Studio

Design, specify, implement, and verify game and web experiences through a single **state-first, evidence-based Experience Contract**. Do not treat UI/UX as a collection of attractive screens. Treat it as a system connecting intent, journey, states, interaction, visual language, platform behavior, implementation, and proof.

## Non-negotiable principles

- Start from the user/player goal, context, constraints, and observable success criteria.
- Select one primary context before applying recommendations: `web-experience`, `web-app`, `game-experience`, or `playable-web-game`.
- Design states before visual polish. An omitted state is a defect unless it is explicitly marked not applicable with rationale.
- Separate UX structure, interaction behavior, and visual direction, then reconnect them through documented tokens and component contracts.
- Make every important action discoverable, every state explicit, every feedback loop understandable, and every recovery path usable.
- Adapt patterns to the platform. Never transfer web conventions to game HUDs or game conventions to business software without justification.
- Prefer semantic tokens, realistic content, purposeful motion, and clear hierarchy over decorative novelty.
- Treat accessibility, localization, responsive behavior, safe areas, input alternatives, performance, and interruption recovery as design requirements.
- End substantial work with observable acceptance criteria and evidence requirements. “Looks good” is not evidence.

## Context routing

Choose the primary context from the brief or project evidence:

- **`web-experience`** — public websites, landing pages, editorial, ecommerce, portfolio, marketing, and content journeys.
- **`web-app`** — authenticated products, dashboards, forms, data-heavy tools, permissions, workflows, and task systems.
- **`game-experience`** — native or engine-based game HUDs, menus, onboarding, feedback, progression, inventory, and settings.
- **`playable-web-game`** — browser games combining canvas or WebGL with DOM UI, pointer/touch input, resize, browser focus, and performance constraints.

Read `references/context-adapters.md` after selecting the context. If the project spans contexts, define the boundary and keep context-specific rules separate.

## Experience Contract workflow

For substantial work, create or update the contract artifacts in this order. Use `interfacecraft-studio scaffold` to generate the starter files when working in a repository.

### v0.3 operating rules

- Run `interfacecraft-studio detect-context --project-dir <project-dir>` before choosing an adapter. Treat `recommendedContext`, `confidence`, `margin`, and `reviewRequired` as evidence; if confidence is low or the margin is narrow, ask for human confirmation instead of silently guessing.
- Use stable IDs in every artifact: `BRF-*` brief, `JNY-*` journey, `SCR-*` screen, `ST-*` state, `CMP-*` component, `ACC-*` acceptance criterion, and `EVD-*` evidence.
- Connect Journey → Screen → State → Component → Acceptance → Evidence. Do not create an orphan state, acceptance criterion, or evidence item.
- Run `interfacecraft-studio validate-contract --dir <contract-dir> --semantic --strict` before calling a contract ready. Structural validation is acceptable only during early drafting.
- Use `interfacecraft-studio check-evidence --dir <contract-dir> --strict` to verify that EVD paths exist and reference ACC/ST IDs.
- For changes to the CLI or detector, run `npm test`; the fixture suite is a regression boundary, not a synthetic example to ignore.

1. **Frame the experience.** Complete `experience-brief.md`. Record audience, user/player situation, goal, success signal, non-goals, platform, input, constraints, assumptions, open questions, and acceptance criteria.
2. **Model the journey.** Complete `journey.md`. Map entry, steps, decisions, feedback, success, cancellation, interruption, failure, and recovery. Preserve user/player context across transitions.
3. **Map surfaces.** Complete `screen-map.md`. List screens, HUDs, overlays, menus, components, hierarchy, navigation, back behavior, deep links, pause/resume semantics, and boundaries.
4. **Enumerate states.** Complete `state-matrix.md` for each critical surface. Cover default, loading, empty, error, disabled, success, interrupted, long-content, localized, input-focus, and context-specific states. Mark non-applicable states with reasons.
5. **Specify interaction.** Complete `interaction-contract.md`. Define input, affordance, default behavior, feedback, focus/navigation, motion, cancel, undo, validation, destructive actions, and alternatives for keyboard, pointer, touch, and controller.
6. **Define visual language.** Complete `visual-direction.md`. Set experience intent, hierarchy, semantic color, typography, spacing, shape, elevation, motion, component variants, content rules, and asset fallbacks. Do not invent isolated values.
7. **Define platform behavior.** Complete `platform-rules.md`. Specify viewport/resolution, density, safe areas, orientation, responsive/adaptive priority changes, input switching, localization, accessibility, performance, browser/app interruption, and recovery.
8. **Define implementation contracts.** Complete `component-contract.md` for reusable components. State responsibility, owned state, API, variants, rendering by state, layout behavior, semantics, implementation notes, and test seams.
9. **Define release criteria and evidence.** Complete `acceptance-checklist.md` and `evidence-manifest.json`. Link each claim to a screenshot, manual traversal, recording, automated check, or runnable demo.
10. **Validate and iterate.** Run `interfacecraft-studio validate-contract --dir <contract-dir> --semantic --strict`. Fix blockers, semantic section gaps, orphan IDs, broken links, and critical state gaps before handoff. Re-run after behavior or platform assumptions change.
11. **Record completion.** After validation, run `interfacecraft-studio record-completion --project-dir <project-dir> --dir <contract-dir> --task \"<task>\"`. This writes `.interfacecraft/completion-record.json` and `.interfacecraft/COMPLETION.md`. The record includes semantic validation status and traceability node/edge counts. It is neutral provenance: it confirms that this workflow ran, not which model or person performed the work. Run `interfacecraft-studio verify-completion --project-dir <project-dir> --strict` when integrity matters.

Read `references/experience-contract.md` for artifact rules and state families. Read `references/validation-playbook.md` before final review. Read `references/provenance.md` before creating or interpreting completion records.

## Mode-specific behavior

**New product or feature:** use the full Experience Contract workflow. Do not jump directly to colors or code when the journey and state model are unknown.

**Existing interface review:** inspect current screens, flows, copy, behavior, and project conventions first. Report evidence, severity, affected users/players, recommendation, and expected outcome. Do not redesign before explaining the problem.

**Visual redesign:** preserve validated information architecture and interaction behavior unless the brief identifies a structural problem. State what remains unchanged and what is being improved.

**Game UI:** begin with gameplay context, camera distance, genre conventions, input device, resolution, safe zone, player attention budget, diegetic status, update frequency, feedback latency, pause/resume, remapping, death/respawn, and critical-versus-secondary information. Do not treat HUDs as dashboards.

**Website:** begin with content hierarchy, information scent, navigation, semantic structure, responsive reading rhythm, trust, conversion or communication goal, forms, shareable URLs, and long-copy behavior.

**Web app:** begin with task efficiency, permissions, data density, URL state, filtering, forms, async states, stale data, optimistic updates, rollback, destructive actions, keyboard workflows, and recovery.

**Playable web game:** define canvas versus DOM ownership, pointer capture, keyboard/touch alternatives, browser focus, resize/orientation, device pixel ratio, pause-on-tab, loading/asset failure, performance budget, and essential status alternatives.

**Frontend implementation:** inspect the existing project before choosing a stack. Detect framework or engine from project files. Read the contract first. Implement the contract, not an invented redesign. Preserve component names, semantic tokens, state behavior, and acceptance criteria.

## Quality gates

Do not mark work ready until all applicable gates pass:

1. **Intent gate:** primary user/player goal, context, success, non-goals, assumptions, and owners are explicit.
2. **Journey gate:** primary path, failure, cancellation, interruption, and recovery are complete.
3. **State gate:** critical states are covered or deliberately excluded with rationale.
4. **Interaction gate:** input, affordance, focus, feedback, motion, validation, cancel, undo, and alternatives are observable.
5. **Platform gate:** responsive/adaptive, safe-area, localization, performance, and interruption rules are explicit.
6. **Accessibility gate:** semantics, focus, target size, contrast, color-independent meaning, text scaling, reduced motion, captions or text alternatives are addressed.
7. **Implementation gate:** developer can implement without guessing state, API, layout, or token behavior.
8. **Traceability gate:** required IDs exist, cross-artifact links resolve, and no acceptance/state is orphaned.
9. **Semantic gate:** artifact sections, machine-readable metadata, evidence references, and context-specific rules pass semantic validation.
10. **Evidence gate:** acceptance claims have evidence paths or explicit manual verification notes.

Classify findings as **blocker** when they prevent completion or create serious accessibility or safety risk; **high** when they cause frequent confusion, data loss, or major context failure; **medium** when they reduce efficiency or consistency; and **low** when they are polish or preference.

## Reusable resources

Read only what the task requires:

- `references/experience-contract.md` — contract lifecycle, required artifacts, state families, and acceptance standard.
- `references/context-adapters.md` — rules for web, web app, game, and playable web game contexts.
- `references/validation-playbook.md` — validation gates, severity model, traversal and evidence requirements.
- `references/provenance.md` — neutral completion record, integrity hash, semantic status, traceability counts, attribution limits, and completion line.
- `schemas/artifact-rules.json` — machine-readable artifact sections, ID prefixes, and cross-artifact link rules.
- `schemas/traceability.schema.json` — graph node and edge shape for contract provenance.
- `tests/fixture-eval.mjs` and `fixtures/` — real-world mini-project corpus used to regression-test context scoring.
- `references/design-brief-template.md` — lightweight brief for tasks that do not need the full contract.
- `references/quality-checklist.md` — compact final review checklist.
- `templates/experience-contract/` — scaffoldable contract artifacts.
- `templates/uiux-handoff.md` — compact implementation handoff for a single screen or feature.
- `demo/state-playground/` — runnable proof of state-first review.

## Anti-patterns to reject

Reject design systems that only provide style without context, screens that document only the happy path, components with no state contract, game HUDs that hide the playfield or overload attention, web interfaces that rely on hover or color alone, responsive claims based on one viewport, and implementation handoffs that require the developer to infer behavior.

Reject unverified recommendations. If a project-specific fact is unknown, inspect the repository or state the assumption. If evidence is missing, label the result as a proposal rather than a verified outcome.
