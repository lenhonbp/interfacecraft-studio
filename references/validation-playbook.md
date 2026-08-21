# Validation Playbook

Validate the contract in layers. Stop at the first failed gate for a blocker or critical state gap.

## Gate 1 — Contract integrity

Confirm that the contract identifies a primary user/player goal, one primary context, an entry condition, a success condition, failure/recovery paths, assumptions, owners for unresolved decisions, and observable acceptance criteria.

## Gate 2 — State coverage

For each screen and component, compare the documented matrix with the expected state families in `experience-contract.md`. Mark each state as covered, deliberately not applicable with rationale, or missing. Missing critical states block implementation handoff.

## Gate 3 — Interaction traversal

Walk the primary journey using every relevant input method. Record focus order, input result, feedback, cancellation, undo, error recovery, and interruption/resume behavior. For games, include controller navigation, remapping, pause, death/respawn, and high-intensity readability.

## Gate 4 — Responsive and platform review

Review the smallest, largest, and one intermediate target. Check reflow, priority changes, safe areas, orientation, long text, localization, browser zoom or UI scale, and input switching. Do not approve a single-viewport screenshot as a responsive design.

## Gate 5 — Accessibility review

Check semantic structure, keyboard/controller/touch alternatives, focus visibility, target size, contrast, color-independent meaning, labels, error association, text scaling, reduced motion, captions or text alternatives, and screen-reader exposure where applicable.

## Gate 6 — Evidence manifest

Every claim in the acceptance checklist must point to a test, screenshot, recording, runnable demo, or explicit manual verification note. Keep evidence paths relative to the project root and never include secrets or private user data.

## Severity

| Severity | Meaning | Release effect |
|---|---|---|
| Blocker | Prevents completion, creates serious accessibility risk, or invalidates the primary journey | Do not ship |
| High | Causes frequent confusion, data loss, or major context failure | Fix before release unless explicitly accepted |
| Medium | Reduces efficiency, clarity, or consistency | Track and prioritize |
| Low | Polish or preference issue with no meaningful task impact | Optional |

## Evidence manifest shape

```json
{
  "contractVersion": "0.2",
  "project": "example-project",
  "context": "web-app",
  "items": [
    {
      "id": "desktop-empty-state",
      "type": "screenshot",
      "path": "evidence/desktop-empty-state.png",
      "viewport": "1440x900",
      "states": ["empty"],
      "input": "keyboard",
      "status": "pending",
      "notes": "Verify focus order and primary recovery action."
    }
  ]
}
```
