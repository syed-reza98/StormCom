# StormCom Scripts

This directory contains utility scripts for the StormCom project.

## collect-type-errors.ps1

PowerShell script that runs TypeScript type checking and saves all errors to a JSON file.

### Usage

**Via npm script (recommended):**
```bash
npm run type-check:save
```

**Direct execution:**
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/collect-type-errors.ps1
```

### Output

The script creates/updates `typescript-errors.json` in the project root with the following structure:

```json
{
  "summary": {
    "timestamp": "2025-10-28T01:41:14Z",
    "command": "npm run type-check",
    "exitCode": 1,
    "totalErrors": 407,
    "totalWarnings": 0,
    "totalLines": 457
  },
  "errors": [
    {
      "file": "tests/e2e/auth/accessibility.spec.ts",
      "line": 43,
      "column": 7,
      "severity": "error",
      "code": "TS6133",
      "message": "'dashboardPage' is declared but its value is never read.",
      "fullText": "tests/e2e/auth/accessibility.spec.ts(43,7): error TS6133: 'dashboardPage' is declared but its value is never read."
    }
  ],
  "rawOutput": [
    "Full console output as array of strings..."
  ]
}
```

### Features

- **Structured error parsing**: Extracts file, line, column, error code, and message
- **Summary statistics**: Total errors, warnings, and exit code
- **Raw output preservation**: Full console output saved for reference
- **Timestamped**: Each run includes ISO 8601 timestamp
- **Exit code pass-through**: Script exits with same code as type-check

### Use Cases

1. **CI/CD Integration**: Track type errors over time
2. **Error Analysis**: Programmatically analyze TypeScript errors
3. **Documentation**: Generate error reports for documentation
4. **Debugging**: Review errors in structured format
5. **Metrics**: Track type safety improvements across commits

### Requirements

- PowerShell 5.1 or higher (included in Windows)
- Node.js and npm installed
- TypeScript configured in the project

### Exit Codes

- `0`: No type errors found
- `1`: Type errors found (same as `tsc --noEmit`)

### Related Commands

- `npm run type-check`: Run type check without saving (default tsc behavior)
- `npm run lint`: Run ESLint
- `npm run test`: Run unit tests
