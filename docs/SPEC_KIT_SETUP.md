# GitHub Spec Kit Setup Guide

## Overview

StormCom uses [GitHub Spec Kit](https://github.com/github/spec-kit) for **Spec-Driven Development**. This methodology ensures high-quality, maintainable, and well-documented code through structured specifications and AI-assisted development workflows.

This guide covers the installation and initial setup of the `@github/spec-kit` CLI tool in the StormCom project.

---

## What is GitHub Spec Kit?

GitHub Spec Kit is a toolkit for **Spec-Driven Development** that helps teams:

- 📋 **Define clear specifications** - Document features before implementation
- 🤖 **Leverage AI assistants** - Work with Claude, GitHub Copilot, and other AI tools
- 📐 **Maintain standards** - Enforce project conventions and best practices
- 🔄 **Iterate efficiently** - Keep specs and code synchronized
- 📊 **Track progress** - Monitor implementation against specifications

---

## Prerequisites

Before installing the Spec Kit CLI, ensure you have:

- **Python 3.12+** (already available on most systems)
- **Git** (for version control)
- **Internet connection** (to download dependencies)

---

## Installation

### Step 1: Install `uv` Package Manager

The Spec Kit CLI uses `uv`, a fast Python package installer and resolver. Install it using:

```bash
# Install uv using the official installer
curl -LsSf https://astral.sh/uv/install.sh | sh
```

This installs `uv` and `uvx` to `~/.local/bin/`.

**Verify installation:**

```bash
# Add to PATH (add this to your ~/.bashrc or ~/.zshrc for persistence)
export PATH="$HOME/.local/bin:$PATH"

# Verify uv is installed
uv --version
# Output: uv 0.9.3 (or later)
```

### Step 2: Install Spec Kit CLI

Install the `specify-cli` tool globally using `uv`:

```bash
# Install specify-cli from GitHub
uv tool install --from git+https://github.com/github/spec-kit.git specify-cli
```

This installs the CLI tool persistently on your system, making the `specify` command available globally.

**Verify installation:**

```bash
# Check that specify is installed
which specify
# Output: /home/username/.local/bin/specify

# View available commands
specify --help
```

### Alternative: One-Time Execution with `uvx`

If you prefer to run the CLI without installing it persistently:

```bash
# Run specify command without installation
uvx --from git+https://github.com/github/spec-kit.git specify --help
```

---

## Available Commands

The `specify` CLI provides the following commands:

### `specify check`

Check that all required tools are installed on your system:

```bash
specify check
```

**Output:**
```
Checking for installed tools...

Check Available Tools
├── ● Git version control (available)
├── ● GitHub Copilot (not found)
├── ● Claude Code (not found)
...
└── ● Visual Studio Code (not found)

Specify CLI is ready to use!
Tip: Install an AI assistant for the best experience
```

This command verifies:
- Git availability
- AI assistant tools (GitHub Copilot, Claude Code, etc.)
- Code editors (VS Code, Cursor, etc.)

### `specify init`

Initialize a new Spec-Driven Development project or add spec-kit to an existing project (brownfield).

**Usage:**

```bash
# Create a new project in a new directory
specify init my-project

# Initialize in the current directory (brownfield)
specify init .
# or
specify init --here

# Specify AI assistant during initialization
specify init --here --ai copilot
specify init --here --ai claude

# Force initialization in non-empty directory
specify init --here --force

# Skip git initialization
specify init --here --no-git
```

**Options:**

- `--ai <assistant>`: Choose AI assistant (copilot, claude, gemini, cursor-agent, etc.)
- `--here`: Initialize in the current directory instead of creating a new one
- `--force`: Skip confirmation when current directory is not empty
- `--no-git`: Skip git repository initialization
- `--ignore-agent-tools`: Skip checks for AI agent tools
- `--debug`: Show verbose diagnostic output

---

## Brownfield Adoption (Existing Projects)

StormCom is an existing project (brownfield), so we use `specify init` to add spec-kit support:

### Process

1. **Navigate to project root:**
   ```bash
   cd /path/to/StormCom
   ```

2. **Initialize spec-kit in current directory:**
   ```bash
   specify init --here --ai copilot
   ```

3. **Review generated files:**
   The initialization will create/update:
   - `.speckit/` - Configuration directory
   - `docs/specifications/` - Specification templates
   - AI assistant configuration files

4. **Customize constitution:**
   Edit `.speckit/constitution.md` to define your project's standards and conventions.

### What Gets Created?

When you run `specify init --here`, the CLI:

1. **Downloads the latest template** from the spec-kit repository
2. **Extracts template files** to your project directory
3. **Merges with existing files** (prompts for conflicts)
4. **Sets up AI assistant commands** (if selected)
5. **Preserves existing git history** (unless `--no-git` is used)

---

## Project Structure After Setup

After initialization, your project should have:

```
StormCom/
├── docs/
│   └── specifications/
│       ├── .speckit/
│       │   ├── constitution.md    # Project standards & conventions
│       │   └── agents/            # AI assistant configurations
│       └── 001-feature-name/      # Individual feature specs
│           ├── spec.md            # Feature specification
│           ├── plan.md            # Implementation plan
│           ├── data-model.md      # Database schema
│           └── api-contracts.md   # API documentation
├── .github/
│   ├── copilot-instructions.md    # GitHub Copilot configuration
│   └── instructions/              # Context-specific instructions
└── README.md
```

---

## Working with Specifications

### Creating a New Specification

1. **Create a new spec directory:**
   ```bash
   mkdir -p docs/specifications/002-new-feature
   ```

2. **Add specification files:**
   - `spec.md` - Feature requirements and user stories
   - `plan.md` - Implementation roadmap and tasks
   - `data-model.md` - Database schema changes
   - `api-contracts.md` - API endpoint definitions

3. **Reference the constitution:**
   Follow standards defined in `docs/specifications/.speckit/constitution.md`

### Specification Template

See existing specifications in `docs/specifications/001-stormcom-platform/` for templates.

---

## AI Assistant Integration

### GitHub Copilot

StormCom uses GitHub Copilot as the primary AI assistant. Configuration is in:
- `.github/copilot-instructions.md` - Global project instructions
- `.github/instructions/` - Context-specific instructions for different file types

**Custom instructions loaded for:**
- `**/*.test.ts` → Testing instructions
- `**/*.md` → Documentation instructions
- `prisma/**` → Database instructions
- `src/components/**` → React component instructions
- `src/app/api/**` → API route instructions

### Other AI Assistants

Spec Kit supports multiple AI assistants:
- **Claude Code** - Anthropic's AI assistant
- **Cursor** - AI-powered code editor
- **Gemini** - Google's AI assistant
- **Amazon Q** - AWS's AI assistant
- And more...

Initialize with specific assistant:
```bash
specify init --here --ai <assistant-name>
```

---

## Best Practices

1. **Update specifications before code** - Keep specs in sync with implementation
2. **Reference the constitution** - Follow project standards consistently
3. **Use descriptive spec names** - e.g., `003-payment-processing` not `feature3`
4. **Document API contracts** - Define all endpoints before implementation
5. **Review and iterate** - Specs are living documents, update as needed

---

## Troubleshooting

### `specify` command not found

**Solution:** Add `~/.local/bin` to your PATH:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Permission denied during installation

**Solution:** Ensure you have write permissions to `~/.local/bin`:

```bash
mkdir -p ~/.local/bin
chmod +x ~/.local/bin
```

### Network/SSL errors

**Solution:** Try with `--skip-tls` flag (not recommended for production):

```bash
specify init --here --skip-tls
```

Or check your network connection and firewall settings.

### `uv` installation fails

**Solution:** Install uv manually using pip:

```bash
pip3 install uv
```

---

## Resources

- **Spec Kit Repository**: https://github.com/github/spec-kit
- **Documentation**: https://github.com/github/spec-kit/tree/main/docs
- **Issues & Discussions**: https://github.com/github/spec-kit/issues
- **StormCom Constitution**: `docs/specifications/.speckit/constitution.md`
- **StormCom Specifications**: `docs/specifications/001-stormcom-platform/`

---

## Next Steps

1. ✅ **Installed uv and specify-cli** (completed)
2. ✅ **Verified installation** (completed)
3. 🔄 **Initialize spec-kit** (run `specify init --here --ai copilot`)
4. 📝 **Review constitution** (customize project standards)
5. 🚀 **Start spec-driven development** (create specs, implement features)

---

**For questions or issues, refer to the [GitHub Spec Kit repository](https://github.com/github/spec-kit) or the [StormCom project documentation](../README.md).**
