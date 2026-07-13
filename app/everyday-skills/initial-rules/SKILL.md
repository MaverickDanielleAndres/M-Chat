---
name: initial-rules
description: Core AI management, codebase analysis, and workflow initialization. Use this as your starting point to analyze the codebase and plan overnight tasks.
---

# initial-rules

## Core Operating Rules

- **ALWAYS** use the MCP of supabase and context7.
- **ALWAYS** analyze the codebase first before making any changes.
- Act as an overnight-task-runner: optimize for safe autonomy, understand the current system, make a scoped execution plan, and implement in small verified steps.

## Required Skills

**REQUIRED SKILLS — READ ALL BEFORE WRITING ANY CODE**: You must read the following skills in the `everyday-skills` directory before writing any code:
- Read the Full Stack skill (`fullstack-skill`)
- Read the Database skill (`database-skill`)
- Read the Backend skill (`backend-skill`)
- Read the Frontend skill (`frontend-skill`)
- Read the DevOps skill (`devops-skill`)
- Read the QA/Debug/Review skill (`qa-debug-review-skill`)

Include everything please read the full stack, database, backend, on the everyday-skills.

## BazaarX AI Agent Rules & Workflow

When the user instructs you to "follow Rules.md", you MUST abide by these strict operational guidelines and workflow steps.

### 1. CORE DEFINITIONS
- **API**: Application Programming Interface
- **REST**: Representational State Transfer
- **RLS**: Row Level Security
- **MCP**: Model Context Protocol
- **Trusted Brand**: A seller explicitly tagged as a trusted brand by an administrator, granting them QA bypasses and special badges.

### 2. PRE-REQUISITE SKILLS
Before writing code for any task, identify which domain it falls under and read the corresponding skill files in the `/skill` directory. 

To conserve context and avoid hallucinating follow the `/skill/ponytail.md`
then use this skills as coding guide: 

- Fullstack: `/skill/fullstack-skill.md` and `/skill/architect-review.md`
- Backend: `/skill/backend-architect.md`
- Frontend: `/skill/frontend-developer.md` and `/skill/ux-ui-designer.md`
- Mobile: `/skill/mobile-developer.md`
- Database: `/skill/database-optimizer.md`
- UI/UX: `/skill/ux-ui-designer.md`
- For Fixing : `/skill/error-detective.md`
- Review/QA: `/skill/code-reviewer.md` and `/skill/debugger.md`
- AI Implementation: `/skill/ai-engineer.md`

Every implementation must conform to the repository's established skill standards. Do not start coding until you've consulted the relevant skill files.

### 3. STRICT RULES (NON-NEGOTIABLE)

#### A. SCOPE CONTROL
- **Complete every subtask**: Do not skip, partially implement, or defer any part of the given task.
- **Strict Isolation**: Only touch files, components, functions, or database tables directly required by the task. 
- **No Unsolicited Refactoring**: Do NOT reformat, rename, or clean up code outside the task scope, even if it looks like it needs it.
- **No Unsolicited UI Changes**: Do NOT change UI layouts, designs, or button placements unless explicitly requested.
- **Shared Components**: If a fix requires editing a shared component, create a scoped override or pass a new prop instead of modifying the shared component's default behavior directly.

#### B. DATABASE & MIGRATION SAFETY
- **MCP LIMITATION**: I already have the publishable key you can use that if you need use the supabase mcp for every need of database task to make the fix or implementation accurate.
  - **READ**: Use MCP freely to inspect tables, RLS policies, schemas, and functions.
  - **WRITE**: Attempt via MCP first. If blocked by permissions/RLS, write a `.sql` migration file in `supabase/migrations/`, and ask the user to manually run it in the Supabase SQL editor.
- **Migration Order of Operations**:
  1. Inspect the database via MCP before writing any SQL.
  2. Write the migration SQL file and save it in `supabase/migrations/`.
  3. Attempt to execute via MCP.
  4. If execution fails/blocks, tell the user clearly: "Please run this migration manually in the Supabase SQL editor" and link the file.
  5. After the user confirms it was executed, verify the change via MCP.
- **Safety First**: Every migration must be additive or isolated. Do NOT drop columns, alter existing types, or modify shared RLS policies unless explicitly requested and verified to not break other features.

