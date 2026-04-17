# DR-000: Spec-Driven Development Structure

## Status

Accepted

## Context

AI coding agents need a structured, traceable spec layer to build software reliably.
This project uses a four-layer document architecture to ensure human-confirmed requirements
flow correctly into executable development tasks.

## Decision

### Four-Layer Architecture

```
Layer 1: requirements.md          ← Human-confirmed requirements (source of truth)
         ↓ (manual/AI transform)
Layer 2: specs/decisions/          ← GEARS format specs (AI-parseable)
         ↓ (manual/AI split)
Layer 3: specs/iterations/         ← User Stories in Markdown (human-readable)
         ↓ (/ralph skill convert)
Layer 4: scripts/ralph/prd.json   ← Ralph execution format (machine-executable)
```

### GEARS Format (Layer 2)

Use the following sentence patterns for all behavioral specs:

```
[Where <static precondition>] [While <stateful precondition>] [When <trigger>]
The <subject> shall <behavior>
```

Examples:
```
When the user submits username and password,
the authentication service shall validate credentials against LDAP
and return a signed JWT token on success.

Where the user does not have admin role,
the system shall not render or expose any admin menu items.
```

### User Story Format (Layer 3)

Each story must fit within one AI context window. Format:

```markdown
### US-NNN: Story Title
As a <role>, I want <goal> so that <benefit>.

**Acceptance Criteria:**
- [ ] Specific, testable criterion
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill
```

### Traceability (source field)

Every User Story must include a `source` field in prd.json pointing to
the requirements.md section it originates from.

### Human Confirmation Points

- Layer 1 (requirements.md): Must be confirmed by product owner before conversion
- Layer 3 (iterations): Recommended spot-check before starting development
- Mapping table (docs/requirements-mapping.md): Use for traceability review

## References

- GEARS syntax: https://github.com/sublang-ai/spex
- Ralph: https://github.com/snarktank/ralph
- spex: https://github.com/sublang-ai/spex
