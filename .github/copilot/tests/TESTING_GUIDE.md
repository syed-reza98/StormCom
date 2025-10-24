# Testing Guide for GitHub Copilot Customizations

This guide provides instructions for testing and validating the GitHub Copilot customizations for the StormCom project.

## Quick Test

Run the automated validation suite:

```bash
cd .github/copilot
node tests/validate.js
```

Expected output:
```
🎉 All validations passed!
Success Rate: 100.0%
```

## Automated Testing

### Validation Script

The `tests/validate.js` script performs comprehensive checks on all customization files:

**What it validates:**
- ✅ Directory structure
- ✅ File naming conventions
- ✅ File counts (15 chat modes, 14 instructions, 19 prompts)
- ✅ Content format and frontmatter
- ✅ Required keywords and patterns
- ✅ Cross-references in documentation
- ✅ Collection YAML structure
- ✅ Technology stack alignment

**Running the validation:**
```bash
# From repository root
node .github/copilot/tests/validate.js

# Or from copilot directory
cd .github/copilot
node tests/validate.js
```

### GitHub Actions Workflow

Automated validation runs on:
- Every push to `.github/copilot/**`
- Pull requests affecting customizations
- Weekly schedule (Mondays at 9 AM UTC)
- Manual workflow dispatch

**Workflow file:** `.github/workflows/validate-copilot-customizations.yml`

**View results:**
- Check the Actions tab in GitHub
- See validation summary in workflow run
- Review detailed logs for any failures

## Manual Testing

### 1. Testing Chat Modes

#### In VS Code

1. **Install a chat mode:**
   ```
   Cmd/Ctrl + Shift + P → "Copilot: Add Chat Mode"
   Browse to: .github/copilot/chatmodes/expert-react-frontend-engineer.chatmode.md
   ```

2. **Activate the chat mode:**
   - Open Copilot Chat (sidebar or `Cmd/Ctrl + I`)
   - Click mode selector at top
   - Select "Expert React Frontend Engineer"

3. **Test with a query:**
   ```
   Create a ProductCard component using Next.js 16 Server Components.
   Should display product name, price, and image.
   Use Tailwind CSS for styling.
   ```

4. **Verify the response:**
   - ✅ Uses Server Components by default
   - ✅ Proper TypeScript types
   - ✅ Tailwind CSS classes
   - ✅ Follows project conventions

#### All Chat Modes to Test

Test each specialization:

**SaaS Developer:**
- `expert-react-frontend-engineer` → React/TypeScript code generation
- `principal-software-engineer` → Architecture guidance
- `mentor` → Learning and guidance
- `janitor` → Code cleanup
- `gilfoyle` → Code review (humorous)

**Market Researcher:**
- `prd` → Product requirements generation

**System Designer:**
- `azure-saas-architect` → SaaS architecture
- `api-architect` → API design
- `plan` → Strategic planning

**UI/UX Designer:**
- `accessibility` → WCAG compliance

**Q/A Specialist:**
- `playwright-tester` → E2E test generation
- `tdd-red` → Write failing tests
- `tdd-green` → Make tests pass
- `tdd-refactor` → Code improvement

**Security Expert:**
- `wg-code-sentinel` → Security review

### 2. Testing Instructions

#### Auto-Apply Test

1. **Copy instructions to active directory:**
   ```bash
   cp .github/copilot/instructions/prisma.instructions.md .github/instructions/
   cp .github/copilot/instructions/vitest.instructions.md .github/instructions/
   cp .github/copilot/instructions/security-best-practices.instructions.md .github/instructions/
   ```

2. **Test Prisma instructions:**
   - Create a new Prisma schema file: `prisma/schema.prisma`
   - Ask Copilot to create a Product model
   - Verify it includes:
     - ✅ `id String @id @default(cuid())`
     - ✅ `storeId String` with foreign key
     - ✅ `createdAt`, `updatedAt` timestamps
     - ✅ `deletedAt DateTime?` for soft delete
     - ✅ Proper indexes

3. **Test Vitest instructions:**
   - Create a test file: `src/services/__tests__/product.test.ts`
   - Ask Copilot to write tests for a product service
   - Verify it uses:
     - ✅ AAA pattern (Arrange, Act, Assert)
     - ✅ `describe` and `it` blocks
     - ✅ Proper mocks with `vi.fn()`
     - ✅ `expect` assertions

4. **Test Security instructions:**
   - Create an API route: `src/app/api/products/route.ts`
   - Ask Copilot to add authentication
   - Verify it includes:
     - ✅ `getServerSession` check
     - ✅ `storeId` filtering
     - ✅ Zod validation
     - ✅ Error handling

### 3. Testing Prompts

#### In VS Code Chat

1. **Use a prompt:**
   ```
   Type "/" in Copilot Chat
   Select: /create-implementation-plan
   Provide context: "Add product review feature"
   ```

2. **Verify the output:**
   - ✅ Structured implementation plan
   - ✅ Phases and tasks
   - ✅ Technical considerations
   - ✅ Testing strategy

#### Prompts to Test

- `/create-specification` → Feature specification
- `/create-implementation-plan` → Implementation planning
- `/create-readme` → README generation
- `/architecture-blueprint-generator` → Architecture docs
- `/create-architectural-decision-record` → ADR creation

### 4. Testing Collection YAML

