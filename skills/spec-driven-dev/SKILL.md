---
name: spec-driven-dev
description: "Full pipeline: human-confirmed requirements → GEARS specs → User Stories → prd.json → Ralph autonomous development loop. Includes /prd and /ralph skills. Triggers on: spec-driven, four-layer spec, requirements to prd.json, generate prd.json, start ralph, autonomous development."
user-invocable: true
---

# Spec-Driven Development — Complete Pipeline

End-to-end workflow: human-confirmed `docs/requirements.md` → autonomous development via Ralph.

Bundles three skills into one coherent pipeline:
- **`/prd`** — generate a PRD from a feature description
- **`/ralph`** — convert PRD/requirements to prd.json
- **`spec-driven-dev`** (this skill) — full four-layer traceable pipeline + Ralph execution

---

## The Four-Layer Architecture

```
Layer 1: docs/requirements.md           ← Human confirmed. Source of truth. READ-ONLY for AI.
              ↓ this skill (Steps 3–4)
Layer 2: specs/decisions/001-gears.md   ← GEARS behavioral specs (AI-parseable)
              ↓ this skill (Step 5)
Layer 3: specs/iterations/NNN-xxx.md   ← User Stories, Markdown (human-readable)
              ↓ this skill (Step 6, uses /ralph)
Layer 4: scripts/ralph/prd.json         ← Machine-executable, with "source" traceability
              ↓ ralph.sh (Step 9)
              🤖 Autonomous development loop
```

**Human confirmation points (DO NOT skip):**
1. ✅ Layer 1 requirements.md — confirmed by product owner BEFORE running this skill
2. 🔍 Mapping table review — product owner spot-checks before ralph.sh starts

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

Creates `specs/decisions/`, `specs/iterations/`, `CLAUDE.md`, `AGENTS.md`.
Safe to re-run (idempotent).

---

### Step 3: Generate GEARS specs → `specs/decisions/001-<project>-gears.md`

**GEARS syntax:**
```
[Where <static precondition>] [While <stateful precondition>] [When <trigger>]
The <subject> shall <behavior>
```

File format:
```markdown
# 001 — <Project> Behavioral Specs (GEARS Format)

> Format: GEARS
> Source: docs/requirements.md vX.X

## <Functional Area>

\`\`\`gears
When the user submits username and password,
the authentication service shall validate credentials against LDAP
and return a signed JWT token (TTL 8 hours) on success.

Where the user does not have admin role,
the system shall not render or expose any admin menu items.
\`\`\`

## <Next Area>
...
```

Rules:
- One `gears` block per functional area
- Cover EVERY requirement; do not skip any section
- `Where` = static precondition, `When` = trigger, `While` = stateful condition

---

### Step 4: Git commit Layer 2

```bash
git add specs/decisions/
git commit -m "feat: GEARS behavioral specs from requirements.md"
```

---

### Step 5: Split into User Stories → `specs/iterations/`

Create one file per functional area:
- `001-auth.md`, `002-dashboard.md`, `003-admin.md`, etc.

**Story format:**
```markdown
# Iteration NNN — <Area Name>

> Priority: N | Depends on: Iteration M | Estimated iterations: 2~3

## Goal
One sentence describing what this iteration delivers.

## User Stories

### US-NNN: Story Title
As a <role>, I want <goal> so that <benefit>.

**Acceptance Criteria:**
- [ ] Specific testable criterion (API endpoint / behavior / constraint)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill
```

**Story sizing — THE NUMBER ONE RULE:**
Each story must complete in ONE Ralph iteration (one context window).

| ✅ Right size | ❌ Too big (split) |
|--------------|------------------|
| Add one API endpoint | "Build the entire dashboard" |
| Add one UI component | "Add authentication" |
| Backend API + frontend for one feature | "Refactor the API" |

**Story ordering — dependencies first:**
1. Schema / database migrations
2. Backend API / server actions
3. Frontend components using the backend
4. Aggregate views / dashboards

---

### Step 6: Generate prd.json (using /ralph skill internally)

Output: `scripts/ralph/prd.json`

