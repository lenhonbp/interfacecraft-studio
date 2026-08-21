# Experience Contract v0.2

An **Experience Contract** is the single source of truth connecting intent, user/player behavior, interface states, platform constraints, visual rules, implementation, and validation evidence.

## Contract lifecycle

1. Frame the brief and record assumptions.
2. Define the primary journey and measurable success criteria.
3. Map screens, surfaces, and navigation boundaries.
4. Enumerate states before visual polish.
5. Specify input, feedback, focus, transitions, validation, cancellation, and recovery.
6. Add context-specific platform and accessibility rules.
7. Define tokens, component contracts, content rules, and asset constraints.
8. Define acceptance criteria and evidence requirements.
9. Validate the contract before implementation.
10. Keep the contract updated when implementation changes behavior.

## Required artifacts

| Artifact | Required sections | Must answer |
|---|---|---|
| `experience-brief.md` | context, audience, goals, constraints, assumptions | Why does this experience exist? |
| `journey.md` | entry, steps, decisions, feedback, success, recovery | How does a user/player complete the goal? |
| `screen-map.md` | screen inventory, hierarchy, navigation, priority | What surfaces exist and how do they connect? |
| `state-matrix.md` | state, trigger, visible content, action, feedback, recovery | What happens outside the happy path? |
| `interaction-contract.md` | input, affordance, focus, feedback, motion, cancel | How does each action behave? |
| `visual-direction.md` | hierarchy, type, color, spacing, shape, imagery, motion | What visual system expresses the intent? |
| `platform-rules.md` | viewport, device, input, safe area, localization, accessibility | How does the experience adapt? |
| `component-contract.md` | component API, variants, states, content, acceptance | How can implementation proceed without guessing? |
| `acceptance-checklist.md` | behavior, states, accessibility, responsive, evidence | How do we know it is ready? |
| `evidence-manifest.json` | evidence items, paths, states, viewports, status | What proof supports the claims? |

## State-first rule

Do not approve a screen because its default state looks good. For each meaningful screen or component, document at least the applicable states below:

| State family | Examples |
|---|---|
| Availability | default, loading, disabled, unavailable |
| Content | populated, empty, partial, long text, localized |
| Outcome | success, warning, error, validation failure |
| Continuity | reconnect, retry, interrupted, resumed, stale |
| Access | first use, permission denied, signed out, locked |
| Input | keyboard focus, touch press, controller focus, pointer hover |
| Game context | gameplay, pause, damage, death, respawn, low health, tutorial |

If a state is not applicable, write the reason. An omitted state is not the same as a deliberately excluded state.

## Context selection

Choose exactly one primary context and optionally one secondary context:

- `web-experience`: marketing, editorial, content, ecommerce, public website.
- `web-app`: authenticated product, dashboard, forms, workflows, data-heavy tools.
- `game-experience`: native or engine-based game HUD, menus, onboarding, feedback, progression.
- `playable-web-game`: browser game with canvas, DOM overlays, touch/pointer input, resize and performance constraints.

Read `references/context-adapters.md` after selecting the context. Do not mix rules silently.

## Acceptance standard

A contract is ready for implementation only when its primary journey is complete, all critical states are documented, platform behavior is explicit, acceptance criteria are observable, unresolved decisions have owners, and the evidence plan names what will be captured or tested.
