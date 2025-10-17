<!-- 
Thank you for contributing to StormCom! Please fill out this template to help us review your pull request efficiently.
-->

## Description

### Why

<!-- Link to the issue this PR addresses, or explain the problem/motivation -->

Fixes #
Related to #

### What

<!-- Describe what changes you made and how they solve the problem -->

<!-- If you made UI changes, include screenshots or GIFs showing the before and after -->

## Type of Change

Please check the relevant option(s):

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI change
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test addition or update
- [ ] 🔧 Configuration change
- [ ] 🏗️ Infrastructure change

## Checklist

Please ensure your PR meets the following requirements:

### Code Quality

- [ ] Code follows the project's TypeScript and code style guidelines
- [ ] Code is properly formatted (ran `npm run format`)
- [ ] Code passes linting (ran `npm run lint`)
- [ ] TypeScript compiles without errors (ran `npm run type-check`)
- [ ] No `any` types used (except for documented third-party library interfaces)
- [ ] File size limits respected (max 300 lines per file, 50 lines per function)

### Testing

- [ ] All existing tests pass (ran `npm run test`)
- [ ] New tests have been added for new features or bug fixes
- [ ] Test coverage meets requirements:
  - [ ] Business logic: minimum 80% coverage
  - [ ] Utility functions: 100% coverage
  - [ ] API routes: integration tests added
  - [ ] Critical paths: E2E tests added (if applicable)
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)

### Security & Best Practices

- [ ] Authentication checks are in place for protected routes
- [ ] Multi-tenant isolation is enforced (storeId filtering)
- [ ] Input validation is implemented using Zod schemas
- [ ] No secrets or sensitive data in code (using environment variables)
- [ ] SQL injection prevention (using Prisma, no raw SQL)
- [ ] XSS prevention (proper input sanitization)

### Documentation

- [ ] Documentation has been updated (if applicable)
- [ ] JSDoc comments added for complex functions
- [ ] API documentation updated (if API changes were made)
- [ ] README.md updated (if needed)
- [ ] Specification documents updated (if architectural changes were made)

### Database (if applicable)

- [ ] Database migration created (if schema changes were made)
- [ ] Migration tested on local database
- [ ] Seed data updated (if needed)
- [ ] Indexes added for new query patterns
- [ ] Soft delete pattern followed for user-facing data

### Accessibility (if UI changes were made)

- [ ] Meets WCAG 2.1 Level AA standards
- [ ] Keyboard navigation works properly
- [ ] ARIA labels added where necessary
- [ ] Color contrast ratios meet requirements (≥ 4.5:1)
- [ ] Focus indicators are visible
- [ ] Alt text provided for images
- [ ] Tested with screen reader (if major UI changes)

### Performance (if applicable)

- [ ] Page load time within budget (< 2.0s LCP desktop, < 2.5s mobile)
- [ ] API response time within budget (< 500ms p95)
- [ ] Database queries optimized (no N+1 queries)
- [ ] Images optimized (using Next.js Image component)
- [ ] Bundle size within limits (< 200KB initial load)

### Build & Deployment

- [ ] Build succeeds locally (ran `npm run build`)
- [ ] No console errors or warnings
- [ ] Environment variables documented (if new ones added)
- [ ] Works in both development and production modes

## Screenshots (if applicable)

<!-- 
Include screenshots or screen recordings for:
- UI changes
- New features with visual components
- Bug fixes affecting the UI
-->

### Before

<!-- Screenshot of the issue/old behavior -->

### After

<!-- Screenshot of the fix/new behavior -->

## Additional Context

<!-- 
Add any other context about the pull request here:
- Related PRs
- Performance benchmarks
- Migration notes
- Deployment considerations
- Breaking changes details
-->

## Reviewer Notes

<!-- 
Notes for reviewers:
- Areas that need special attention
- Questions or concerns
- Testing instructions
-->

---

By submitting this pull request, I confirm that:
- [ ] I have read and agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md)
- [ ] I have read the [Contributing Guidelines](./CONTRIBUTING.md)
- [ ] My contribution is original work or properly attributed
- [ ] I agree to license my contribution under the project's MIT License
