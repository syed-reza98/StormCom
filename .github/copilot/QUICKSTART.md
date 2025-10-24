# Quick Start Guide: GitHub Copilot Customizations for StormCom

Get up and running with GitHub Copilot customizations in 5 minutes.

## ✅ Prerequisites

- VS Code or VS Code Insiders installed
- GitHub Copilot extension enabled
- StormCom repository cloned locally

## 🚀 Installation Steps

### Step 1: Essential Instructions (Auto-apply)

Copy the most important instruction files to your `.github/instructions/` directory. These will automatically apply based on file patterns:

```bash
# From the StormCom root directory
cp .github/copilot/instructions/nextjs.instructions.md .github/instructions/
cp .github/copilot/instructions/typescript.instructions.md .github/instructions/
cp .github/copilot/instructions/prisma.instructions.md .github/instructions/
cp .github/copilot/instructions/vitest.instructions.md .github/instructions/
cp .github/copilot/instructions/security-best-practices.instructions.md .github/instructions/
```

These will automatically apply when you work on:
- `**/*.ts`, `**/*.tsx` → TypeScript & Next.js standards
- `**/prisma/**/*` → Prisma best practices
- `**/*.test.ts` → Vitest testing standards
- `**/api/**/*` → Security best practices

### Step 2: Install Your First Prompt

Let's install the "Create Implementation Plan" prompt:

1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: "Copilot: Add Prompt"
4. Browse to: `.github/copilot/prompts/create-implementation-plan.prompt.md`
5. Click "Install"

### Step 3: Install Your First Chat Mode

Let's install the "Expert React Frontend Engineer" chat mode:

1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: "Copilot: Add Chat Mode"
4. Browse to: `.github/copilot/chatmodes/expert-react-frontend-engineer.chatmode.md`
5. Click "Install"

## 🎯 Try It Out

### Test a Prompt
1. Open any file in VS Code
2. Type `/` in Copilot Chat
3. Look for your installed prompts (e.g., `/create-implementation-plan`)
4. Select it and provide context

### Test a Chat Mode
1. Open Copilot Chat (icon in sidebar or `Cmd+I`/`Ctrl+I`)
2. Click the mode selector at the top
3. Choose "Expert React Frontend Engineer"
4. Ask a coding question!

## 📦 Recommended Starter Pack

Based on your role, install these customizations:

### For Full-Stack Developers
**Instructions** (copy to `.github/instructions/`):
- `nextjs.instructions.md`
- `typescript.instructions.md`
- `prisma.instructions.md`
- `vitest.instructions.md`
- `security-best-practices.instructions.md`
- `tailwind.instructions.md`

**Prompts**:
- `create-implementation-plan.prompt.md`
- `create-specification.prompt.md`

**Chat Modes**:
- `expert-react-frontend-engineer.chatmode.md`
- `principal-software-engineer.chatmode.md`
- `mentor.chatmode.md`

### For QA Engineers
**Instructions**:
- `vitest.instructions.md`
- `playwright-typescript.instructions.md`

**Prompts**:
- `playwright-typescript.prompt.md`
- `javascript-typescript-jest.prompt.md`

**Chat Modes**:
- `playwright-tester.chatmode.md`
- `tdd-red.chatmode.md`
- `tdd-green.chatmode.md`
- `tdd-refactor.chatmode.md`

### For DevOps Engineers
**Instructions**:
- `github-actions-ci-cd-best-practices.instructions.md`
- `containerization-docker-best-practices.instructions.md`
- `devops-core-principles.instructions.md`

**Prompts**:
- `multi-stage-dockerfile.prompt.md`
- `create-github-action-workflow-specification.prompt.md`

### For Documentation Writers
**Instructions**:
- `markdown.instructions.md`

**Prompts**:
- `create-readme.prompt.md`
- `readme-blueprint-generator.prompt.md`
- `documentation-writer.prompt.md`

## 💡 Usage Examples

### Example 1: Create a New Feature Specification

```
/create-specification

Create a specification for a product review and rating system.
Users should be able to rate products 1-5 stars and leave written reviews.
Only verified purchasers can leave reviews.
Store owners can respond to reviews.
```

### Example 2: Get React Best Practices Help

1. Switch to "Expert React Frontend Engineer" chat mode
2. Ask:
```
I need to create a ProductCard component that shows:
- Product image
- Name
- Price
- Add to cart button

It should follow our Next.js + Tailwind standards.
Should it be a Server Component or Client Component?
```

### Example 3: Write Playwright Tests

1. Switch to "Playwright Tester" chat mode
2. Provide context:
```
Write E2E tests for the login flow:
- User enters email and password
- Clicks submit
- Should redirect to /dashboard on success
- Should show error message on failure
```

## 🔍 Discover More

Browse the full catalog:
- **Index**: `.github/copilot/INDEX.md` - Categorized list of all customizations
- **Collection**: `.github/copilot/collections/stormcom-development.collection.yml` - Complete collection metadata

## 🆘 Troubleshooting

### Prompts/Chat Modes Not Showing Up
1. Restart VS Code
2. Check that GitHub Copilot extension is up to date
3. Verify files are in the correct directories

### Instructions Not Auto-Applying
1. Check the `applyTo` pattern in the instruction file's frontmatter
2. Ensure files are in `.github/instructions/` directory
3. Try opening/closing the file you're working on

### Need Help?
- Check the main README: `.github/copilot/README.md`
- Review the index: `.github/copilot/INDEX.md`
- Consult project documentation: `.specify/memory/constitution.md`

## 📚 Next Steps

1. **Explore the full collection**: Browse `.github/copilot/INDEX.md`
2. **Install role-specific customizations**: See recommended packs above
3. **Learn advanced workflows**: Read `.github/copilot/README.md`
4. **Customize for your needs**: Edit files or create new ones
5. **Share with team**: Commit your `.github/instructions/` directory

## 🎓 Learning Resources

- **awesome-copilot**: https://github.com/rezwana-karim/awesome-copilot
- **GitHub Copilot Docs**: https://docs.github.com/copilot
- **VS Code Copilot Chat**: https://code.visualstudio.com/docs/copilot/copilot-chat

---

**Ready to boost your productivity with AI-powered development?** 🚀

Start with the "Recommended Starter Pack" for your role and experiment from there!
