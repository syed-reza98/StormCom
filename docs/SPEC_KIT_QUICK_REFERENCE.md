# Spec Kit CLI - Quick Reference

## Installation

```bash
# Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH (for current session)
export PATH="$HOME/.local/bin:$PATH"

# Install specify-cli
uv tool install --from git+https://github.com/github/spec-kit.git specify-cli
```

## Common Commands

### Check System Tools

```bash
# Check installed tools and AI assistants
specify check
```

### Initialize Project

```bash
# New project in new directory
specify init my-project

# Initialize in current directory (brownfield)
specify init .
specify init --here

# With specific AI assistant
specify init --here --ai copilot
specify init --here --ai claude

# Force initialization (skip confirmation)
specify init --here --force

# Skip git initialization
specify init --here --no-git
```

### One-Time Execution (without installation)

```bash
# Run specify without installing it
uvx --from git+https://github.com/github/spec-kit.git specify check
uvx --from git+https://github.com/github/spec-kit.git specify init my-project
```

## Command Options

### `specify init` Options

| Option | Description |
|--------|-------------|
| `--ai <name>` | AI assistant (copilot, claude, gemini, cursor-agent, etc.) |
| `--here` | Initialize in current directory |
| `--force` | Skip confirmation for non-empty directory |
| `--no-git` | Skip git repository initialization |
| `--ignore-agent-tools` | Skip AI agent tool checks |
| `--debug` | Show verbose diagnostic output |
| `--skip-tls` | Skip SSL/TLS verification (not recommended) |
| `--github-token <token>` | GitHub token for API requests |

## Supported AI Assistants

- `copilot` - GitHub Copilot
- `claude` - Claude Code
- `gemini` - Gemini CLI
- `cursor-agent` - Cursor Agent
- `qwen` - Qwen Code
- `opencode` - OpenCode
- `codex` - Codex CLI
- `windsurf` - Windsurf
- `kilocode` - Kilo Code
- `auggie` - Auggie CLI
- `codebuddy` - CodeBuddy
- `q` - Amazon Q Developer CLI

## Workflow

1. **Install Tools**
   ```bash
   specify check
   ```

2. **Initialize Project**
   ```bash
   specify init --here --ai copilot
   ```

3. **Review Structure**
   ```bash
   ls -la .specify/
   ```

4. **Customize Constitution**
   ```bash
   vim docs/specifications/.speckit/constitution.md
   ```

5. **Create Specifications**
   ```bash
   mkdir -p docs/specifications/002-new-feature
   # Add spec.md, plan.md, data-model.md, api-contracts.md
   ```

## Help Commands

```bash
# Main help
specify --help

# Command-specific help
specify init --help
specify check --help
```

## Troubleshooting

### Command not found

```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Make permanent (bash)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Make permanent (zsh)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Update specify-cli

```bash
# Reinstall to get latest version
uv tool install --force --from git+https://github.com/github/spec-kit.git specify-cli
```

### Uninstall

```bash
# Remove specify-cli
uv tool uninstall specify-cli
```

## Resources

- **Spec Kit Repository**: https://github.com/github/spec-kit
- **Full Setup Guide**: [SPEC_KIT_SETUP.md](SPEC_KIT_SETUP.md)
- **StormCom Documentation**: [README.md](../README.md)
