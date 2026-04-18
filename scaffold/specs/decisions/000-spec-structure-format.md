# DR-000: Spec-Driven Development Structure

## Status

Accepted

## Context

AI coding agents need a structured, traceable spec layer to build software reliably.
This project uses a three-layer document architecture to ensure human-confirmed requirements
flow correctly into executable development tasks.

## Decision

### Three-Layer Architecture

```
Layer 1: requirements.md             ← Human-confirmed requirements (source of truth)
         ↓ (this skill: Steps 2–3)
Layer 2: specs/decisions/            ← GEARS behavioral specs + AC (AI-parseable, traceable)
         ↓ (this skill: Step 5, /ralph)
Layer 3: scripts/ralph/prd.json      ← Ralph execution format (machine-executable)
```

### Layer 2 Format: GEARS + AC

Each functional area uses three sections:

```markdown
## <Functional Area>

### Behavior (GEARS)

\`\`\`gears
[Where <static precondition>] [While <stateful precondition>] [When <trigger>]
The <subject> shall <behavior>
\`\`\`

### Acceptance Criteria

- [ ] Specific testable criterion
- [ ] Typecheck passes

### Source

> requirements.md §<section name>
```

**GEARS syntax:**
```
When the user submits username and password,
the authentication service shall validate credentials against LDAP
and return a signed JWT token on success.

Where the user does not have admin role,
the system shall not render or expose any admin menu items.
```

### Traceability (source field)

Every `specs/decisions/` section and every `prd.json` story must have a `source` pointing
back to the exact `requirements.md` section. This enables audit and compliance traceability.

### No User Stories

User Stories (`As a … I want …`) have been removed from the pipeline.
GEARS behavioral specs are sufficient for both human readability and AI execution.
AC items in Layer 2 map 1:1 to prd.json `acceptanceCriteria`.
