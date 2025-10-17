# Contributing to StormCom

Thank you for your interest in contributing to StormCom! This document provides guidelines and instructions for contributing to this multi-tenant e-commerce SaaS platform.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Types](#contribution-types)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectful.

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **Git**: Latest stable version
- **Code Editor**: VS Code recommended with TypeScript and Prettier extensions

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/StormCom.git
   cd StormCom
   ```

3. **Install dependencies** (when project has dependencies):
   ```bash
   npm install
   ```

4. **Set up environment** (when project has application code):
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

5. **Initialize database** (when project has database):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

6. **Start development server** (when project has application code):
   ```bash
   npm run dev
   ```

### Project Structure

Familiarize yourself with the project structure:

```
StormCom/
├── docs/                  # Documentation
│   ├── specifications/    # Spec-Driven Development specs
│   ├── analysis/          # SRS analysis documents
│   └── references/        # Legacy documentation
├── src/                   # Source code (when implemented)
├── prisma/               # Database schema and migrations
└── tests/                # Test files
```

## Development Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code standards
3. **Test your changes** thoroughly
4. **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug in component"
   git commit -m "docs: update API documentation"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

## Contribution Types

We welcome the following types of contributions:

### What We Accept

✅ **Bug fixes** - Fixes for identified bugs with clear reproduction steps
✅ **Feature implementations** - New features aligned with project specifications
✅ **Documentation improvements** - Clarifications, corrections, and additions
✅ **Test coverage** - Additional tests for existing or new features
✅ **Performance improvements** - Optimizations with measurable benefits
✅ **Accessibility improvements** - Enhancements for WCAG 2.1 Level AA compliance
✅ **Security fixes** - Patches for security vulnerabilities
✅ **Refactoring** - Code improvements that maintain existing functionality

### What We Don't Accept

❌ **Style-only changes** - Pure formatting or whitespace changes
❌ **Breaking changes** - Changes that break existing functionality without discussion
❌ **Unsolicited major features** - Large features without prior discussion or approval
❌ **Prohibited technologies** - Using technologies listed as prohibited in our standards (e.g., Pages Router, Redux, CSS-in-JS)

## Pull Request Process

1. **Ensure all checks pass**:
   - All tests pass (`npm run test`)
   - Code is linted (`npm run lint`)
   - TypeScript compiles without errors (`npm run type-check`)
   - Build succeeds (`npm run build`)

2. **Update documentation**:
   - Update README.md if needed
   - Add JSDoc comments for new functions
   - Update relevant specification documents

3. **Add tests**:
   - Unit tests for business logic (minimum 80% coverage)
   - Integration tests for API routes
   - E2E tests for critical user paths

4. **Follow the PR template**:
   - Describe what changes were made and why
   - Link to related issues
   - Include screenshots for UI changes
   - Check off all items in the checklist

5. **Request review**:
   - At least one approval is required
   - Address all review comments
   - Make requested changes promptly

6. **Merge requirements**:
   - All CI checks must pass
   - Code review approved
   - No merge conflicts with main branch
   - Branch is up to date with main

## Code Standards

### TypeScript

- **Strict mode enabled** - All code must compile with `strict: true`
- **No `any` types** - Use proper TypeScript types
- **Explicit return types** - For all exported functions and methods
- **Modern features** - Use TypeScript 5.9+ features

### React Components

- **Server Components first** - Default to Server Components
- **Client Components only when needed** - For event handlers, hooks, browser APIs
- **Proper prop types** - Define interfaces for all component props
- **Accessibility** - All components must meet WCAG 2.1 Level AA

### API Design

- **RESTful conventions** - Follow standard HTTP methods and status codes
- **Input validation** - Use Zod schemas for all user inputs
- **Error handling** - Consistent error response format
- **Authentication** - Always check authentication and multi-tenant isolation

### Database

- **Prisma ORM only** - No raw SQL queries
- **Multi-tenant isolation** - Always filter by `storeId`
- **Soft deletes** - Use `deletedAt` for user-facing data
- **Migrations** - Use `prisma migrate` for schema changes

### File Organization

- **Group by feature** - Not by file type
- **Co-locate related files** - Component + tests in same directory
- **Maximum file size** - 300 lines per file
- **Maximum function size** - 50 lines per function

For complete code standards, see [Project Constitution](../docs/specifications/.speckit/constitution.md).

## Testing Requirements

### Test Coverage Goals

- **Business logic**: Minimum 80% coverage
- **Utility functions**: 100% coverage
- **Critical paths**: 100% E2E coverage
- **API routes**: 100% integration test coverage

### Testing Tools

- **Vitest**: Unit and integration tests
- **Playwright**: E2E tests
- **Testing Library**: Component testing

### Writing Tests

```typescript
describe('ProductService', () => {
  it('should return products for a store', async () => {
    // Arrange
    const mockProducts = [/* ... */];
    
    // Act
    const result = await getProducts('store-1');
    
    // Assert
    expect(result).toEqual(mockProducts);
  });
});
```

## Documentation

### When to Update Documentation

Update documentation when:
- Adding new features
- Changing existing behavior
- Fixing bugs that affect documented behavior
- Adding or updating configuration
- Changing API endpoints

### Documentation Standards

- **Markdown files** - Follow GitHub Flavored Markdown
- **Code examples** - Include complete, working examples
- **API documentation** - Document all endpoints with request/response examples
- **JSDoc comments** - For complex functions and types

## Getting Help

- **Documentation**: Start with the [docs/](../docs/) directory
- **Constitution**: See [constitution.md](../docs/specifications/.speckit/constitution.md)
- **Specifications**: See [specifications](../docs/specifications/001-stormcom-platform/)
- **Issues**: Check existing issues for context
- **Questions**: Open a discussion or issue for clarification

## Recognition

Contributors who submit accepted PRs will be recognized in:
- The project README
- Release notes
- Git commit history (co-authored-by)

Thank you for contributing to StormCom! 🚀
