# Provenance and Completion Record

A completion record is a neutral workflow artifact. It records that InterfaceCraft Studio's contract and validation workflow was applied; it does **not** prove which model, agent, user, or machine performed the work.

## Location

Write the record to the project root at `.interfacecraft/completion-record.json`. Write a human-readable summary to `.interfacecraft/COMPLETION.md`. Keep these files under version control when the project team wants a durable audit trail.

## Required fields

| Field | Meaning |
|---|---|
| `recordVersion` | Provenance record schema version |
| `generatedBy` | Package name and version that generated the record |
| `contractVersion` | Experience Contract version |
| `context` | Selected experience adapter |
| `task` | Human-readable task description |
| `status` | `ready`, `ready-with-risks`, or `not-ready` |
| `completedAt` | UTC completion timestamp |
| `validation` | Contract/evidence result and counts |
| `agentSurface` | Optional self-reported surface such as `claude-code`, `codex`, `manual`, or `unknown` |
| `humanApproval` | Approval state and optional approver supplied by the user |
| `contentHash` | SHA-256 hash of the record payload excluding the hash itself |

## Integrity and attribution

The hash is an integrity hint, not a cryptographic identity signature. It helps detect accidental changes to the record but does not authenticate the author. Never write a provider, model, account, or agent identity unless that information is explicitly supplied by the environment or the user.

## Completion line

The CLI prints and writes a compact line in this form:

```text
InterfaceCraft Studio v0.2.0 · Contract validated · Evidence: 5 items · Status: ready
```

Use this line in a final agent response when appropriate. The record should remain useful even when the chat transcript is unavailable.
