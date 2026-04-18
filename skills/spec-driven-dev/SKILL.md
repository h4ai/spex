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

---

## TDD Verification System — Synchronized with GEARS Execution

验证分五层，前三层可在 Agent 执行任务时**同步完成**，后两层异步。

### Verification Layers

| Layer | 手段 | 同步方式 | 耗时 |
|-------|------|---------|------|
| **L0** | 编译 / 类型检查 | 每次文件保存后自动 `tsc --noEmit` | 秒级 |
| **L1** | 单元测试 | TDD 红→绿→重构，每实现一个函数先写测试 | 秒~分钟 |
| **L2** | 集成测试 | API 端点写完立即跑 pytest / vitest 验证请求响应 | 分钟级 |
| **L3** | E2E 浏览器 *(半同步)* | Playwright，整个 Story 完成后跑一次 | 1-3 分钟 |
| **L3.5** | 截图对比 *(半同步)* | Playwright screenshot + 与基线比对 | 1 分钟 |
| **L4** | 可观测性 *(异步)* | 日志 / metrics，需真实流量，开发时无法模拟 | 运行时 |
| **L5** | 人工审查 *(异步)* | 架构决策、产品品味，AI 无法自判 | 人工 |

**L0-L2 完全同步**，L3 / L3.5 半同步（Story 级别），L4-L5 异步。  
Agent 交付时已通过前 3 层验证，人只需做 L5 最终审查。

---

### Agent Execution Loop per GEARS Story

Each story in `prd.json` must follow this exact TDD loop:

```plain
1. 读 GEARS 行为描述 + AC（specs/decisions/001-*.md）
2. 🔴 先写失败测试（单元 + 集成）
   → git commit "test: add failing test for <STORY-ID>"
3. 🟢 写最少代码让测试通过
   → git commit "feat: implement <STORY-ID>"
4. 🔵 重构（可选）
   → git commit "refactor: clean <STORY-ID>"
5. ✅ tsc --noEmit + 全量测试通过（L0 + L1 + L2）
6. 📸 如果有 UI → 跑 Playwright + 截图（L3）
   → git commit "test: e2e <STORY-ID>"
7. 标记 prd.json 中该 story 的 "passes": true
```

**每个 GEARS AC 对应一个可运行的测试**。`passes: true` = 测试全绿 + typecheck 通过，不是人工目测。

---

### Commit Convention (Auditable Trail)

For **金融 / 大型复杂项目** where every AI step must be traceable and auditable:

```
test:   add failing test for AUTH-001          ← L1/L2 Red
feat:   implement AUTH-001                     ← Green
refactor: clean AUTH-001                       ← Blue (optional)
test:   e2e AUTH-001                           ← L3 Playwright
```

Git history = complete, per-story audit trail with GEARS source traceability:

```
Layer 1 (requirements.md)
  └── Layer 2 (GEARS+AC in specs/decisions/)
        └── Layer 3 (prd.json story "source" field)
              └── Git commits (test→feat→e2e per story)
                    └── CI (L0 typecheck + L1/L2 tests always green)
```

This satisfies auditability requirements: every production line of code maps back to a confirmed requirement via `source` field.

---

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