1. **View the collection:**
   ```bash
   cat .github/copilot/collections/stormcom-development.collection.yml
   ```

2. **Verify structure:**
   - ✅ Has `name` and `description`
   - ✅ Has `items` array
   - ✅ Each item has `type`, `name`, `description`, `category`
   - ✅ All 8 specialization categories present

3. **Check references:**
   - ✅ File paths are correct
   - ✅ Source URLs are valid (for awesome-copilot items)
   - ✅ Categories match documentation

## Test Scenarios

### Scenario 1: New Feature Development

**Goal:** Test full workflow from specification to implementation

1. Use `/create-specification` prompt
2. Switch to `plan` chat mode for architecture
3. Switch to `expert-react-frontend-engineer` for component creation
4. Use `vitest.instructions.md` for test generation
5. Use `wg-code-sentinel` for security review

**Expected:** Seamless workflow with consistent guidance

### Scenario 2: Bug Fix with TDD

**Goal:** Test TDD workflow

1. Switch to `tdd-red` chat mode → Write failing test
2. Switch to `tdd-green` chat mode → Fix to make test pass
3. Switch to `tdd-refactor` chat mode → Improve code quality

**Expected:** Proper TDD cycle with guidance at each phase

### Scenario 3: Documentation Creation

**Goal:** Test documentation tools

1. Use `/create-readme` prompt for project README
2. Use `/documentation-writer` prompt for feature docs
3. Use `/create-architectural-decision-record` for ADR

**Expected:** Comprehensive, well-structured documentation

### Scenario 4: Security Review

**Goal:** Test security validation

1. Create API route with authentication
2. Switch to `wg-code-sentinel` chat mode
3. Request security review
4. Apply `security-best-practices.instructions.md`

**Expected:** Identification of security issues and best practice suggestions

## Troubleshooting

### Chat Mode Not Appearing

**Problem:** Installed chat mode doesn't show in selector

**Solutions:**
1. Restart VS Code
2. Reinstall the chat mode
3. Check file has valid frontmatter
4. Verify GitHub Copilot extension is up to date

### Instructions Not Auto-Applying

**Problem:** Instructions don't seem to affect suggestions

**Solutions:**
1. Verify files are in `.github/instructions/` (not `.github/copilot/instructions/`)
2. Check the `applyTo` pattern matches your file
3. Try reopening the file
4. Check instructions have proper frontmatter (if required)

### Prompt Not Found

**Problem:** Prompt doesn't appear when typing `/`

**Solutions:**
1. Verify prompt is installed
2. Restart VS Code
3. Check prompt file format
4. Try reinstalling the prompt

### Validation Script Fails

**Problem:** `validate.js` reports errors

**Solutions:**
1. Check which validation failed in the output
2. Verify all files are present
3. Check file naming conventions
4. Ensure content meets minimum length requirements

## Performance Testing

### Response Time

Test that chat modes respond within acceptable time:

**Acceptable:**
- Simple queries: < 5 seconds
- Complex queries: < 15 seconds

**If slow:**
- Check network connection
- Verify GitHub Copilot service status
- Try simpler queries
- Check VS Code performance

### Accuracy Testing

Verify responses are accurate and helpful:

**For Chat Modes:**
- ✅ Responses match specialization
- ✅ Code examples are correct
- ✅ Follows project conventions
- ✅ Includes proper error handling
- ✅ Security best practices included

**For Instructions:**
- ✅ Auto-suggestions use correct patterns
- ✅ File-specific guidance applies
- ✅ Technology-specific best practices included

**For Prompts:**
- ✅ Output follows expected structure
- ✅ Comprehensive coverage of topic
- ✅ Actionable recommendations

## Continuous Testing

### Weekly Validation

GitHub Actions runs weekly validation:

**What's tested:**
- File structure integrity
- Content validation
- Cross-reference checks
- Custom instruction keywords
- Collection YAML structure

**View results:**
- GitHub Actions tab
- Check for green checkmarks
- Review any failures

### Update Testing

When updating customizations:

1. Run validation before committing:
   ```bash
   node .github/copilot/tests/validate.js
   ```

2. Test manually in VS Code

3. Create PR and check GitHub Actions

4. Get team feedback on changes

## Test Report Template

Use this template to document testing:

```markdown
# Test Report: [Customization Name]

**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**File:** [File Path]

## Test Results

### Functionality
- [ ] Responds appropriately to queries
- [ ] Output quality is high
- [ ] Follows project conventions

### Content
- [ ] Has required frontmatter
- [ ] Content is substantial
- [ ] Keywords are present

### Integration
- [ ] Works with other customizations
- [ ] No conflicts observed
- [ ] Proper attribution included

## Issues Found
[List any issues]

## Recommendations
[List improvement suggestions]

## Overall Status
- [ ] ✅ Approved
- [ ] ⚠️ Needs minor fixes
- [ ] ❌ Needs major revision
```

## Resources

- **Validation Report:** `.github/copilot/tests/VALIDATION_REPORT.md`
- **Validation Script:** `.github/copilot/tests/validate.js`
- **GitHub Workflow:** `.github/workflows/validate-copilot-customizations.yml`
- **Main README:** `.github/copilot/README.md`
- **Quick Start:** `.github/copilot/QUICKSTART.md`

---

**Last Updated:** 2025-10-24
**Status:** All tests passing ✅
