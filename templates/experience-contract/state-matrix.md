# State Matrix

## State Coverage

| State ID | Screen ID | State family | Trigger / entry | Visible content | Available actions | Feedback | Recovery / exit | Component IDs | Acceptance ID | Evidence ID | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `ST-001` | `SCR-001` | default |  |  |  |  |  | `CMP-001` | `ACC-001` | `EVD-001` | draft |
| `ST-002` | `SCR-001` | loading |  |  |  |  |  | `CMP-001` | `ACC-001` | `EVD-001` | draft |
| `ST-003` | `SCR-001` | empty |  |  |  |  |  | `CMP-001` | `ACC-001` | `EVD-001` | draft |
| `ST-004` | `SCR-001` | error |  |  |  |  |  | `CMP-001` | `ACC-001` | `EVD-001` | draft |
| `ST-005` | `SCR-001` | success |  |  |  |  |  | `CMP-001` | `ACC-001` | `EVD-001` | draft |

## Context-specific states

For a game, include gameplay, pause, damage, death, respawn, tutorial, and input-device states as applicable. For a web app, include permission denied, stale data, retry, validation failure, and optimistic update rollback as applicable.

## Deliberately Not Applicable

| State family | Screen ID | Reason | Reviewer |
|---|---|---|---|
|  | `SCR-001` |  |  |
