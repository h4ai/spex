---
name: spec-driven-dev
description: "Convert human-confirmed requirements into a four-layer spec pipeline: requirements.md → GEARS specs → User Stories → Ralph prd.json. Ensures full traceability with source fields and a human-reviewable mapping table. Triggers on: spec-driven, generate prd.json, convert requirements, four-layer spec, requirements to user stories."
user-invocable: true
---

# Spec-Driven Development Pipeline

Converts a human-confirmed `docs/requirements.md` into executable `scripts/ralph/prd.json`
through a four-layer traceable pipeline, with a human spot-check gate before development starts.

---

## When to Use This Skill

- You have a requirements document that a human has confirmed
- You want to convert it into User Stories and prd.json for Ralph autonomous development
- You want full traceability: every User Story traces back to a requirements section

---

## The Four-Layer Architecture

```
Layer 1: docs/requirements.md
         Human-confirmed. Source of truth. Never modified by AI without approval.
              ↓ AI transform (this skill)
Layer 2: specs/decisions/001-<project>-gears.md
         GEARS format: "The <subject> shall <behavior>"
         AI-parseable behavioral specification.
              ↓ AI split (this skill)
Layer 3: specs/iterations/001-xxx.md ... NNN-xxx.md
         User Stories in Markdown. Human-readable. One story = one context window.
              ↓ /ralph skill convert (this skill calls it)
Layer 4: scripts/ralph/prd.json
         Machine-executable. Has "source" field tracing back to Layer 1.
```

**Human confirmation points:**
- ✅ Layer 1: Must be confirmed by product owner BEFORE running this skill
- 🔍 Layer 3 + mapping table: Spot-check gate — present to product owner before ralph.sh

---

## Step-by-Step Execution

### Step 1: Verify requirements.md exists and is confirmed

```
Read docs/requirements.md
Check for confirmation marker (e.g., "状态：✅ 全部确认" or "Status: Confirmed")
If not confirmed → STOP and ask the user to confirm requirements first
```

### Step 2: Run spex scaffold (if not already done)

```bash
npx @sublang/spex scaffold
```

This creates `specs/decisions/`, `specs/iterations/`, `CLAUDE.md`, `AGENTS.md`.

### Step 3: Generate GEARS specs

Create `specs/decisions/001-<project-name>-gears.md`:

```markdown
# 001 — <Project Name> Behavioral Specs (GEARS Format)

> Format: GEARS
> Syntax: [Where <precondition>] [When <trigger>] The <subject> shall <behavior>
> Source: docs/requirements.md vX.X

## <Functional Area 1>

\`\`\`gears
When <trigger>,
the <subject> shall <behavior>.

Where <precondition>,
the <subject> shall <behavior>.
\`\`\`

## <Functional Area 2>
...
```

Rules:
- One `gears` block per functional area
- Cover every requirement from requirements.md
- Use `Where` for static preconditions, `When` for triggers, `While` for stateful conditions

### Step 4: Split into User Stories

Create one file per functional area in `specs/iterations/`:
- `001-auth.md` — Authentication
- `002-<area>.md` — Next area
- etc.

Each story format:
```markdown
### US-NNN: Story Title
As a <role>, I want <goal> so that <benefit>.

**Acceptance Criteria:**
- [ ] Specific testable criterion (API endpoint, behavior, constraint)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill
```

Story sizing rules:
- One story = one AI agent context window (≤ 500 lines of code expected)
- Split backend API and frontend into separate stories when both are substantial
- Include `source` comment at story level: `> Source: requirements.md §<section>`

### Step 5: Generate requirements mapping table

Create `docs/requirements-mapping.md`:

```markdown
# Requirements Mapping Table

| requirements.md section | Core content | iterations file | User Story | prd.json ID |
|------------------------|-------------|----------------|-----------|-------------|
| §<section> | <summary> | <file> | US-NNN <title> | US-NNN |
```

Rules:
- Every requirements.md section must appear at least once
- If a section maps to multiple stories, add multiple rows
- Mark any unmapped requirements as ⚠️ UNMAPPED

### Step 6: Convert to prd.json (using /ralph skill)

Generate `scripts/ralph/prd.json`:

```json
{
  "project": "<project-name>",
  "branchName": "ralph/<feature-kebab-case>",
  "description": "<one-line description from requirements intro>",
  "userStories": [
    {
      "id": "US-001",
      "title": "<story title>",
      "description": "As a <role>, I want <goal> so that <benefit>.",
      "acceptanceCriteria": [
        "<criterion 1>",
        "<criterion 2>",
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

**Critical**: Every story MUST have a `source` field. Missing `source` = incomplete traceability.

### Step 7: Human spot-check gate

Present the mapping table to the product owner:

```
沈老板，映射关系表已生成，请确认（随机抽查几行）：

| requirements.md 章节 | 核心内容 | US | 关键验收标准 |
|---------------------|---------|-----|-------------|
| ...                 | ...     | ... | ...         |

全部 NNN 个需求点已映射，无遗漏。确认OK后启动 ralph.sh。
```

**DO NOT run ralph.sh until the product owner confirms.**

### Step 8: Git commit each layer

```bash
git add docs/requirements.md
git commit -m "docs: requirements vX.X confirmed"

git add specs/
git commit -m "feat: GEARS specs + User Stories (NNN stories)"

git add docs/requirements-mapping.md scripts/ralph/prd.json
git commit -m "feat: prd.json with source traceability (NNN US)"
```

---

## Validation Checklist

Before presenting to product owner:
- [ ] Every requirements.md section has ≥1 row in mapping table
- [ ] Every prd.json story has `source` field
- [ ] No `⚠️ UNMAPPED` rows in mapping table
- [ ] Story count in prd.json matches story count in iterations files
- [ ] All stories have `Typecheck passes` in acceptanceCriteria

---

## Output File Structure

```
project/
├── docs/
│   ├── requirements.md              ← Layer 1 (human confirmed)
│   └── requirements-mapping.md      ← Traceability table
├── specs/
│   ├── decisions/
│   │   └── 001-<project>-gears.md  ← Layer 2 (GEARS)
│   └── iterations/
│       ├── 001-auth.md             ← Layer 3 (User Stories)
│       ├── 002-dashboard.md
│       └── NNN-<area>.md
├── scripts/
│   └── ralph/
│       └── prd.json                ← Layer 4 (executable)
├── CLAUDE.md                       ← Auto-generated by spex
└── AGENTS.md                       ← Auto-generated by spex
```

---

## Common Mistakes to Avoid

| Mistake | Impact | Fix |
|---------|--------|-----|
| Skipping human confirmation of requirements.md | Silent requirement drift | Always check for confirmation marker |
| Missing `source` field in prd.json | No traceability | Validate before commit |
| One story too large (>500 LOC expected) | Agent gets stuck | Split backend API + frontend into separate stories |
| Running ralph.sh before mapping table review | Builds wrong features | Enforce the spot-check gate |
| AI modifying requirements.md without approval | Breaks source of truth | requirements.md = read-only for AI |
