# CODEX.md

This file makes the project rules that already exist for Cursor available to Codex-oriented agents.

## Canonical Rules

- Read and follow `.cursor/rules/project-base-rules.mdc` for the full project baseline rules.
- Treat that Cursor rule file as the canonical source for TypeScript, async flow, functions, comments, frontend experience, Rsbuild workflow, task records, safety, Git protection, and verification requirements.
- Keep this file as a bridge instead of duplicating the entire Cursor rule body, so future rule changes only need to be made in one place.

## Project Context

- Project root: `/Users/taobian/Documents/code/js/plan-list`.
- Product context: read `PRODUCT.md` for positioning, users, tone, anti-references, accessibility targets, and product principles.
- Design context: read `DESIGN.md` before UI/layout/style work, and use the project `impeccable` skill for frontend design, polish, accessibility, responsive, animation, or visual iteration tasks.
- Rsbuild context: use the project `rsbuild-best-practices` skill before changing Rsbuild, Rspack, build scripts, asset handling, performance settings, CLI workflow, or debugging build behavior.

## Codex Execution Notes

- Prefer minimal, task-scoped changes that match the existing directory structure and local patterns.
- Use `pnpm` commands only for dependency and script workflows. Do not introduce `npm`, `yarn`, or `bun` lockfile churn.
- Use `rg` / `rg --files` for repository search when possible.
- Use `apply_patch` for manual edits.
- Do not write generated, temporary, backup, cache, or debug files into the repository unless they are deliverables.
- Do not modify `.git/`, `node_modules/`, build caches, or files outside the project root unless the user explicitly asks and permissions allow it.

## Verification

- After source, config, data, or UI changes, run the narrowest relevant verification first. If unsure, run `pnpm run build`.
- For UI changes, check rendered behavior in the browser when practical, including a mobile-width layout check for responsive surfaces.
- If a verification step cannot be run, state the reason and the residual risk in the final response.

## Task Records

- For tasks that modify source, configuration, documentation, assets, or data files, update `taskRecord.md` before delivery.
- Append only. Do not delete, overwrite, reorder, or rewrite existing task records.
- Use the existing record format: `日期`, `任务目的`, `完成过程`, `修改具体文件`.