```json
{
  "project": "<project-name>",
  "branchName": "ralph/<feature-kebab-case>",
  "description": "<one-line from requirements intro>",
  "userStories": [
    {
      "id": "US-001",
      "title": "<story title>",
      "description": "As a <role>, I want <goal> so that <benefit>.",
      "acceptanceCriteria": [
        "<criterion>",
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
- Story count in prd.json == story count across all iterations files
- No story missing `source`
- Stories ordered by dependency (schema → backend → frontend)

---

### Step 7: Generate mapping table → `docs/requirements-mapping.md`

```markdown
# Requirements Mapping Table

| requirements.md section | Core content | iterations file | User Story | prd.json ID |
|------------------------|-------------|----------------|-----------|-------------|
| §Three Auth (Admin) | bcrypt hash, config.yaml, JWT 8h | 001-auth.md | US-002 Admin Login | US-002 |
| §Three Auth (AD User) | LDAP, userId match, first login → L1 | 001-auth.md | US-003 AD Login | US-003 |
```

Check: every requirements.md section has ≥1 row. Mark unmapped as `⚠️ UNMAPPED`.

---

### Step 8: Human spot-check gate

Present the mapping table to the product owner:

```
沈老板，映射关系表已生成，请确认（随机抽几行）：

| requirements.md 章节 | 核心内容 | US | 关键验收标准 |
|---------------------|---------|-----|-------------|
| ...

全部 N 个需求点已映射，无遗漏。确认OK后启动 ralph.sh。
```

**DO NOT proceed to Step 9 until confirmed.**

---

### Step 9: Git commit Layers 3 & 4

```bash
git add specs/iterations/ docs/requirements-mapping.md scripts/ralph/prd.json
git commit -m "feat: User Stories + mapping table + prd.json (N stories, with source traceability)"
```

---

### Step 10: Run ralph.sh

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

## Validation Checklist (before Step 10)

- [ ] requirements.md confirmed by product owner
- [ ] All requirements.md sections appear in mapping table
- [ ] No `⚠️ UNMAPPED` rows
- [ ] Every prd.json story has `source` field
- [ ] Stories ordered: schema → backend → frontend
- [ ] No single story too large (2-3 sentence describable)
- [ ] Product owner has reviewed mapping table
- [ ] Git history shows commits for each layer

---

## Output File Structure

```
project/
├── docs/
│   ├── requirements.md              ← Layer 1 (human confirmed, READ-ONLY for AI)
│   └── requirements-mapping.md      ← Traceability table
├── specs/
│   ├── decisions/
│   │   └── 001-<project>-gears.md  ← Layer 2 (GEARS behavioral specs)
│   └── iterations/
│       ├── 001-auth.md             ← Layer 3 (User Stories)
│       ├── 002-dashboard.md
│       └── NNN-<area>.md
├── scripts/
│   └── ralph/
│       ├── ralph.sh                ← Ralph execution loop
│       ├── CLAUDE.md               ← Claude Code context for each iteration
│       └── prd.json                ← Layer 4 (executable, with source field)
├── CLAUDE.md                       ← Auto-generated by spex scaffold
└── AGENTS.md                       ← Auto-generated by spex scaffold
```

---

## Related Skills (also in this repo)

| Skill | Location | Purpose |
|-------|----------|---------|
| `/prd` | `skills/prd/SKILL.md` | Generate PRD from a feature description (use BEFORE this skill) |
| `/ralph` | `skills/ralph/SKILL.md` | Convert a PRD/Markdown to prd.json (used internally by Step 6) |
| `spec-driven-dev` | `skills/spec-driven-dev/SKILL.md` | This skill — full pipeline |

**Typical flow:**
```
Feature idea → /prd → docs/requirements.md → [human confirms] → spec-driven-dev → ralph.sh
```

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Missing `source` in prd.json | No traceability | Validate before commit (Step 6) |
| Story too large | Agent gets stuck mid-context | Max 2-3 sentences to describe; split otherwise |
| Wrong story order | Depends on non-existent code | Schema first, frontend last |
| Skipping mapping table review | Builds wrong features | Enforce spot-check gate (Step 8) |
| AI modifying requirements.md | Breaks source of truth | requirements.md = human-only |
| Running ralph.sh without confirmation | Wasted compute | Never skip Step 8 |
