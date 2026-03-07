# React 19 / React DOM 19 Migration Assessment

Last updated: 2026-03-07

## Scope
- Issue #59: `react` 18.3.1 -> 19.x (investigation)
- Issue #60: `react-dom` 18.3.1 -> 19.x (investigation)

## Current State
- `react`: `18.3.1`
- `react-dom`: `18.3.1`
- `react-router-dom`: `6.30.3`
- `@types/react`: `18.3.x`
- `@types/react-dom`: `18.3.x`

## Compatibility Notes
- React 19 itself is available (`19.2.x`), but this app currently pins React 18 typings and React Router v6.
- Main risk is not JSX syntax but ecosystem alignment:
  - type packages (`@types/react*`) must move to 19 line together.
  - testing and UI libraries must be revalidated after runtime + type major update.
  - routing/data libs should be checked against React 19 support statements before rollout.

## Migration Strategy
1. Create a dedicated branch for React 19 migration only.
2. Upgrade in one batch:
   - `react`, `react-dom`
   - `@types/react`, `@types/react-dom`
   - related tooling if required by peer dependency warnings
3. Run full quality gates:
   - `npm run quality:web`
   - `npm run quality:api`
4. Manual smoke checks:
   - list/detail/create/edit/map flows
   - modal, drag-and-drop, auth-required navigation

## Decision (Now)
- Keep React 18 on `main` for now.
- Close #59/#60 as investigation completed with this memo.
- Perform actual major upgrade in a dedicated migration issue/PR to isolate risk.
