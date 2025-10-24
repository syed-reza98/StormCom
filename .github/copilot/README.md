# StormCom GitHub Copilot Customizations

This directory contains specialized GitHub Copilot customizations for the StormCom multi-tenant e-commerce SaaS platform, sourced from the [awesome-copilot](https://github.com/rezwana-karim/awesome-copilot) repository and tailored for our development workflow.

## 📁 Directory Structure

```
.github/copilot/
├── prompts/              # Task-specific prompts for common development scenarios
├── instructions/         # Coding standards and best practices
├── chatmodes/           # Specialized AI personas for different roles
├── collections/         # Curated collections of related customizations
├── tests/               # Validation and testing suite
│   ├── validate.js      # Automated validation script
│   ├── VALIDATION_REPORT.md  # Comprehensive validation results
│   └── TESTING_GUIDE.md      # Testing instructions and scenarios
└── README.md            # This file
```

## 🎯 Available Specializations

### For SaaS Application Developers
- **Prompts**: Next.js development, API creation, data modeling
- **Instructions**: TypeScript, React Server Components, Prisma ORM
- **Chat Modes**: Expert .NET/TypeScript engineer, API architect

### For Market Researchers
- **Prompts**: Create PRD, feature specification, market analysis
- **Chat Modes**: Product manager, business analyst

### For Documentation Reviewers
- **Prompts**: Documentation writer, README generator, specification creation
- **Instructions**: Markdown standards, documentation best practices
- **Chat Modes**: Documentation specialist, Diátaxis expert

### For System Designers & Architects
- **Prompts**: Architecture blueprint generator, implementation planning, ADR creation
- **Chat Modes**: Azure SaaS architect, principal software engineer, API architect

### For UI/UX Designers
- **Prompts**: Next.js + Tailwind development, accessibility review
- **Instructions**: React components, Tailwind CSS, accessibility standards
- **Chat Modes**: Expert React frontend engineer, accessibility mode

### For Q/A Specialists
- **Prompts**: Test generation, Playwright automation
- **Instructions**: Testing best practices (Vitest, Playwright)
- **Chat Modes**: Playwright tester, TDD modes (Red/Green/Refactor)

### For Security Experts
- **Prompts**: Security review, OWASP compliance
- **Instructions**: Security best practices, input validation
- **Chat Modes**: Security expert, code sentinel

### For DevOps Experts
- **Prompts**: GitHub Actions workflow creation, containerization
- **Instructions**: Docker best practices, CI/CD standards
- **Chat Modes**: DevOps core principles, Azure principal architect

## 🚀 Quick Start

### Installing Prompts
1. Browse the `prompts/` directory
2. Copy the `.prompt.md` file content
3. Use the prompt in VS Code with the `/` command

### Installing Instructions
1. Copy relevant `.instructions.md` files to your `.github/instructions/` directory
2. Instructions automatically apply based on file patterns

### Installing Chat Modes
1. Browse the `chatmodes/` directory
2. Import the `.chatmode.md` file into VS Code
3. Activate from the VS Code Chat interface

### Using Collections
1. Open the collection YAML file
2. Review the grouped customizations
3. Install individual items as needed

## 📚 Key Collections

### StormCom Development Collection
Located in `collections/stormcom-development.collection.yml`

Includes:
- Next.js + TypeScript + Tailwind development tools
- Prisma ORM and database management
- Testing and quality assurance
- Security and accessibility
- Documentation and specification
- DevOps and deployment

## 🛠️ Technology Stack Coverage

Our customizations are tailored for:
- **Frontend**: Next.js 16, React 19, TypeScript 5.9.3, Tailwind CSS 4.1.14
- **Backend**: Next.js API Routes, Server Actions, Prisma ORM
- **Database**: PostgreSQL (production), SQLite (development)
- **Testing**: Vitest 3.2.4, Playwright 1.56.0, Testing Library
- **Deployment**: Vercel serverless platform
- **Standards**: WCAG 2.1 Level AA, PCI DSS Level 1

## 📖 Usage Examples

### Creating a new feature specification
```
/create-specification
```

### Generating an implementation plan
```
/create-implementation-plan
```

### Getting Next.js best practices guidance
Chat with: **Next.js Best Practices for LLMs (2025)** mode

### Reviewing code for security
Chat with: **Security Expert** or **Wg Code Sentinel** mode

### Writing Playwright tests
Use: **Playwright Tester** mode or **playwright-automation-fill-in-form** prompt

## 🔗 Source Attribution

All customizations are sourced from [awesome-copilot](https://github.com/rezwana-karim/awesome-copilot) maintained by the GitHub Copilot community and adapted for the StormCom project requirements as documented in:

- `.specify/memory/constitution.md` - Project standards
- `specs/001-multi-tenant-ecommerce/spec.md` - Feature specification
- `specs/001-multi-tenant-ecommerce/plan.md` - Implementation plan

## ✅ Validation & Testing

All customizations have been comprehensively validated and tested:

- **Automated Validation**: Run `npm run validate` or `node tests/validate.js`
- **Test Results**: 108 tests passed (100% success rate)
- **GitHub Actions**: Continuous validation on every push
- **Validation Report**: See `tests/VALIDATION_REPORT.md` for detailed results
- **Testing Guide**: See `tests/TESTING_GUIDE.md` for manual testing instructions

### Quick Validation
```bash
cd .github/copilot
node tests/validate.js
```

Expected output: `🎉 All validations passed!`

## 📄 License

These customizations maintain their original MIT License from the awesome-copilot repository.

## 🤝 Contributing

When adding new customizations:
1. Ensure they align with StormCom's tech stack and standards
2. Follow the file naming conventions from awesome-copilot
3. Add proper frontmatter and documentation
4. Update the collection YAML if creating grouped customizations
5. **Run validation**: `node tests/validate.js` before committing
6. Test the customization in your local development environment

---

**Last Updated**: 2025-10-24  
**Maintained by**: StormCom Development Team  
**Validation Status**: ✅ All tests passing
