---
name: spec-driven-dev
description: "Full pipeline: human-confirmed requirements → GEARS+AC specs → prd.json → Ralph autonomous development loop. Includes /prd and /ralph skills. Triggers on: spec-driven, three-layer spec, requirements to prd.json, generate prd.json, start ralph, autonomous development."
user-invocable: true
---

# Spec-Driven Development — Complete Pipeline

End-to-end workflow: human-confirmed `docs/requirements.md` → autonomous development via Ralph.

Bundles three skills into one coherent pipeline:
- **`/prd`** — generate a PRD from a feature description
- **`/ralph`** — convert PRD/requirements to prd.json
- **`spec-driven-dev`** (this skill) — full three-layer traceable pipeline + Ralph execution

---

## The Three-Layer Architecture

```
Layer 1: docs/requirements.md                ← Human confirmed. Source of truth. READ-ONLY for AI.
              ↓ this skill (Steps 2–3)
Layer 2: specs/decisions/001-<project>.md    ← GEARS behavioral specs + AC (AI-parseable, traceable)
              ↓ this skill (Step 4, uses /ralph)
Layer 3: scripts/ralph/prd.json              ← Machine-executable, with "source" traceability
              ↓ ralph.sh (Step 6)
              🤖 Autonomous development loop
```

**Human confirmation points (DO NOT skip):**
1. ✅ Layer 1 requirements.md — confirmed by product owner BEFORE running this skill
2. 🔍 Mapping table review — product owner spot-checks before ralph.sh starts

---

## Layer 2 Format: GEARS + AC

Each functional area in `specs/decisions/001-<project>.md` contains three parts:

```markdown
## <Functional Area>

### Behavior (GEARS)

\`\`\`gears
[Where <static precondition>] [While <stateful precondition>] [When <trigger>]
The <subject> shall <behavior>
\`\`\`

### Acceptance Criteria

- [ ] <Specific testable criterion>
- [ ] <API endpoint / UI behavior / constraint>
- [ ] Typecheck passes

### Source

> requirements.md §<section name>
```

**GEARS syntax rules:**
- `Where` = static precondition (role, configuration, state)
- `While` = dynamic/stateful condition
- `When` = trigger event
- One `gears` block per functional area
- Cover EVERY requirement — do not skip any section

---

## Complete Step-by-Step

### Step 1: Verify requirements.md is confirmed

Read `docs/requirements.md`. Check for confirmation marker such as:
- `状态：✅ 全部确认`
- `Status: Confirmed`
- `> Confirmed by: <name>`

**If not confirmed → STOP.** Tell the user: "requirements.md needs human confirmation before proceeding."

---

### Step 2: Run spex scaffold

```bash
npx @sublang/spex scaffold
```

Creates `specs/decisions/`, `CLAUDE.md`, `AGENTS.md`.
Safe to re-run (idempotent).

---

### Step 3: Generate GEARS+AC specs → `specs/decisions/001-<project>.md`

File format:

```markdown
# 001 — <Project> Behavioral Specs

> Format: GEARS + AC
> Source: docs/requirements.md vX.X

## <Functional Area>

### Behavior (GEARS)

\`\`\`gears
When the user submits username and password,
the authentication service shall validate credentials against LDAP
and return a signed JWT token (TTL 8 hours) on success.

Where the user does not have admin role,
the system shall not render or expose any admin menu items.
\`\`\`

### Acceptance Criteria

- [ ] POST /api/auth/login returns JWT on valid credentials
- [ ] JWT TTL is 8 hours
- [ ] Admin menu is hidden for non-admin roles
- [ ] Typecheck passes

### Source

> requirements.md §Three — Authentication

## <Next Functional Area>
...
```

Rules:
- One section per functional area
- Every section must have Behavior + AC + Source
- `Source` must reference the exact requirements.md section
- No User Stories (`As a ... I want ...`) — GEARS only

---

### Step 4: Git commit Layer 2

```bash
git add specs/decisions/
git commit -m "feat: GEARS+AC behavioral specs from requirements.md"
```

---

### Step 5: Generate prd.json → `scripts/ralph/prd.json`

Derived directly from Layer 2. Each AC item becomes a task unit grouped by functional area.

```json
{
  "project": "<project-name>",
  "branchName": "ralph/<feature-kebab-case>",
  "description": "<one-line from requirements intro>",
  "userStories": [
    {
      "id": "US-001",
      "title": "<functional area> — <capability>",
      "description": "<GEARS behavior summary, one sentence>",
      "acceptanceCriteria": [
        "<criterion from Layer 2 AC>",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": "",
      "source": "requirements.md §<section name>"
    }
  ]
}
```

**Critical:** Every story MUST have `"source"` field. No source = broken traceability.

