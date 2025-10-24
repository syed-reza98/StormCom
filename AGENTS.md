# Repository Guidelines

## Project Structure & Module Organization
- `docs/`: Reference docs, CI/CD, design system, testing strategy, and audit artifacts.
- `specs/001-multi-tenant-ecommerce/`: Product spec, plans, data model, `contracts/` (TypeScript + `openapi.yaml`).
- `.github/copilot/`: Copilot customizations
  - `chatmodes/`, `instructions/`, `prompts/`, `collections/`, `tests/validate.js`, `package.json`.
- `.github/`: Issue/PR templates, labels, code of conduct, contributing guide.

## Build, Test, and Development Commands
- Validate Copilot content: `node .github/copilot/tests/validate.js`
  - Or with npm: `npm --prefix .github/copilot run validate`
- Markdown preview: use your editor’s preview; keep links relative.
- OpenAPI edits: keep `specs/.../contracts/openapi.yaml` in sync with any contract changes.

## Coding Style & Naming Conventions
- General: 2‑space indentation; wrap lines thoughtfully; clear, active language.
- Filenames: kebab‑case for docs. Copilot assets use suffixes: `*.chatmode.md`, `*.instructions.md`, `*.prompt.md`.
- TypeScript (in `specs/.../contracts`): camelCase variables, PascalCase types/interfaces, named exports, small functions.
- Markdown: ATX headings (`#`, `##`), fenced code blocks, tables only when needed.

## Testing Guidelines
- Run validator before PRs: `node .github/copilot/tests/validate.js`.
- Chatmodes/Instructions/Prompts: include substantial content; optional frontmatter is supported; keep scope single‑purpose.
- Contracts/OpenAPI: ensure examples compile conceptually and endpoints match `openapi.yaml`.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits. Examples:
  - `feat(chatmodes): add accessibility expert mode`
  - `docs(specs): clarify tenant isolation rules`
  - `fix(prompts): correct blueprint link`
- PRs: use the template. Include Why/What, linked issues, and screenshots/GIFs for visible changes. Ensure validator passes and docs/specs are updated.

## Agent‑Specific Notes
- Add new Copilot assets under `.github/copilot/` with correct suffixes and one responsibility per file.
- Keep `collections/stormcom-development.collection.yml` categories intact when updating.
- Never commit secrets; use placeholders in examples. For multi‑tenant examples, demonstrate `storeId` isolation.

