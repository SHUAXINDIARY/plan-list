# Animation plans

Plans were written against commit `90c1c0e`. Each plan is self-contained and must be rechecked for drift before execution.

| # | Plan | Severity | Status | Dependencies |
| --- | --- | --- | --- | --- |
| 001 | [Add a symmetric Select menu exit](001-add-symmetric-select-exit.md) | MEDIUM | DONE | None |
| 002 | [Animate the theme toggle state locally](002-animate-theme-toggle-state.md) | LOW | DONE | None |
| 003 | [Localize copy feedback on the triggering card](003-localize-copy-feedback.md) | LOW | DONE | None |
| 004 | [Soften pointer-triggered map tooltips](004-soften-pointer-map-tooltips.md) | LOW | DONE | None |
| 005 | [Add back-to-top press feedback](005-add-back-to-top-press-feedback.md) | LOW | DONE | None |

## Recommended execution order

1. Execute plan 001 first. It has the broadest product impact because the shared Select appears across multiple routes.
2. Execute plans 002 and 005 next. They are isolated feedback improvements with minimal blast radius.
3. Execute plan 003 after verifying clipboard success and failure paths in the current browser environment.
4. Execute plan 004 last. It requires careful pointer-versus-keyboard modality testing on the canvas map.

The plans have no code dependencies on one another. Run `CI=true pnpm run build` and the plan-specific browser feel check after every implementation instead of batching verification at the end.
