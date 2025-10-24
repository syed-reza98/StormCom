# StormCom GitHub Copilot Customizations Index

Quick reference guide for all available GitHub Copilot customizations in the StormCom project.

## 📊 Summary Statistics

- **Total Items**: 50+
- **Prompts**: 15+
- **Instructions**: 20+
- **Chat Modes**: 20+
- **Specializations**: 8 roles

## 🎯 By Role

### 1. SaaS Application Developer (18 items)

#### Prompts
- `create-implementation-plan.prompt.md` - Generate implementation plans
- `create-specification.prompt.md` - Create feature specifications
- `aspnet-minimal-api-openapi.prompt.md` - API endpoint creation

#### Instructions
- `nextjs.instructions.md` - Next.js 16 best practices
- `typescript.instructions.md` - TypeScript standards
- `tailwind.instructions.md` - Tailwind CSS guidelines
- `prisma.instructions.md` - Prisma ORM best practices ⭐ (Custom)
- `vitest.instructions.md` - Vitest testing standards ⭐ (Custom)
- `performance-optimization.instructions.md` - Performance best practices

#### Chat Modes
- `expert-react-frontend-engineer.chatmode.md` - React/TypeScript expert
- `principal-software-engineer.chatmode.md` - Principal-level guidance
- `janitor.chatmode.md` - Code cleanup and tech debt
- `gilfoyle.chatmode.md` - Humorous code review
- `mentor.chatmode.md` - Engineering mentorship

### 2. Market Researcher (4 items)

#### Prompts
- `prd.prompt.md` - Product Requirements Document generation
- `breakdown-epic-pm.prompt.md` - Epic PRD creation
- `breakdown-feature-prd.prompt.md` - Feature PRD creation

#### Chat Modes
- `prd.chatmode.md` - Interactive PRD generation

### 3. Documentation Reviewer (5 items)

#### Prompts
- `create-readme.prompt.md` - README generation
- `readme-blueprint-generator.prompt.md` - Intelligent README creation
- `documentation-writer.prompt.md` - Diátaxis documentation expert
- `create-oo-component-documentation.prompt.md` - Component documentation

#### Instructions
- `markdown.instructions.md` - Markdown standards

### 4. System Designer & Architecture (8 items)

#### Prompts
- `architecture-blueprint-generator.prompt.md` - Architecture blueprints
- `create-architectural-decision-record.prompt.md` - ADR creation
- `breakdown-epic-arch.prompt.md` - Epic architecture spec
- `breakdown-feature-implementation.prompt.md` - Feature implementation plans

#### Chat Modes
- `azure-saas-architect.chatmode.md` - Azure SaaS expert
- `api-architect.chatmode.md` - API design guidance
- `plan.chatmode.md` - Strategic planning assistant

### 5. UI/UX Designer (4 items)

#### Instructions
- `react-components.instructions.md` - React component patterns
- `a11y.instructions.md` - Accessibility (WCAG 2.1 AA)

#### Chat Modes
- `accessibility.chatmode.md` - Accessibility mode

### 6. Q/A Specialist (8 items)

#### Prompts
- `playwright-typescript.prompt.md` - Playwright test generation
- `javascript-typescript-jest.prompt.md` - Jest testing

#### Instructions
- `playwright-typescript.instructions.md` - Playwright standards
- `vitest.instructions.md` - Vitest standards ⭐ (Custom)

#### Chat Modes
- `playwright-tester.chatmode.md` - Playwright testing mode
- `tdd-red.chatmode.md` - TDD Red phase (failing tests)
- `tdd-green.chatmode.md` - TDD Green phase (passing tests)
- `tdd-refactor.chatmode.md` - TDD Refactor phase

### 7. Security Expert (4 items)

#### Prompts
- `ai-prompt-engineering-safety-review.prompt.md` - AI safety review

#### Instructions
- `security-best-practices.instructions.md` - Security guidelines ⭐ (Custom)
- `ai-prompt-engineering-safety-best-practices.instructions.md` - AI prompt safety

#### Chat Modes
- `wg-code-sentinel.chatmode.md` - Security code review

### 8. DevOps Expert (5 items)

#### Prompts
- `multi-stage-dockerfile.prompt.md` - Dockerfile creation
- `create-github-action-workflow-specification.prompt.md` - GitHub Actions workflows

#### Instructions
- `github-actions-ci-cd-best-practices.instructions.md` - CI/CD pipelines
- `containerization-docker-best-practices.instructions.md` - Docker best practices

#### Chat Modes
- `devops-core-principles.chatmode.md` - DevOps fundamentals

## 🏷️ Custom vs. Sourced Items

### Custom Items (Created for StormCom) ⭐
1. `prisma.instructions.md` - Prisma ORM specific to our schema
2. `vitest.instructions.md` - Vitest testing aligned with our stack
3. `security-best-practices.instructions.md` - Security for multi-tenant SaaS

### Sourced Items (From awesome-copilot)
All other items are sourced from https://github.com/rezwana-karim/awesome-copilot