Validate:
- Story count in prd.json == functional area count in Layer 2
- No story missing `source`
- Stories ordered by dependency (schema → backend → frontend)
- Story sizing: each story completes in ONE Ralph iteration

| ✅ Right size | ❌ Too big (split) |
|--------------|------------------|
| Add one API endpoint | "Build the entire dashboard" |
| Add one UI component | "Add authentication" |
| Backend + frontend for one feature | "Refactor the API" |

---

### Step 6: Generate mapping table + human spot-check

Output: `docs/requirements-mapping.md`

```markdown
# Requirements Mapping Table

| requirements.md section | Core content | Layer 2 file | prd.json ID |
|------------------------|-------------|--------------|-------------|
| §Three Auth (Admin) | bcrypt hash, JWT 8h | 001-project.md §Auth | US-001 |
| §Three Auth (AD User) | LDAP, first login → L1 | 001-project.md §Auth | US-002 |
```

Check: every requirements.md section has ≥1 row. Mark unmapped as `⚠️ UNMAPPED`.

Present to product owner:

```
沈老板，映射关系表已生成，请确认（随机抽几行）：

| requirements.md 章节 | 核心内容 | prd.json ID | 关键验收标准 |
|---------------------|---------|-------------|-------------|
| ...

全部 N 个需求点已映射，无遗漏。确认OK后启动 ralph.sh。
```

**DO NOT proceed to Step 7 until confirmed.**

---

### Step 7: Git commit Layer 3

```bash
git add docs/requirements-mapping.md scripts/ralph/prd.json
git commit -m "feat: prd.json + mapping table (N stories, GEARS-sourced)"
```

---

### Step 8: Run ralph.sh

```bash
chmod +x scripts/ralph/ralph.sh
cd <project-root>
./scripts/ralph/ralph.sh
```

Ralph loop behavior:
1. Reads `scripts/ralph/prd.json`
2. Finds the first story where `"passes": false`
3. Spawns a fresh Claude Code instance with `scripts/ralph/CLAUDE.md` as context
4. Claude Code implements the story, runs tests, marks `"passes": true` on success
5. Commits to git
6. Loops to next story
7. Stops when all stories pass

Monitor progress:
```bash
cat scripts/ralph/prd.json | jq '.userStories[] | {id, title, passes}'
```

---

## Validation Checklist (before Step 8)

- [ ] requirements.md confirmed by product owner
- [ ] All requirements.md sections appear in Layer 2 and mapping table
- [ ] No `⚠️ UNMAPPED` rows
- [ ] Every prd.json story has `source` field
- [ ] Stories ordered: schema → backend → frontend
- [ ] No single story too large (2-3 sentence describable)
- [ ] Product owner has reviewed mapping table
- [ ] Git history shows commits for Layer 2 and Layer 3

---

## Output File Structure

```
project/
├── docs/
│   ├── requirements.md                  ← Layer 1 (human confirmed, READ-ONLY for AI)
│   └── requirements-mapping.md          ← Traceability table (L1 → L2 → L3)
├── specs/
│   └── decisions/
│       └── 001-<project>.md             ← Layer 2 (GEARS + AC, per functional area)
├── scripts/
│   └── ralph/
│       ├── ralph.sh                     ← Ralph execution loop
│       ├── CLAUDE.md                    ← Claude Code context for each iteration
│       └── prd.json                     ← Layer 3 (executable, with source field)
├── CLAUDE.md                            ← Auto-generated by spex scaffold
└── AGENTS.md                            ← Auto-generated by spex scaffold
```

---

## Related Skills (also in this repo)

| Skill | Location | Purpose |
|-------|----------|---------|
| `/prd` | `skills/prd/SKILL.md` | Generate PRD from a feature description (use BEFORE this skill) |
| `/ralph` | `skills/ralph/SKILL.md` | Convert a PRD/Markdown to prd.json (used internally by Step 5) |
| `spec-driven-dev` | `skills/spec-driven-dev/SKILL.md` | This skill — full pipeline |

**Typical flow:**
```
Feature idea → /prd → docs/requirements.md → [human confirms] → spec-driven-dev → ralph.sh
```

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing `source` in prd.json | No traceability | Validate before commit (Step 5) |
| Writing User Stories (As a…) instead of GEARS | Not machine-parseable | Use GEARS syntax only |
| Story too large | Agent gets stuck mid-context | Max 2-3 sentences to describe; split otherwise |
| Wrong story order | Depends on non-existent code | Schema first, frontend last |
| Skipping mapping table review | Builds wrong features | Enforce spot-check gate (Step 6) |
| AI modifying requirements.md | Breaks source of truth | requirements.md = human-only |
| Running ralph.sh without confirmation | Wasted compute | Never skip Step 6 human gate |
