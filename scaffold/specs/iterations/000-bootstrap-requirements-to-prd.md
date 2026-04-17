# IR-000: Bootstrap — Requirements to prd.json

## Goal

Convert human-confirmed `docs/requirements.md` into executable `scripts/ralph/prd.json`
through the four-layer spec-driven-dev pipeline.

## Deliverables

- [ ] `docs/requirements.md` — Human-confirmed requirements (already exists)
- [ ] `docs/requirements-mapping.md` — Traceability table (requirements → US → prd.json)
- [ ] `specs/decisions/001-<project>-gears.md` — GEARS format behavioral specs
- [ ] `specs/iterations/001-<feature>.md` — User Stories, iteration 1
- [ ] `scripts/ralph/prd.json` — Ralph execution format with `source` traceability field

## Tasks

1. **Read requirements.md** — identify all functional areas and confirmation status

2. **Write GEARS specs** (`specs/decisions/001-<project>-gears.md`)
   - Convert each requirement to GEARS `shall` sentences
   - Group by functional area (Authentication / Quota / Dashboard / Admin / etc.)

3. **Split into User Stories** (`specs/iterations/`)
   - One file per functional area (001-auth.md, 002-dashboard.md, etc.)
   - Each story must fit one AI context window
   - Include `Typecheck passes` and `Verify in browser` as standard AC items

4. **Generate mapping table** (`docs/requirements-mapping.md`)
   - Columns: requirements.md section | core content | iterations file | US title | prd.json ID
   - Present to product owner for spot-check

5. **Generate prd.json** (`scripts/ralph/prd.json`)
   - Use `/ralph` skill to convert iterations → prd.json
   - Add `source` field to each story pointing to requirements.md section
   - Validate: every requirement maps to at least one US

6. **Human confirmation** — product owner reviews mapping table, approves start

7. **Run ralph.sh** — autonomous development loop begins

## Acceptance Criteria

- [ ] All requirements.md sections map to at least one User Story
- [ ] prd.json has `source` field on every story
- [ ] docs/requirements-mapping.md reviewed and approved by product owner
- [ ] Git commit created for each layer transition