## 🔍 Quick Search

### By Technology
- **Next.js**: `nextjs.instructions.md`, `expert-react-frontend-engineer.chatmode.md`
- **TypeScript**: `typescript.instructions.md`, `javascript-typescript-jest.prompt.md`
- **Prisma**: `prisma.instructions.md` ⭐
- **Tailwind**: `tailwind.instructions.md`
- **Testing**: `vitest.instructions.md` ⭐, `playwright-typescript.instructions.md`
- **Security**: `security-best-practices.instructions.md` ⭐
- **Docker**: `containerization-docker-best-practices.instructions.md`
- **GitHub Actions**: `github-actions-ci-cd-best-practices.instructions.md`

### By Use Case
- **Creating new features**: `create-specification.prompt.md`, `create-implementation-plan.prompt.md`
- **Writing tests**: `playwright-tester.chatmode.md`, TDD chat modes
- **Security review**: `wg-code-sentinel.chatmode.md`, `security-best-practices.instructions.md` ⭐
- **Documentation**: `documentation-writer.prompt.md`, `markdown.instructions.md`
- **Code cleanup**: `janitor.chatmode.md`
- **Architecture**: `architecture-blueprint-generator.prompt.md`, `azure-saas-architect.chatmode.md`

## 📁 File Locations

```
.github/copilot/
├── README.md                         # Main documentation
├── INDEX.md                          # This file
├── prompts/                          # Task-specific prompts
│   └── (15+ .prompt.md files)
├── instructions/                     # Coding standards
│   ├── prisma.instructions.md        ⭐ Custom
│   ├── vitest.instructions.md        ⭐ Custom
│   ├── security-best-practices.instructions.md ⭐ Custom
│   └── (17+ other .instructions.md files)
├── chatmodes/                        # AI personas
│   └── (20+ .chatmode.md files)
└── collections/
    └── stormcom-development.collection.yml  # Master collection
```

## 🚀 Getting Started

### For New Developers
1. Review `README.md` for overview
2. Install `nextjs.instructions.md`, `typescript.instructions.md`, `prisma.instructions.md`
3. Use `expert-react-frontend-engineer.chatmode.md` for coding help
4. Use `create-specification.prompt.md` when adding features

### For QA Engineers
1. Install `playwright-typescript.instructions.md`, `vitest.instructions.md`
2. Use `playwright-tester.chatmode.md` for test creation
3. Follow TDD workflow with Red/Green/Refactor chat modes

### For Security Reviewers
1. Review `security-best-practices.instructions.md`
2. Use `wg-code-sentinel.chatmode.md` for code reviews
3. Check OWASP compliance with security checklist

### For DevOps Engineers
1. Install `github-actions-ci-cd-best-practices.instructions.md`
2. Install `containerization-docker-best-practices.instructions.md`
3. Use `devops-core-principles.chatmode.md` for guidance

## 📚 Learning Resources

### StormCom Specific
- Project Constitution: `.specify/memory/constitution.md`
- Feature Spec: `specs/001-multi-tenant-ecommerce/spec.md`
- Implementation Plan: `specs/001-multi-tenant-ecommerce/plan.md`
- Database Schema: `specs/001-multi-tenant-ecommerce/data-model.md`

### External Resources
- awesome-copilot: https://github.com/rezwana-karim/awesome-copilot
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Vitest Docs: https://vitest.dev
- Playwright Docs: https://playwright.dev

## 🎨 Usage Patterns

### Pattern 1: Feature Development Workflow
1. Use `/create-specification` prompt to define feature
2. Use `create-implementation-plan.prompt.md` to plan work
3. Chat with `expert-react-frontend-engineer.chatmode.md` while coding
4. Follow `prisma.instructions.md` for database changes
5. Use `vitest.instructions.md` for tests
6. Use `wg-code-sentinel.chatmode.md` for security review

### Pattern 2: Bug Fix Workflow
1. Use `plan.chatmode.md` to analyze the bug
2. Chat with `mentor.chatmode.md` for guidance
3. Write tests first with `tdd-red.chatmode.md`
4. Fix code with `tdd-green.chatmode.md`
5. Refactor with `tdd-refactor.chatmode.md`

### Pattern 3: Documentation Workflow
1. Use `readme-blueprint-generator.prompt.md` for README
2. Use `documentation-writer.prompt.md` for comprehensive docs
3. Follow `markdown.instructions.md` for formatting

## 🔄 Maintenance

### Adding New Customizations
1. Add file to appropriate directory (`prompts/`, `instructions/`, `chatmodes/`)
2. Update `stormcom-development.collection.yml`
3. Update this `INDEX.md`
4. Update main `README.md` if introducing new category
5. Test customization in local development

### Updating Existing Customizations
1. Edit the file directly
2. Update `version` in collection YAML if major change
3. Document changes in commit message

---

**Last Updated**: 2025-10-24  
**Maintained by**: StormCom Development Team
