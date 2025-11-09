---
title: Components – Bulk Import
category: components/bulk-import
files:
  - bulk-import-upload.tsx
  - bulk-import-templates.tsx
  - bulk-import-history.tsx
riskLevel: medium
---

# Bulk Import Components Review

Notes:
- Upload: Enforce file size/type restrictions; provide progress UI; use server-side streaming parse for scalability.
- Templates: Offer downloadable sample CSV/JSON; keep versioning if schema evolves.
- History: Paginate results; show status (success/partial/failed) with links to error reports.
- Security: Sanitize filenames; prevent path traversal; scan content for malicious payloads.
- Performance: Offload heavy parsing to worker/job queue; UI should poll or subscribe for status updates.

Recommendations:
1. Implement optimistic UI for job submission.
2. Provide accessible status indicators (aria-live for completion).
3. Add tests covering error handling for malformed files.
