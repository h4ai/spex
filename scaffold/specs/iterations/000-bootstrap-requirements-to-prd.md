# Bootstrap — Requirements to prd.json

## Goal

Convert human-confirmed `docs/requirements.md` into executable `scripts/ralph/prd.json`
through the three-layer spec-driven-dev pipeline.

## Deliverables

- [ ] `docs/requirements.md` — Human-confirmed requirements (already exists)
- [ ] `docs/requirements-mapping.md` — Traceability table (requirements → Layer 2 → prd.json)
- [ ] `specs/decisions/001-<project>.md` — GEARS + AC behavioral specs
- [ ] `scripts/ralph/prd.json` — Ralph execution format with `source` traceability field

## Tasks

1. **Read requirements.md** — identify all functional areas and confirmation status

2. **Write GEARS+AC specs** (`specs/decisions/001-<project>.md`)
   - Convert each requirement to GEARS `shall` sentences
   - Add AC items per functional area
   - Add `Source` pointing to exact requirements.md section
   - Group by functional area (Authentication / Quota / Dashboard / Admin / etc.)

3. **Generate mapping table** (`docs/requirements-mapping.md`)
   - Columns: requirements.md section | core content | Layer 2 section | prd.json ID
   - Present to product owner for spot-check

4. **Generate prd.json** (`scripts/ralph/prd.json`)
   - Use `/ralph` skill to convert Layer 2 → prd.json
   - Derive `description` from GEARS behavior summary
   - Derive `acceptanceCriteria` from Layer 2 AC items
   - Add `source` field pointing to requirements.md section

5. **Human confirmation** — product owner reviews mapping table, approves start

6. **Run ralph.sh** — autonomous development loop begins

## Acceptance Criteria

- [ ] All requirements.md sections map to at least one prd.json story
- [ ] prd.json has `source` field on every story
- [ ] docs/requirements-mapping.md reviewed and approved by product owner
- [ ] Git commit created for Layer 2 and Layer 3
