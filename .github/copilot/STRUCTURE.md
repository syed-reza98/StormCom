# 📁 GitHub Copilot Customizations Structure

Visual guide to the organization of StormCom's GitHub Copilot customizations.

## Directory Tree

```
.github/copilot/
│
├── 📄 Documentation (5 files)
│   ├── README.md          ← Start here! Main usage guide
│   ├── QUICKSTART.md      ← 5-minute installation
│   ├── INDEX.md           ← Quick reference by role
│   ├── SUMMARY.md         ← Complete overview
│   └── STRUCTURE.md       ← This file (visual guide)
│
├── 📂 prompts/ (19 files)
│   │
│   ├── 💼 SaaS Developer (3)
│   │   ├── create-implementation-plan.prompt.md
│   │   ├── create-specification.prompt.md
│   │   └── aspnet-minimal-api-openapi.prompt.md
│   │
│   ├── 📊 Market Researcher (3)
│   │   ├── prd.prompt.md
│   │   ├── breakdown-epic-pm.prompt.md
│   │   └── breakdown-feature-prd.prompt.md
│   │
│   ├── 📝 Documentation Reviewer (4)
│   │   ├── create-readme.prompt.md
│   │   ├── readme-blueprint-generator.prompt.md
│   │   ├── documentation-writer.prompt.md
│   │   └── create-oo-component-documentation.prompt.md
│   │
│   ├── 🏗️ System Designer (4)
│   │   ├── architecture-blueprint-generator.prompt.md
│   │   ├── create-architectural-decision-record.prompt.md
│   │   ├── breakdown-epic-arch.prompt.md
│   │   └── breakdown-feature-implementation.prompt.md
│   │
│   ├── 🧪 Q/A Specialist (2)
│   │   ├── playwright-typescript.prompt.md
│   │   └── javascript-typescript-jest.prompt.md
│   │
│   ├── 🔒 Security Expert (1)
│   │   └── ai-prompt-engineering-safety-review.prompt.md
│   │
│   └── 🚀 DevOps Expert (2)
│       ├── multi-stage-dockerfile.prompt.md
│       └── create-github-action-workflow-specification.prompt.md
│
├── 📂 instructions/ (14 files)
│   │
│   ├── 💼 SaaS Developer (6 + 3 custom ⭐)
│   │   ├── nextjs.instructions.md
│   │   ├── typescript.instructions.md
│   │   ├── tailwind.instructions.md
│   │   ├── performance-optimization.instructions.md
│   │   ├── prisma.instructions.md ⭐ Custom
│   │   ├── vitest.instructions.md ⭐ Custom
│   │   └── security-best-practices.instructions.md ⭐ Custom
│   │
│   ├── 📝 Documentation Reviewer (1)
│   │   └── markdown.instructions.md
│   │
│   ├── 🎨 UI/UX Designer (1)
│   │   └── a11y.instructions.md
│   │
│   ├── 🧪 Q/A Specialist (1)
│   │   └── playwright-typescript.instructions.md
│   │
│   ├── 🔒 Security Expert (1)
│   │   └── ai-prompt-engineering-safety-best-practices.instructions.md
│   │
│   └── 🚀 DevOps Expert (3)
│       ├── github-actions-ci-cd-best-practices.instructions.md
│       ├── containerization-docker-best-practices.instructions.md
│       └── devops-core-principles.instructions.md
│
├── 📂 chatmodes/ (15 files)
│   │
│   ├── 💼 SaaS Developer (5)
│   │   ├── expert-react-frontend-engineer.chatmode.md
│   │   ├── principal-software-engineer.chatmode.md
│   │   ├── janitor.chatmode.md
│   │   ├── gilfoyle.chatmode.md
│   │   └── mentor.chatmode.md
│   │
│   ├── 📊 Market Researcher (1)
│   │   └── prd.chatmode.md
│   │
│   ├── 🏗️ System Designer (3)
│   │   ├── azure-saas-architect.chatmode.md
│   │   ├── api-architect.chatmode.md
│   │   └── plan.chatmode.md
│   │
│   ├── 🎨 UI/UX Designer (1)
│   │   └── accessibility.chatmode.md
│   │
│   ├── 🧪 Q/A Specialist (4)
│   │   ├── playwright-tester.chatmode.md
│   │   ├── tdd-red.chatmode.md
│   │   ├── tdd-green.chatmode.md
│   │   └── tdd-refactor.chatmode.md
│   │
│   └── 🔒 Security Expert (1)
│       └── wg-code-sentinel.chatmode.md
│
└── 📂 collections/ (1 file)
    └── stormcom-development.collection.yml  ← Master catalog (50+ items)
```

## File Type Legend

| Icon | Type | Purpose | How to Use |
|------|------|---------|------------|
| 📄 | Documentation | Guides and references | Read for understanding |
| 📂 | Directory | Organizes files | Browse by category |
| `.prompt.md` | Prompt | Task-specific workflows | Use with `/` in Copilot Chat |
| `.instructions.md` | Instructions | Auto-applying coding standards | Copy to `.github/instructions/` |
| `.chatmode.md` | Chat Mode | Specialized AI personas | Install via VS Code command |
| `.yml` | Collection | Grouped customizations | Reference for batch install |

## Specialization Icons

