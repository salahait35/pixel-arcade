# Contributing to Pixel Arcade

Thanks for helping! This is a small project with one firm rule and a few habits.

## The one rule

**Engines never touch the DOM.** Everything under `src/engine/` is plain state and
functions, testable in Node with a seeded RNG. Rendering, input and storage live in
`src/ui/` and `src/shared/`. If a change needs the engine to know about the canvas,
the change is in the wrong place.

## Workflow

1. Open an issue first for anything bigger than a typo, or pick an existing one.
   Issues labelled `good first issue` are self-contained.
2. Branch from `main`: `fix/<short-name>` or `feat/<short-name>`.
3. Make the change, add or update a test in `tests/`, run `npm run ci`.
4. Open a pull request. Reference the issue (`Fixes #12`) and fill in the template.

## Definition of done

- `npm run ci` passes (syntax check, wiring check, tests) on Node 22.
- A bug fix comes with a regression test that fails without the fix.
- A new game follows the five steps in the README ("Adding a game").
- No new dependencies. The whole point of this repository is that there are none.
- User-visible changes get a line in `CHANGELOG.md` under **Unreleased**.

## Reporting bugs

Use the **Bug report** issue template. The most useful reports include the game, the
browser and OS, exact steps, what you expected and what happened instead. A screenshot
or short recording helps for anything visual (hitboxes, rendering, controls).

## Code style

- 2-space indentation, single quotes, semicolons, trailing commas (see `.editorconfig`).
- Small functions, named constants (every engine exports its tuning constants).
- Comments explain *why*, not *what*.
