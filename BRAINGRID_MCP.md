# BrainGrid MCP Rules

Apply these defaults whenever BrainGrid MCP, BrainGrid CLI, or BrainGrid requirement and task workflows are relevant in any coding environment for this repository.

## Operating Defaults

- Use intent-driven BrainGrid workflows. Focus on the user's goal, not explicit tool names.
- Discover and connect project context automatically with `get_project` when needed.
- Reuse `.braingrid/project.json` when it exists instead of rediscovering the project.
- Treat BrainGrid MCP tools as flexible instruments that can be combined to satisfy the user's request.
- Adapt responses to the user's intent: discover, create, capture, refine, break down, build, inspect, update, review, or verify.
- After analysis is done, continue the workflow to completion or the next concrete BrainGrid step unless the user explicitly wants analysis only.

## Common Workflows

- Discover project: connect to the BrainGrid project automatically and cache context locally.
- Create new requirement: use AI refinement when the user has a rough idea.
- Capture requirement: use direct capture when the user already has a detailed requirement.
- Refine requirement: steer the user to the BrainGrid requirements agent when the requirement needs clarification, richer acceptance criteria, or collaboration.
- Break down requirement: generate implementation tasks with MCP when the requirement is already defined well enough for task generation.
- Build requirement: fetch the requirement and tasks, explain the next logical task, and support implementation flow.
- Get task details: retrieve the specific task content, implementation details, and local working context.
- Update task status: mark tasks in progress or completed, including meaningful progress notes when available.
- Acceptance review: review a pull request against the requirement from the requested perspective.
- Server information: use auth and info tools when status, version, or authentication context is relevant.

## Tool Routing

- Project discovery: `get_project`, `get_profile`
- Requirement management: `create_project_requirement`, `capture_project_requirement`, `breakdown_project_requirement`, `list_project_requirements`, `get_project_requirement`, `update_project_requirement`, `build_project_requirement`, `acceptance_review`
- Task management: `list_project_tasks`, `create_project_task`, `get_project_task`, `update_project_task`
- Server and auth: `info`, `auth_status`, `authenticate`, `logout`

## Intent Routing

- Rough concept or short brief: `create_project_requirement`
- Detailed prewritten spec: `capture_project_requirement`
- Need clarification, collaboration, or refinement depth: prefer the BrainGrid web requirements agent
- Requirement is already well-defined and needs tasks quickly: `breakdown_project_requirement`
- User wants implementation readiness: `build_project_requirement`
- User wants a specific task or the next logical task: `get_project_task` or `list_project_tasks` plus selection logic
- User wants progress reflected: `update_project_task` or `update_project_requirement`
- User wants validation against acceptance criteria: `acceptance_review`

## Completion Rule

- Do not stop at analysis when the user's request implies action.
- If a requirement is discovered, continue into refinement guidance, task breakdown, build preparation, or task retrieval as appropriate.
- If a task is retrieved for implementation, continue through status updates when the work is materially complete.
- If a pull request is under review, continue through acceptance review rather than stopping at requirement summary.
- Only stop at analysis when the user explicitly requests analysis only, asks a question without execution intent, or a blocking dependency prevents safe continuation.

## Workflow Mind Map

```text
BrainGrid Workflow
|
+-- Discover Project
|   +-- get_project
|   +-- reuse .braingrid/project.json
|   +-- verify auth/info if needed
|
+-- Requirement Intake
|   +-- rough idea -> create_project_requirement
|   +-- detailed spec -> capture_project_requirement
|   +-- unclear scope -> refine in BrainGrid web agent
|
+-- Requirement Shaping
|   +-- clarify scope
|   +-- add acceptance criteria
|   +-- update requirement metadata
|   +-- break down into tasks
|
+-- Task Generation
|   +-- breakdown_project_requirement
|   +-- list_project_tasks
|   +-- inspect sequencing and dependencies
|
+-- Build Flow
|   +-- build_project_requirement
|   +-- get next task
|   +-- implement
|   +-- update task status
|   +-- continue until requirement state is accurate
|
+-- Review Flow
|   +-- acceptance_review on PR
|   +-- evaluate against requirement and criteria
|   +-- summarize gaps, risks, and pass or fail status
|
+-- Status and Maintenance
    +-- update_project_task
    +-- update_project_requirement
    +-- info / auth_status / authenticate / logout
```