| Icon | Role | Files Count | Description |
|------|------|-------------|-------------|
| 💼 | SaaS Developer | 18 | Next.js, TypeScript, Prisma development |
| 📊 | Market Researcher | 4 | PRDs, product specifications |
| 📝 | Documentation Reviewer | 5 | README, specs, technical writing |
| 🏗️ | System Designer | 8 | Architecture, ADRs, planning |
| 🎨 | UI/UX Designer | 3 | Accessibility, React components |
| 🧪 | Q/A Specialist | 8 | Vitest, Playwright, TDD |
| 🔒 | Security Expert | 4 | OWASP, multi-tenant security |
| 🚀 | DevOps Expert | 5 | CI/CD, Docker, GitHub Actions |

## Usage Flow

```
┌─────────────────┐
│  New to Project │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  QUICKSTART.md  │ ← Start here (5-min setup)
└────────┬────────┘
         │
         v
┌─────────────────┐
│    INDEX.md     │ ← Find what you need by role
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Install Files  │ ← Copy/install customizations
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Use in VS     │ ← Prompts, chat modes, auto-instructions
│      Code       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   README.md     │ ← Deep dive when needed
└─────────────────┘
```

## File Naming Convention

From [awesome-copilot](https://github.com/rezwana-karim/awesome-copilot):

```
{descriptive-name}.{type}.md

Examples:
- create-implementation-plan.prompt.md
- nextjs.instructions.md
- expert-react-frontend-engineer.chatmode.md
```

## Auto-Apply Patterns

Instructions auto-apply based on file patterns (defined in `applyTo` field):

```yaml
Instructions File          →  Auto-applies to Files
─────────────────────────────────────────────────────────────
nextjs.instructions.md     →  **/*.tsx, **/*.ts, **/app/**/*
prisma.instructions.md     →  **/prisma/**/*
vitest.instructions.md     →  **/*.test.ts, **/*.spec.ts
security-best-practices    →  **/api/**/*, **/auth/**/*
a11y.instructions.md       →  **/*.tsx, **/*.jsx, **/*.html
playwright-typescript      →  **/tests/**/*.spec.ts
markdown.instructions.md   →  **/*.md
```

## Size Distribution

```
Total: ~95,000 characters across 54 files

Documentation   ████████ 30,423 chars (32%)
Instructions    ████████████ 50,000+ chars (53%)
Prompts         ████ 10,000+ chars (10%)
Chat Modes      ██ 5,000+ chars (5%)
```

## Custom vs. Sourced

```
Total Files: 54

Sourced from awesome-copilot  ████████████████████████ 51 (94%)
Custom for StormCom ⭐        ██ 3 (6%)
```

**Custom Files:**
1. `prisma.instructions.md` - Prisma ORM with multi-tenant patterns
2. `vitest.instructions.md` - Vitest testing aligned with stack
3. `security-best-practices.instructions.md` - SaaS security standards

## Technology Coverage Map

```
Next.js 16        → nextjs.instructions.md
                  → expert-react-frontend-engineer.chatmode.md
                  
React 19          → typescript.instructions.md
                  → expert-react-frontend-engineer.chatmode.md
                  
TypeScript 5.9.3  → typescript.instructions.md
                  → javascript-typescript-jest.prompt.md
                  
Tailwind CSS      → tailwind.instructions.md
                  
Prisma ORM        → prisma.instructions.md ⭐
                  
Vitest            → vitest.instructions.md ⭐
                  
Playwright        → playwright-typescript.instructions.md
                  → playwright-tester.chatmode.md
                  
Security          → security-best-practices.instructions.md ⭐
                  → wg-code-sentinel.chatmode.md
                  
DevOps            → github-actions-ci-cd-best-practices.instructions.md
                  → containerization-docker-best-practices.instructions.md
```

## Quick Navigation

**By Learning Path:**
1. **Start**: QUICKSTART.md
2. **Explore**: INDEX.md
3. **Understand**: README.md
4. **Reference**: SUMMARY.md
5. **Visualize**: STRUCTURE.md (this file)

**By Use Case:**
- 🔍 **Find customization**: INDEX.md
- 🚀 **Quick setup**: QUICKSTART.md
- 📖 **Learn usage**: README.md
- 📊 **See overview**: SUMMARY.md
- 🗂️ **Understand structure**: STRUCTURE.md

**By Role:**
See INDEX.md → Section "By Role"

## Maintenance Tasks

```
┌────────────────────────────────────────┐
│  Add New Customization                 │
├────────────────────────────────────────┤
│  1. Add file to prompts/instructions/  │
│     chatmodes/ directory                │
│  2. Update collection YAML             │
│  3. Update INDEX.md                    │
│  4. Test in VS Code                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Update Existing Customization         │
├────────────────────────────────────────┤
│  1. Edit file directly                 │
│  2. Update version in YAML if major    │
│  3. Document in commit message         │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Sync from awesome-copilot             │
├────────────────────────────────────────┤
│  1. Run /tmp/download_copilot_files.sh │
│  2. Review changes                     │
│  3. Test and commit                    │
└────────────────────────────────────────┘
```

## Related Repositories

- **Source**: https://github.com/rezwana-karim/awesome-copilot
- **Project**: https://github.com/syed-reza98/StormCom
- **License**: MIT

---

**Navigation:**
- 🏠 [Main README](README.md)
- 🚀 [Quick Start](QUICKSTART.md)
- 📇 [Index](INDEX.md)
- 📊 [Summary](SUMMARY.md)
- 📁 [Structure](STRUCTURE.md) ← You are here

**Last Updated**: 2025-10-24  
**Version**: 1.0.0
