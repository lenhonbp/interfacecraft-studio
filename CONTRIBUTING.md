# Contributing to InterfaceCraft Studio

Thank you for contributing. Keep changes focused on the Experience Engineering mission: state-first, context-aware, evidence-based UI/UX workflows for agent-built interfaces.

Before opening a pull request, run:

```bash
npm ci
npm test
npm run validate
npm run pack:check
```

When changing `SKILL.md`, templates, schemas, or CLI behavior, update the relevant field-test scenario and explain the acceptance criteria. Do not include private project data, secrets, provider credentials, or unverified claims about agent identity.

Use a focused branch and a conventional commit style such as `feat: add game HUD contract adapter` or `fix: detect Windows project paths`. Pull requests should describe the user problem, the contract or CLI change, evidence of validation, and any compatibility impact.
