# Screen Map

## Screen Inventory

| Screen ID | Journey IDs | Purpose | Parent/shell | Primary state IDs | Component IDs | Priority |
|---|---|---|---|---|---|---|
| `SCR-001` | `JNY-001` |  |  | `ST-001`, `ST-002` | `CMP-001` | P0 |

## Navigation

| From Screen | Action/input | To Screen | Journey ID | State transition |
|---|---|---|---|---|
| `SCR-001` |  | `SCR-002` | `JNY-001` | `ST-001` → `ST-002` |

## Information hierarchy

| Screen ID | Critical information | Primary action | Secondary information | Deferred information |
|---|---|---|---|---|
| `SCR-001` |  |  |  |  |

## Screen boundaries

Document what belongs in this contract and what is intentionally handled by another feature or context adapter.

## Evidence

| Screen ID | Evidence ID | Viewport/platform | Required states |
|---|---|---|---|
| `SCR-001` | `EVD-001` |  | `ST-001`, `ST-002` |
