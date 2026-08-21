# Context Adapters

Select the adapter that matches the user's primary experience. If the project has multiple surfaces, keep one contract per context and document the boundary between them.

## Web experience

Prioritize information scent, content hierarchy, semantic structure, navigation predictability, reading rhythm, trust, conversion intent, SEO-sensitive content, responsive reflow, forms, and shareable URLs. Define behavior for narrow viewports, browser zoom, long copy, localization, slow network, and progressive enhancement.

Do not let visual novelty obscure the page's primary purpose. Preserve semantic headings, keyboard access, visible focus, meaningful link text, and a clear recovery path for failed actions.

## Web app

Prioritize task completion, data density, permissions, filtering, forms, keyboard workflows, URL state, async feedback, optimistic versus confirmed updates, undo, auditability, and recoverability. Model tables, bulk actions, destructive actions, validation, empty states, skeleton loading, stale data, and authorization failures.

For implementation, define component boundaries, state ownership, loading strategy, semantic tokens, responsive behavior, and acceptance criteria. Prefer predictable behavior over decorative motion.

## Game experience

Prioritize player attention, gameplay distance, diegesis, critical-versus-secondary information, input device, safe zones, resolution scaling, readability during high-intensity moments, feedback latency, and interruption/resume behavior. Map moment-to-moment, session, progression, and meta surfaces where relevant.

For every HUD element, state its gameplay decision, priority tier, persistence, location, diegetic status, update frequency, and failure behavior. For menus, document hierarchy, pause semantics, controller navigation, remapping, back behavior, and whether the player can resume without losing context.

Do not treat HUDs as dashboards. Remove non-actionable information, avoid covering the playfield, and never rely on color or sound alone for critical feedback.

## Playable web game

Combine game readability with browser constraints. Define canvas versus DOM ownership, pointer capture, keyboard and touch alternatives, resize/orientation behavior, device pixel ratio strategy, safe zones, browser focus, pause-on-tab behavior, performance budget, loading and asset failure, and input loss/recovery.

Keep critical gameplay feedback close to the playfield without making it inaccessible to assistive technology. Provide a DOM or text alternative for essential status when the product requires it.

## Adapter output

Every adapter must produce these fields in the contract:

| Field | Expected output |
|---|---|
| Primary context | One of the four adapter names |
| Critical information | Ranked list with decision relevance |
| Input model | Keyboard, mouse, touch, controller, pointer, or hybrid |
| Spatial constraints | Viewport, gameplay distance, safe zone, canvas, fold, or density |
| State risks | Context-specific states likely to fail |
| Accessibility risks | Interaction and perception risks to verify |
| Validation evidence | Screens, states, devices, input paths, and test method |