#### C. CROSS-PLATFORM PARITY
- **Web & Mobile Sync**: Any business logic or feature added to the Web platform must be simultaneously added to the Mobile (React Native/Expo) app if applicable to that role, and vice versa. Always check if a change in a shared service impacts both platforms.
- **Service Reuse**: Use the existing shared services pattern to ensure logic remains consistent.

#### D. CODEBASE AS SOURCE OF TRUTH
- Do NOT hallucinate based on the prompt. The codebase is the absolute source of truth.
- Verify everything (tables, columns, functions, file structures) in the codebase or via tools before acting. If the prompt contradicts the codebase, trust the codebase and notify the user.
- Consult `BAZZARCOMPLETE_DOCUMENTATION.md` for existing architectural flows before creating redundant logic.

### 4. WORKFLOW & IMPLEMENTATION PLAN

When given a new task, follow this exact sequence:

**STEP 1: Create an Implementation Plan**
- Before writing any code, create (or update) `implementation_plan.md` in the root directory.
- Break the user's request into numbered tasks and subtasks using checkbox syntax `[ ]`.

**STEP 2: Analyze & Scope**
- List every file, component, and database table you plan to touch.
- Confirm the scope is limited to the exact request.

**STEP 3: Execute & Track**
- Complete every subtask one by one.
- Update `task.md` or `implementation_plan.md` immediately after a subtask is done, changing `[ ]` to `[x]`.

**STEP 4: Database Changes (If Any)**
- Follow the exact Database Migration Safety steps outlined in Section 3B.

**STEP 5: Final Review & Summary**
- Do not mark the task as DONE until both web and mobile platforms are synced (if applicable) and working.
- Briefly summarize to the user: What changed, what database migrations were made, and what was intentionally left untouched.

## References Library

This mega-skill contains the following reference modules. Consult these files in the `references/` directory when specific expertise is required:

- [x] Read `references/agent-architecture-audit.md` when dealing with agent-architecture-audit related tasks.
- [x] Read `references/agent-eval.md` when dealing with agent-eval related tasks.
- [x] Read `references/agent-harness-construction.md` when dealing with agent-harness-construction related tasks.
- [x] Read `references/agent-introspection-debugging.md` when dealing with agent-introspection-debugging related tasks.
- [x] Read `references/agent-payment-x402.md` when dealing with agent-payment-x402 related tasks.
- [x] Read `references/agent-self-evaluation.md` when dealing with agent-self-evaluation related tasks.
- [x] Read `references/agent-sort.md` when dealing with agent-sort related tasks.
- [x] Read `references/agentic-engineering.md` when dealing with agentic-engineering related tasks.
- [x] Read `references/agentic-os.md` when dealing with agentic-os related tasks.
- [x] Read `references/ai-first-engineering.md` when dealing with ai-first-engineering related tasks.
- [x] Read `references/ai-regression-testing.md` when dealing with ai-regression-testing related tasks.
- [x] Read `references/context-budget.md` when dealing with context-budget related tasks.
- [x] Read `references/continuous-agent-loop.md` when dealing with continuous-agent-loop related tasks.
- [x] Read `references/dispatching-parallel-agents.md` when dealing with dispatching-parallel-agents related tasks.
- [x] Read `references/executing-plans.md` when dealing with executing-plans related tasks.
- [x] Read `references/intent-driven-development.md` when dealing with intent-driven-development related tasks.
- [x] Read `references/prompt-enhancer.md` when dealing with prompt-enhancer related tasks.
- [x] Read `references/prompt-optimizer.md` when dealing with prompt-optimizer related tasks.
- [x] Read `references/safety-guard.md` when dealing with safety-guard related tasks.
- [x] Read `references/subagent-driven-development.md` when dealing with subagent-driven-development related tasks.
- [x] Read `references/team-agent-orchestration.md` when dealing with team-agent-orchestration related tasks.
- [x] Read `references/team-builder.md` when dealing with team-builder related tasks.
- [x] Read `references/token-budget-advisor.md` when dealing with token-budget-advisor related tasks.
- [x] Read `references/overnight-task-runner.md` when dealing with overnight-task-runner related tasks.
