# Using Spec Kit CLI in StormCom

## Current Project Status

✅ **StormCom is already configured for Spec-Driven Development!**

The project includes:
- ✅ `.specify/memory/constitution.md` - Project standards and conventions
- ✅ `.specify/` - Spec-kit configuration in root directory
- ✅ `.github/prompts/` - Spec-kit prompt files
- ✅ `.github/copilot-instructions.md` - GitHub Copilot configuration
- ✅ `.github/instructions/` - Context-specific instructions
- ✅ `docs/specifications/001-stormcom-platform/` - Platform specifications
- ✅ Spec-driven workflow documentation

## What the Spec Kit CLI Provides

The `specify` CLI tool has been installed and is available for:

1. **Checking system tools** - Verify required dependencies
2. **Initializing new projects** - Start spec-driven development from scratch
3. **Adding spec-kit to existing projects** - Brownfield adoption

## Available Commands

### `specify check`

Verify that all required tools are installed:

```bash
specify check
```

**What it checks:**
- Git version control
- AI assistants (GitHub Copilot, Claude Code, etc.)
- Code editors (VS Code, Cursor, etc.)

**Example output:**
```
Check Available Tools
├── ● Git version control (available)
├── ● GitHub Copilot (not found)
...
Specify CLI is ready to use!
```

### `specify init`

Initialize or update spec-kit configuration:

```bash
# Check what would be added (dry run)
specify init --here --ai copilot

# Actually initialize (will prompt for confirmation)
specify init --here --force --ai copilot
```

**Note:** Since StormCom already has spec-driven development configured, running `specify init` will:
- Download the latest spec-kit template
- Prompt before overwriting existing files
- Merge new configuration with existing files
- Preserve your custom specifications

## Current Workflow (No specify init needed)

StormCom is already set up! Here's how to work with specifications:

### 1. Creating a New Feature Specification

```bash
# Create a new specification directory
mkdir -p docs/specifications/002-new-feature

# Add specification files
cd docs/specifications/002-new-feature

# Create spec files (use 001-stormcom-platform as template)
touch spec.md plan.md data-model.md api-contracts.md
```

### 2. Following Project Standards

Refer to the constitution for all development standards:

```bash
# View project standards
cat .specify/memory/constitution.md

# Or open in your editor
code .specify/memory/constitution.md
```

### 3. Using AI Assistants

GitHub Copilot is configured with project-specific instructions:

**Global instructions:** `.github/copilot-instructions.md`

**Context-specific instructions:**
- `**/*.test.ts` → `.github/instructions/testing.instructions.md`
- `**/*.md` → `.github/instructions/documentation.instructions.md`
- `prisma/**` → `.github/instructions/database.instructions.md`
- `src/components/**` → `.github/instructions/components.instructions.md`
- `src/app/api/**` → `.github/instructions/api-routes.instructions.md`

### 4. Working with Specifications

**Example: Create a new feature specification**

```bash
# 1. Create specification directory
mkdir -p docs/specifications/003-customer-reviews

# 2. Create spec.md
cat > docs/specifications/003-customer-reviews/spec.md <<EOF
# Feature Specification: Customer Reviews

**Status**: Planning
**Created**: $(date +%Y-%m-%d)

## Executive Summary

Enable customers to leave reviews and ratings for products.

## Requirements

### Functional Requirements

1. **FR-001**: Customers can rate products (1-5 stars)
2. **FR-002**: Customers can write text reviews
3. **FR-003**: Store owners can moderate reviews

...
EOF

# 3. Create other specification files
touch docs/specifications/003-customer-reviews/plan.md
touch docs/specifications/003-customer-reviews/data-model.md
touch docs/specifications/003-customer-reviews/api-contracts.md
```

## When to Run `specify init`

You might want to run `specify init --here` if:

1. **Updating to latest template** - Get new spec-kit features
2. **Missing configuration** - Add missing files from template
3. **Starting fresh** - Reset to template defaults

**Important:** Always commit your work before running `specify init`, as it will download and merge files.

## Updating Spec Kit CLI

To get the latest version of the CLI:

```bash
# Reinstall to latest version
uv tool install --force --from git+https://github.com/github/spec-kit.git specify-cli

# Verify new version
specify --help
```

## Best Practices

1. **Follow the constitution** - All coding standards are in `.speckit/constitution.md`
2. **Update specs before code** - Write specifications first, then implement
3. **Use descriptive names** - e.g., `003-customer-reviews` not `feature3`
4. **Document all changes** - Update specs when implementation changes
5. **Reference existing specs** - Use `001-stormcom-platform` as a template

## Specification Structure

Each specification directory should contain:

```
docs/specifications/XXX-feature-name/
├── spec.md              # Feature requirements, user stories, acceptance criteria
├── plan.md              # Implementation plan, phases, tasks
├── data-model.md        # Database schema changes, entities, relationships
└── api-contracts.md     # API endpoints, request/response formats
```

## Example: Viewing Existing Specifications

```bash
# List all specifications
ls -la docs/specifications/

# View platform specification
cat docs/specifications/001-stormcom-platform/spec.md

# View implementation plan
cat docs/specifications/001-stormcom-platform/plan.md

# View database schema
cat docs/specifications/001-stormcom-platform/data-model.md
```

## Troubleshooting

### Q: Should I run `specify init`?

**A:** No, not needed! StormCom is already configured. Only run it if you want to update to the latest template or add missing files.

### Q: How do I create a new specification?

**A:** Copy the structure from `docs/specifications/001-stormcom-platform/` and customize for your feature.

### Q: Where are the project coding standards?

**A:** See `.specify/memory/constitution.md` for all standards.

### Q: How do I configure GitHub Copilot?

**A:** Edit `.github/copilot-instructions.md` and files in `.github/instructions/`.

## Resources

- **Setup Guide**: [SPEC_KIT_SETUP.md](SPEC_KIT_SETUP.md) - Installation instructions
- **Quick Reference**: [SPEC_KIT_QUICK_REFERENCE.md](SPEC_KIT_QUICK_REFERENCE.md) - Command cheat sheet
- **Constitution**: `.specify/memory/constitution.md` - Project standards
- **Example Specs**: `docs/specifications/001-stormcom-platform/` - Platform specification

## Summary

✅ **You're all set!** The Spec Kit CLI is installed and StormCom is configured for spec-driven development.

**Next Steps:**
1. Review existing specifications in `docs/specifications/001-stormcom-platform/`
2. Read the constitution in `.specify/memory/constitution.md`
3. Use slash commands with GitHub Copilot:
   - `/speckit.constitution` - Review/update project principles
   - `/speckit.specify` - Create new specifications
   - `/speckit.plan` - Create implementation plans
   - `/speckit.tasks` - Generate actionable tasks
4. Use `specify check` to verify your development environment
