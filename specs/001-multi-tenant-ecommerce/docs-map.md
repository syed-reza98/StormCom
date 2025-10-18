# Docs Map: StormCom Multi-Tenant E-Commerce

This file provides a quick reference map to all key documentation and specs for the StormCom SaaS platform. Use this to onboard, navigate, and find authoritative sources for architecture, features, and standards.

## 📁 Main Documentation Structure

```
StormCom/
├── specs/
│   └── 001-multi-tenant-ecommerce/
│       ├── spec.md            # Feature specification (authoritative)
│       ├── plan.md            # Implementation plan
│       ├── data-model.md      # Database schema
│       ├── quickstart.md      # Local setup guide
│       ├── research.md        # Technical decisions
│       ├── tasks.md           # Task breakdown
│       └── contracts/
│           ├── openapi.yaml   # OpenAPI 3.1 spec (API contract)
│           └── README.md      # API documentation
├── docs/
│   ├── analysis/              # SRS, gap analysis, onboarding
│   ├── audit/                 # UI audit HTML snapshots
│   ├── references/            # Legacy docs
│   └── spec-kit-docs/         # Spec Kit guides
├── .specify/
│   └── memory/
│       └── constitution.md    # Project constitution & standards
├── .github/
│   └── instructions/          # Area-specific coding rules
└── README.md                  # Project overview & links
```

## 🗺️ Key Files & Their Purpose

- **specs/001-multi-tenant-ecommerce/spec.md**: Main feature specification (read first)
- **specs/001-multi-tenant-ecommerce/plan.md**: Implementation plan & milestones
- **specs/001-multi-tenant-ecommerce/data-model.md**: Database schema & relationships
- **specs/001-multi-tenant-ecommerce/contracts/openapi.yaml**: API contract (OpenAPI 3.1)
- **specs/001-multi-tenant-ecommerce/tasks.md**: Task breakdown (traceable to US/T#)
- **docs/analysis/ecommerce_complete_srs.md**: SRS & requirements analysis
- **.specify/memory/constitution.md**: Project standards, code quality, Copilot best practices
- **.github/instructions/**: Coding rules for API, components, database, docs, tests
- **README.md**: Project overview, quick links, onboarding

## 🚦 Onboarding Flow

1. **Start with**: `specs/001-multi-tenant-ecommerce/spec.md`
2. **Review standards**: `.specify/memory/constitution.md`
3. **Check plan**: `specs/001-multi-tenant-ecommerce/plan.md`
4. **Understand data**: `specs/001-multi-tenant-ecommerce/data-model.md`
5. **API contract**: `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`
6. **Find coding rules**: `.github/instructions/`
7. **See SRS**: `docs/analysis/ecommerce_complete_srs.md`
8. **Use README.md** for links & overview

## 🔗 Internal Link Examples

- [Feature Spec](../spec.md)
- [Plan](../plan.md)
- [Data Model](../data-model.md)
- [API Contract](./contracts/openapi.yaml)
- [Project Constitution](../../../.specify/memory/constitution.md)
- [Coding Instructions](../../../.github/instructions/)
- [SRS Analysis](../../../docs/analysis/ecommerce_complete_srs.md)

## 🧭 Tips
- Always check the spec and constitution before coding.
- Use the instructions in `.github/instructions/` for area-specific rules.
- Trace tasks in `tasks.md` to user stories and requirements.
- For onboarding, follow the flow above for context and standards.

---

*This file is maintained for onboarding and navigation. Update as new docs/specs are added.*
