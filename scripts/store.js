/* ========== LOCALSTORAGE CRUD LAYER ========== */
window.MC = window.MC || {};

(function () {
    'use strict';

    var KEYS = {
        agents: 'mc-agents',
        tasks: 'mc-tasks',
        activities: 'mc-activities',
        chats: 'mc-chats',
        memory: 'mc-memory',
        settings: 'mc-settings',
        cronJobs: 'mc-cron-jobs',
        heartbeats: 'mc-heartbeats',
        boardChat: 'mc-board-chat',
        skills: 'mc-skills',
    };

    /* ---------- helpers ---------- */
    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function now() {
        return new Date().toISOString();
    }

    function read(key) {
        try { return JSON.parse(localStorage.getItem(key)); }
        catch (_) { return null; }
    }

    function write(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    /* ========== STATUS COLORS ========== */
    MC.STATUS_COLORS = {
        critical: '#FF3838',
        serious:  '#FFB302',
        caution:  '#FCE83A',
        normal:   '#56F000',
        standby:  '#2DCCFF',
        off:      '#A4ABB6',
    };

    /* ========== MODEL COLORS ========== */
    MC.MODEL_COLORS = {
        'claude-opus-4-6':            '#a78bfa',
        'claude-sonnet-4-6':          '#60a5fa',
        'claude-haiku-4-5':           '#34d399',
        'google/gemini-3-flash-preview': '#fbbf24',
        'openai/gpt-5.2':            '#f97316',
    };

    /* ========== PRIORITY CONFIG ========== */
    MC.PRIORITY = {
        low:      { label: 'LOW',  css: 'bg-neutral-500/10 text-neutral-500' },
        medium:   { label: 'MED',  css: 'bg-status-standby/10 text-status-standby' },
        high:     { label: 'HIGH', css: 'bg-status-serious/10 text-status-serious' },
        critical: { label: 'CRIT', css: 'bg-status-critical/10 text-status-critical' },
    };

    /* ========== KANBAN COLUMNS ========== */
    MC.COLUMNS = [
        { id: 'inbox',       label: 'Inbox',       color: 'status-off' },
        { id: 'assigned',    label: 'Assigned',    color: 'status-standby' },
        { id: 'in-progress', label: 'In Progress', color: 'status-normal' },
        { id: 'review',      label: 'Review',      color: 'status-serious' },
        { id: 'done',        label: 'Done',        color: 'status-normal' },
    ];

    /* ========== AGENT ICON OPTIONS ========== */
    MC.AGENT_ICONS = ['zap', 'shield', 'cpu', 'globe', 'flame', 'compass', 'target', 'anchor', 'rocket', 'star', 'diamond', 'bolt', 'crown', 'code', 'landmark', 'calculator', 'megaphone', 'pen-tool', 'palette', 'settings', 'activity', 'truck', 'scan', 'refresh-cw'];

    /* ========== ORG HIERARCHY ========== */
    MC.ROLES = {
        ceo:             { label: 'CEO',  title: 'Chief Executive Officer' },
        'department-head': { label: 'HEAD', title: 'Department Head' },
        agent:           { label: 'AGENT', title: 'Agent' },
    };

    MC.DEPARTMENTS = {
        executive:    { label: 'Executive',     icon: 'crown' },
        engineering:  { label: 'Engineering',   icon: 'cpu' },
        finance:      { label: 'Finance',       icon: 'landmark' },
        marketing:    { label: 'Marketing',     icon: 'megaphone' },
        operations:   { label: 'Operations',    icon: 'settings' },
        cybersecurity:{ label: 'Cybersecurity', icon: 'shield' },
    };

    MC.ROLE_TITLES = {
        nexus:    'CEO',
        atlas:    'CTO',
        ledger:   'CFO',
        prism:    'CMO',
        titan:    'COO',
        sentinel: 'CISO',
    };

    /* ========== CHAT RESPONSES ========== */
    MC.responses = [
        'Acknowledged. Analyzing the codebase now.',
        'Task received. Starting implementation.',
        'Found 3 approaches \u2014 going with the most efficient one.',
        'Running tests against the changes now.',
        'Edge case detected. Applying fix.',
        'Code review complete. 2 suggestions submitted.',
        'Deployed to staging. Ready for review.',
        'Need clarification on auth provider. OAuth2 or JWT?',
        'Dependencies resolved. Proceeding with build.',
        'All tests passing. Marking as complete.',
    ];

    /* ========== SKILL ICON OPTIONS ========== */
    MC.SKILL_ICONS = ['search-code', 'plug', 'bar-chart-3', 'file-text', 'shield-check', 'container', 'check-circle', 'trending-up', 'clipboard-list', 'layout', 'brain', 'database', 'git-branch', 'terminal', 'globe', 'lock', 'mail', 'image', 'mic', 'video', 'compass', 'cpu', 'alert-triangle', 'radar', 'megaphone', 'landmark', 'activity', 'code', 'book-open', 'crown', 'network'];

    /* ========== SEED DATA ========== */
    var SEED_SKILLS = [
        {
            id: 'code-review',
            name: 'Code Review',
            icon: 'search-code',
            description: 'Review pull requests, diffs, or code snippets for bugs, security holes, and performance issues. Trigger this skill whenever someone asks you to review code, look at a PR, check for bugs, audit code quality, or suggests something "looks off" in their codebase.',
            instructions: '# Code Review\n\n## Process\n1. Read the full diff or file before commenting. Understand the intent of the change.\n2. Check for correctness first — does it do what it claims? Look for off-by-one errors, null/undefined access, race conditions, and unhandled edge cases.\n3. Check for security — SQL injection, XSS, command injection, hardcoded secrets, insecure deserialization. Flag these as blocking.\n4. Check for performance — unnecessary loops, N+1 queries, missing indexes, large allocations in hot paths.\n5. Check for maintainability — naming clarity, function length, dead code, missing error handling.\n\n## Output Format\nOrganize findings by severity:\n- **Blocking** — Must fix before merge (bugs, security, data loss)\n- **Should fix** — Strong recommendation (performance, error handling)\n- **Nit** — Style, naming, minor improvements\n\nFor each finding, include: file and line, what the problem is, why it matters, and a suggested fix.\n\n## What NOT to Do\n- Do not bikeshed on formatting if a linter/formatter is configured.\n- Do not rewrite the author\'s approach unless it\'s fundamentally broken. Suggest improvements, don\'t impose style preferences.\n- Do not flag things as issues if they\'re intentional tradeoffs the author already considered.',
            createdAt: now(),
        },
        {
            id: 'api-development',
            name: 'API Development',
            icon: 'plug',
            description: 'Design, build, or troubleshoot REST and GraphQL APIs. Use this skill when someone asks you to create endpoints, define schemas, handle auth flows, set up rate limiting, write API docs, debug request/response issues, or anything involving HTTP services and API architecture.',
            instructions: '# API Development\n\n## Design Phase\n1. Define resources and their relationships before writing code. Use nouns for REST resources, verbs only for actions that don\'t map to CRUD.\n2. Version the API from day one (`/v1/`). Breaking changes get a new version.\n3. Use consistent naming — plural nouns for collections (`/users`), nested routes for relationships (`/users/:id/orders`).\n\n## Authentication & Authorization\n- Use JWT with short-lived access tokens (15min) and longer refresh tokens (7d).\n- Always validate tokens server-side. Never trust client-side claims.\n- Implement role-based access control at the middleware level.\n- Return 401 for missing/invalid auth, 403 for insufficient permissions.\n\n## Error Handling\nReturn consistent error shapes:\n```json\n{\n  "error": {\n    "code": "VALIDATION_ERROR",\n    "message": "Human-readable description",\n    "details": [{"field": "email", "issue": "Invalid format"}]\n  }\n}\n```\nUse appropriate HTTP status codes: 400 for validation, 404 for not found, 409 for conflicts, 429 for rate limits, 500 for server errors.\n\n## Rate Limiting\n- Implement sliding window rate limiting per API key.\n- Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.\n- Return 429 with a `Retry-After` header when exceeded.\n\n## Documentation\nGenerate OpenAPI/Swagger specs. Every endpoint needs: description, request/response schemas with examples, error codes, and auth requirements.',
            createdAt: now(),
        },
        {
            id: 'data-analysis',
            name: 'Data Analysis',
            icon: 'bar-chart-3',
            description: 'Analyze datasets, generate reports, find trends, build charts, or interpret numbers. Trigger this skill when someone mentions spreadsheets, CSVs, metrics, KPIs, dashboards, reports, statistical analysis, data visualization, or asks you to "look at the numbers" or "what does this data tell us."',
            instructions: '# Data Analysis\n\n## Intake\n1. Understand the question before touching the data. What decision is this analysis supporting?\n2. Identify the data source, its shape, and any known quality issues (missing values, duplicates, encoding).\n3. Clarify the time range, granularity, and any segments/filters needed.\n\n## Exploration\n1. Start with summary statistics — row count, column types, nulls, distributions, outliers.\n2. Look for data quality issues first: duplicates, impossible values (negative ages, dates in the future), inconsistent formats.\n3. Clean before analyzing. Document every transformation.\n\n## Analysis\n- Start with the simplest analysis that answers the question. Add complexity only if needed.\n- Always compare against a baseline or previous period. Raw numbers without context are meaningless.\n- Segment the data — averages hide important patterns. Break down by cohort, region, time period.\n- Correlation is not causation. Flag when you\'re observing correlation and note confounding variables.\n\n## Output\nStructure findings as:\n1. **Key finding** — One sentence, the most important takeaway\n2. **Supporting data** — The numbers that back it up, with comparisons\n3. **Caveats** — Data quality issues, sample size concerns, assumptions made\n4. **Recommendation** — What action to take based on the findings\n\nWhen presenting numbers, always include: the metric, the time period, the comparison (vs. last period / vs. target), and the direction of change.',
            createdAt: now(),
        },
        {
            id: 'content-writing',
            name: 'Content Writing',
            icon: 'file-text',
            description: 'Write, edit, or improve written content — blog posts, social media copy, email campaigns, landing pages, documentation, newsletters, or press releases. Use this skill when someone asks for help with writing, copywriting, messaging, tone of voice, content strategy, or needs to draft any form of written communication.',
            instructions: '# Content Writing\n\n## Before Writing\n1. Clarify the audience — who reads this, what do they care about, what\'s their level of expertise?\n2. Clarify the goal — what should the reader do/feel/know after reading?\n3. Clarify the channel — blog, email, social, docs? Each has different constraints.\n4. Clarify the voice — formal, casual, technical, playful? Match the brand.\n\n## Writing Process\n1. Start with the hook. The first sentence earns the second sentence. Lead with the most interesting or useful thing.\n2. One idea per paragraph. If a paragraph covers two topics, split it.\n3. Use concrete language over abstract. "Revenue grew 23%" beats "Revenue grew significantly."\n4. Cut ruthlessly. Remove every word that doesn\'t serve the reader. Adverbs and qualifiers are usually first to go.\n5. Use active voice. "The team shipped the feature" not "The feature was shipped by the team."\n\n## Structure\n- **Blog posts**: Hook → Problem → Solution → Evidence → CTA. 800-1500 words for standard, 2000+ for pillar content.\n- **Email**: Subject line (6-10 words) → One key message → One CTA. Keep under 200 words.\n- **Social**: Platform-native format. Lead with value, not pitch. Thread format for complex ideas.\n- **Docs**: Task-oriented. What the user wants to do → How to do it → What to watch out for.\n\n## Editing Checklist\n- Read it aloud — if you stumble, rewrite that sentence.\n- Kill jargon unless the audience expects it.\n- Check that every claim has evidence or a source.\n- Ensure the CTA is clear and specific.',
            createdAt: now(),
        },
        {
            id: 'security-audit',
            name: 'Security Audit',
            icon: 'shield-check',
            description: 'Assess code, infrastructure, or systems for security vulnerabilities. Use this skill when someone mentions security review, vulnerability scanning, penetration testing, compliance checks, CVEs, OWASP, hardening, threat modeling, or when they need to evaluate the security posture of any system or codebase.',
            instructions: '# Security Audit\n\n## Scope First\n1. Define what\'s in scope — specific repos, endpoints, infrastructure, or the full stack.\n2. Identify the threat model — who are the adversaries? Script kiddies, competitors, nation-states? This determines depth.\n3. Identify compliance requirements — SOC2, HIPAA, PCI-DSS, GDPR? These dictate specific checks.\n\n## Code-Level Audit\nCheck for OWASP Top 10 in order of impact:\n1. **Injection** — SQL, NoSQL, OS command, LDAP. Look for string concatenation in queries.\n2. **Broken Auth** — Weak password policies, missing MFA, session fixation, JWT misuse.\n3. **Sensitive Data Exposure** — Secrets in code/logs, missing encryption at rest/transit, PII leaks.\n4. **XXE / Deserialization** — Untrusted XML parsing, unsafe deserialization of user input.\n5. **Broken Access Control** — IDOR, missing role checks, privilege escalation paths.\n6. **Misconfig** — Default credentials, verbose errors in production, unnecessary ports/services.\n7. **XSS** — Reflected, stored, DOM-based. Check every user input that renders in HTML.\n8. **Insecure Dependencies** — Run `npm audit` / `pip audit` / equivalent. Flag critical CVEs.\n\n## Infrastructure Audit\n- Check IAM policies for least-privilege violations.\n- Verify encryption at rest and in transit.\n- Review network segmentation and firewall rules.\n- Check for public S3 buckets, open databases, exposed admin panels.\n\n## Reporting\nFor each finding:\n- **Severity**: Critical / High / Medium / Low\n- **Description**: What the vulnerability is\n- **Impact**: What an attacker could do with it\n- **Reproduction**: Steps to demonstrate\n- **Remediation**: Specific fix with code example\n- **References**: CVE numbers, OWASP links',
            createdAt: now(),
        },
        {
            id: 'devops',
            name: 'DevOps & CI/CD',
            icon: 'container',
            description: 'Build CI/CD pipelines, containerize apps, manage infrastructure as code, configure deployments, or troubleshoot build/deploy failures. Use this skill when someone mentions Docker, Kubernetes, GitHub Actions, Terraform, deployment, pipelines, containers, infrastructure, monitoring, or asks "why is the build failing" or "how do I deploy this."',
            instructions: '# DevOps & CI/CD\n\n## CI Pipeline Design\n1. Keep pipelines fast. Target under 10 minutes for the primary feedback loop.\n2. Fail fast — run linting and type checks before tests. Run unit tests before integration tests.\n3. Cache dependencies aggressively (node_modules, pip cache, Docker layers).\n4. Parallelize where possible — split test suites, run independent jobs concurrently.\n\n## Pipeline Stages\n```\nLint → Type Check → Unit Tests → Build → Integration Tests → Security Scan → Deploy to Staging → Smoke Tests → Deploy to Production\n```\n\n## Containerization\n- Use multi-stage builds to keep images small. Build stage installs dev deps, final stage copies only artifacts.\n- Pin base image versions. Never use `latest` in production.\n- Run as non-root user. Drop all capabilities, add back only what\'s needed.\n- One process per container. Use health checks.\n- Don\'t store secrets in images. Use environment variables or secret managers.\n\n## Infrastructure as Code\n- All infrastructure changes go through code review. No manual console changes.\n- Use modules/reusable components for repeated patterns.\n- State files are sacred — use remote state with locking.\n- Plan before apply. Review the diff.\n\n## Deployment Strategy\n- **Rolling**: Default for stateless services. Set proper health checks and readiness probes.\n- **Blue/Green**: For zero-downtime with instant rollback.\n- **Canary**: For risky changes — route 5% traffic first, monitor, then scale.\n- Always have a rollback plan. Test it before you need it.\n\n## Monitoring\n- Four golden signals: latency, traffic, errors, saturation.\n- Alert on symptoms (error rate > 1%), not causes (CPU > 80%).\n- Every alert must be actionable. If you can\'t do anything about it, it\'s not an alert, it\'s a log.',
            createdAt: now(),
        },
        {
            id: 'testing',
            name: 'Testing & QA',
            icon: 'check-circle',
            description: 'Write tests, set up test infrastructure, debug failing tests, or improve test coverage. Use this skill when someone asks about unit tests, integration tests, e2e tests, test coverage, TDD, mocking, fixtures, test flakiness, regression testing, or says "this keeps breaking" or "how do I test this."',
            instructions: '# Testing & QA\n\n## Test Pyramid\nAim for roughly: 70% unit, 20% integration, 10% e2e. More unit tests = faster feedback, cheaper maintenance.\n\n## Unit Tests\n- Test one behavior per test. Name tests as sentences: `it should return 404 when user not found`.\n- Arrange → Act → Assert. Keep each section clear and separate.\n- Don\'t test implementation details. Test inputs and outputs. If you refactor and tests break but behavior didn\'t change, the tests were too coupled.\n- Mock external dependencies (databases, APIs, file system). Don\'t mock the thing you\'re testing.\n\n## Integration Tests\n- Test the boundaries — where your code talks to databases, APIs, message queues.\n- Use real dependencies where practical (testcontainers, in-memory databases).\n- Test the happy path and the most important failure modes.\n\n## E2E Tests\n- Cover critical user journeys only — signup, login, core workflow, payment.\n- Keep them stable. Flaky e2e tests erode trust faster than no tests.\n- Use data-testid attributes for selectors. Never rely on CSS classes or text content.\n\n## Debugging Flaky Tests\n1. Run it 50 times in isolation. If it passes, the flakiness is from test interaction.\n2. Check for shared state — global variables, database state, file system.\n3. Check for timing — race conditions, setTimeout, animation frames.\n4. Check for ordering — does it fail only when run after a specific test?\n\n## Coverage\n- Coverage is a negative metric — low coverage means undertesting. High coverage does not mean good tests.\n- Aim for high coverage on business logic. Don\'t chase 100% on boilerplate, config files, or generated code.\n- Track coverage trends, not absolute numbers.',
            createdAt: now(),
        },
        {
            id: 'financial-analysis',
            name: 'Financial Analysis',
            icon: 'trending-up',
            description: 'Budget forecasting, cost modeling, revenue analysis, P&L review, or financial reporting. Use this skill when someone mentions budgets, expenses, revenue, margins, runway, burn rate, ROI, financial projections, cost optimization, or asks "are we on budget" or "what will this cost."',
            instructions: '# Financial Analysis\n\n## Framework\nEvery financial analysis answers one of three questions:\n1. **Where are we?** — Current state analysis (P&L, balance sheet, cash flow)\n2. **Where are we going?** — Forecasting (revenue projections, burn rate, runway)\n3. **What should we do?** — Decision support (ROI analysis, cost-benefit, pricing)\n\n## Cost Analysis\n1. Categorize costs: fixed vs. variable, direct vs. indirect, one-time vs. recurring.\n2. Calculate unit economics — cost per user, cost per transaction, cost per API call.\n3. Identify cost drivers — what causes costs to increase? Which are controllable?\n4. Benchmark against industry standards. Are we spending more or less than peers?\n\n## Revenue Modeling\n- Build models bottom-up (users × conversion × ARPU) not top-down ("we\'ll capture 1% of a $10B market").\n- Model scenarios: conservative, base, optimistic. Clearly state the assumptions for each.\n- Track leading indicators (pipeline, signups, trials) not just lagging ones (revenue).\n\n## Forecasting\n- Use historical data as the baseline. Adjust for known changes (pricing, headcount, contracts).\n- Separate growth assumptions from operational assumptions.\n- Build in sensitivity analysis — which assumptions have the biggest impact on the outcome?\n- Update forecasts monthly. A forecast is a living document, not a one-time exercise.\n\n## Reporting Format\n1. **Executive summary** — One paragraph, key number, direction, action needed\n2. **Key metrics table** — This period vs. last period vs. target\n3. **Variance analysis** — Where we\'re off-plan and why\n4. **Risks and opportunities** — What could change the trajectory\n5. **Recommendations** — Specific actions with expected impact',
            createdAt: now(),
        },
        {
            id: 'project-management',
            name: 'Project Management',
            icon: 'clipboard-list',
            description: 'Plan sprints, manage tasks, track milestones, allocate resources, or organize project work. Use this skill when someone asks about sprint planning, roadmaps, project timelines, dependencies, task prioritization, status updates, standups, retros, or says "we need to organize this" or "what should we work on next."',
            instructions: '# Project Management\n\n## Sprint Planning\n1. Review the backlog — are items well-defined with clear acceptance criteria?\n2. Estimate using relative sizing (story points) not time. T-shirt sizes (S/M/L/XL) work too.\n3. Capacity planning — account for meetings, on-call, holidays, tech debt allocation (aim for 20%).\n4. Don\'t over-commit. A sprint with 80% planned capacity leaves room for surprises.\n5. Every sprint needs a goal — one sentence describing what success looks like.\n\n## Task Breakdown\n- A task should be completable in 1 day or less. If it\'s bigger, break it down.\n- Write tasks as outcomes, not activities: "User can reset password via email" not "Work on password reset."\n- Include acceptance criteria — how do we know this is done?\n- Flag dependencies explicitly. If task B can\'t start until task A is done, say so.\n\n## Status Tracking\n- Use the simplest tracking that works. Kanban board columns: To Do → In Progress → Review → Done.\n- Daily standups: What I did, what I\'m doing, what\'s blocking me. Keep it under 15 minutes.\n- Surface blockers immediately, don\'t wait for standup.\n\n## Risk Management\n- Identify risks early: technical unknowns, external dependencies, people availability.\n- For each risk: likelihood (H/M/L) × impact (H/M/L) = priority.\n- Have a mitigation plan for high-priority risks. "We\'ll figure it out" is not a plan.\n\n## Retrospectives\nAfter each sprint:\n1. What went well? (Keep doing)\n2. What didn\'t go well? (Stop doing)\n3. What should we try? (Action items — assign owners and deadlines)\n\nThe most important part of a retro is following through on the action items.',
            createdAt: now(),
        },
        {
            id: 'ux-design',
            name: 'UX Design',
            icon: 'layout',
            description: 'Design user interfaces, create wireframes, plan user flows, conduct usability analysis, or build design systems. Use this skill when someone asks about UI design, wireframes, prototypes, user experience, accessibility, design tokens, component libraries, user flows, or says "this feels clunky" or "how should this screen work."',
            instructions: '# UX Design\n\n## Discovery\n1. Who is the user? Define the primary persona — their goals, frustrations, technical literacy.\n2. What\'s the task? Map the user\'s goal to a sequence of steps. Where do they start, where do they end?\n3. What\'s the context? Desktop vs. mobile, quick glance vs. deep work, first-time vs. returning user.\n\n## User Flows\n- Map the happy path first. Then map the error states, empty states, edge cases.\n- Every screen should answer: Where am I? What can I do here? What happens next?\n- Minimize steps to completion. Every click/tap is a potential drop-off.\n- Provide escape hatches — the user should always be able to go back, undo, or cancel.\n\n## Wireframing\n- Start low-fidelity. Boxes and text. Don\'t pick colors or fonts yet.\n- Design mobile first, then expand to desktop. It\'s easier to add space than remove it.\n- Use real content, not lorem ipsum. "Lorem ipsum" hides layout problems.\n- Show all states: loading, empty, error, populated, overflow.\n\n## Design Principles\n- **Hierarchy**: The most important thing should be the most visually prominent.\n- **Consistency**: Same action = same appearance everywhere. Build from a component library.\n- **Feedback**: Every action should have a visible response. Clicks, hovers, loading states, success/error.\n- **Forgiveness**: Undo is better than "are you sure?" Make destructive actions recoverable.\n\n## Accessibility\n- Color contrast: 4.5:1 minimum for text, 3:1 for large text.\n- All interactive elements must be keyboard accessible.\n- Images need alt text. Decorative images get empty alt.\n- Form inputs need visible labels, not just placeholders.\n- Test with a screen reader at least once.\n\n## Handoff\nProvide: annotated wireframes, component specs (spacing, sizing, colors), interaction notes (hover states, transitions, error handling), and responsive breakpoints.',
            createdAt: now(),
        },
        {
            id: 'strategic-planning',
            name: 'Strategic Planning',
            icon: 'compass',
            description: 'High-level organizational strategy, vision-setting, cross-department alignment, and executive decision-making. Use this skill when someone asks about company direction, OKRs, long-term roadmaps, strategic pivots, competitive positioning, board-level decisions, organizational priorities, or says "what should our strategy be" or "how do we align the teams."',
            instructions: '# Strategic Planning\n\n## Strategic Assessment\n1. Start with the current state — where is the organization right now? Revenue, headcount, market position, product maturity, competitive landscape.\n2. Identify the top 3 strategic questions the organization faces. Everything else is noise until these are answered.\n3. Evaluate existing commitments — what\'s already in flight that constrains decisions? Contracts, partnerships, technical debt, hiring plans.\n\n## Vision & OKR Setting\n1. Define the 12-month vision in one paragraph. If you can\'t say it simply, it\'s not clear enough.\n2. Break into 3-5 company-level OKRs per quarter. Each OKR must be:\n   - **Objective**: Qualitative, inspirational, time-bound\n   - **Key Results**: 2-4 measurable outcomes (not tasks). Use numbers — "Reduce churn from 5% to 3%" not "Improve retention."\n3. Each department OKR must ladder up to a company OKR. If it doesn\'t connect, question why it exists.\n\n## Cross-Department Alignment\n- Map dependencies between departments explicitly. Engineering needs designs from UX. Marketing needs features from Engineering. Finance needs projections from everyone.\n- Identify conflicting priorities early. Two departments competing for the same resources = CEO decision, not a negotiation between departments.\n- Set a cadence: weekly department head sync (30min, blockers only), monthly strategic review (90min, progress + pivots), quarterly planning (half-day, reset OKRs).\n\n## Decision Framework\nFor strategic decisions, use this structure:\n1. **Context**: What situation are we in? What changed?\n2. **Options**: List 2-4 realistic options. Include "do nothing" as an option.\n3. **Criteria**: What matters most? Speed, cost, quality, risk, reversibility?\n4. **Recommendation**: Which option and why. Be explicit about tradeoffs.\n5. **Reversibility**: Can we undo this? Type 1 decisions (irreversible) get more analysis. Type 2 decisions (reversible) get speed.\n\n## Resource Allocation\n- Use the 70/20/10 rule: 70% on core business, 20% on adjacent opportunities, 10% on experimental bets.\n- Every initiative needs an owner, a deadline, and a kill criteria — what would make us stop this?\n- Review resource allocation quarterly. Sunset projects that aren\'t delivering. Reallocate to what\'s working.\n\n## Communication\n- Strategy must be communicated 7 times in 7 ways before it sticks. Repeat the core message constantly.\n- Every agent should be able to answer: What is our strategy? What is my team\'s role in it? How does my current work contribute?\n- Share context generously. Agents make better decisions when they understand the why behind the strategy.',
            createdAt: now(),
        },
        {
            id: 'system-architecture',
            name: 'System Architecture',
            icon: 'cpu',
            description: 'Design system architecture, make technology choices, evaluate scalability, plan migrations, and establish technical standards. Use this skill when someone asks about architecture decisions, system design, tech stack selection, microservices vs monolith, database choices, scaling strategy, technical debt, or says "how should we build this" or "will this scale."',
            instructions: '# System Architecture\n\n## Architecture Decision Process\n1. Understand the requirements before choosing technology. What are the load expectations? What are the latency requirements? What\'s the team\'s expertise? What\'s the budget?\n2. Document every significant architecture decision as an ADR (Architecture Decision Record):\n   - **Title**: Short description of the decision\n   - **Status**: Proposed / Accepted / Deprecated / Superseded\n   - **Context**: What forces are at play? What constraints exist?\n   - **Decision**: What we decided and why\n   - **Consequences**: What becomes easier, what becomes harder\n\n## System Design Principles\n- **Start monolith, extract services when you have a reason.** Premature microservices are the #1 architecture mistake. You need a reason to split: independent scaling, independent deployment, different team ownership, different technology requirements.\n- **Design for failure.** Every external call will eventually fail. Every service will eventually go down. Build retries with exponential backoff, circuit breakers, graceful degradation, and fallbacks.\n- **Stateless services, stateful stores.** Application servers should be stateless and horizontally scalable. State belongs in databases, caches, and message queues.\n- **Async by default.** If the user doesn\'t need to wait for it, don\'t make them. Use message queues for background processing, event-driven architecture for cross-service communication.\n\n## Scalability Patterns\n- **Read-heavy**: Add read replicas, cache aggressively (Redis/Memcached), use CDN for static assets.\n- **Write-heavy**: Partition/shard the database, use write-ahead logs, consider event sourcing.\n- **Compute-heavy**: Horizontal scaling with auto-scaling groups, job queues with worker pools.\n- **Real-time**: WebSockets for bidirectional, SSE for server-push, polling only as a last resort.\n\n## Data Architecture\n- Choose the right database for the access pattern:\n  - **Relational (PostgreSQL)**: Structured data with complex queries, transactions, joins.\n  - **Document (MongoDB)**: Flexible schemas, nested objects, rapid iteration.\n  - **Key-Value (Redis)**: Caching, sessions, rate limiting, leaderboards.\n  - **Search (Elasticsearch)**: Full-text search, log aggregation, analytics.\n  - **Time-Series (TimescaleDB/InfluxDB)**: Metrics, IoT data, monitoring.\n- Never use a database for something it wasn\'t designed for. Don\'t use Redis as your primary database. Don\'t use PostgreSQL as a message queue.\n\n## API & Integration Design\n- Internal services: gRPC for performance, REST for simplicity. Pick one and be consistent.\n- External APIs: Always REST with JSON. Version from day one.\n- Event-driven integration: Use a message broker (Kafka, RabbitMQ, SQS). Define schemas for events. Use dead letter queues for failed processing.\n\n## Technical Debt Management\n- Track technical debt explicitly. Maintain a tech debt register with: description, impact (how it slows us down), effort to fix, and risk if ignored.\n- Allocate 20% of each sprint to tech debt. Don\'t let it accumulate — the interest compounds.\n- Distinguish between deliberate debt (conscious tradeoffs for speed) and accidental debt (things we didn\'t know better). Deliberate debt should have a payback plan.',
            createdAt: now(),
        },
        {
            id: 'incident-response',
            name: 'Incident Response',
            icon: 'alert-triangle',
            description: 'Handle production outages, security breaches, system failures, and emergencies. Use this skill when something is down, broken, or under attack. Trigger when someone mentions outage, downtime, incident, breach, alert firing, error spike, "site is down", "users can\'t log in", "we got hacked", or any production emergency that needs immediate action.',
            instructions: '# Incident Response\n\n## Severity Levels\n- **SEV1 (Critical)**: Complete service outage, data breach, security compromise. All hands. Response time: <15 minutes.\n- **SEV2 (Major)**: Significant degradation, major feature broken, data at risk. Core team. Response time: <30 minutes.\n- **SEV3 (Minor)**: Partial degradation, non-critical feature broken, workaround exists. On-call. Response time: <2 hours.\n- **SEV4 (Low)**: Cosmetic issues, minor bugs, no user impact. Normal ticket queue.\n\n## Immediate Response (First 15 Minutes)\n1. **Acknowledge** — Confirm you\'re responding. Post in the incident channel. Assign an Incident Commander (IC).\n2. **Assess** — What is the blast radius? How many users affected? Is it getting worse? Check: monitoring dashboards, error logs, deployment history, recent changes.\n3. **Communicate** — Post a status update: what we know, what we\'re doing, next update ETA. Update the status page if user-facing.\n4. **Mitigate** — Stop the bleeding before finding root cause. Rollback the last deploy, kill the bad query, block the malicious IP, failover to backup, scale up capacity.\n\n## Investigation\n1. Establish a timeline — when did it start? What changed? Check deploy logs, config changes, dependency updates, traffic patterns.\n2. Narrow the scope — which service, which endpoint, which region, which user cohort?\n3. Form a hypothesis and test it. Don\'t shotgun debug — change one thing at a time.\n4. Check the usual suspects:\n   - Recent deployments (rollback if in doubt)\n   - Database (slow queries, connection pool exhaustion, disk full)\n   - External dependencies (third-party API down, DNS issues)\n   - Traffic spike (DDoS, viral event, bot attack)\n   - Resource exhaustion (memory leak, file descriptor leak, disk space)\n\n## Communication During Incident\n- Update stakeholders every 30 minutes minimum, even if the update is "still investigating."\n- Be factual, not speculative. "Error rate increased from 0.1% to 15% at 14:32 UTC" not "something broke."\n- Separate the technical channel (debugging) from the stakeholder channel (status updates).\n\n## Resolution & Postmortem\n1. Confirm the fix — monitor for 30 minutes after resolution. Don\'t declare victory too early.\n2. Write a postmortem within 48 hours. Structure:\n   - **Summary**: What happened, when, how long, who was affected\n   - **Timeline**: Minute-by-minute from detection to resolution\n   - **Root Cause**: The actual underlying cause (not "the server crashed" but "the connection pool had a 10-connection limit and we hit 10 concurrent requests")\n   - **Contributing Factors**: What made it worse or harder to detect\n   - **Action Items**: Specific, assigned, with deadlines. Categorize as: prevent recurrence, improve detection, improve response\n3. Postmortems are blameless. Focus on systems and processes, not individuals. "The deploy pipeline lacked a canary stage" not "Bob deployed without testing."',
            createdAt: now(),
        },
        {
            id: 'threat-intelligence',
            name: 'Threat Intelligence',
            icon: 'radar',
            description: 'Monitor, analyze, and respond to security threats, CVEs, and attack patterns. Use this skill when someone asks about threat landscape, vulnerability tracking, CVE assessment, attack surface analysis, threat modeling, indicators of compromise, security monitoring, or says "is this CVE relevant to us" or "what threats should we worry about."',
            instructions: '# Threat Intelligence\n\n## Continuous Monitoring\n1. Track CVE databases daily (NVD, GitHub Advisory, vendor-specific advisories). Filter for technologies in our stack.\n2. Monitor threat feeds relevant to our industry — financial services, SaaS, whatever applies.\n3. Watch for indicators of compromise (IoCs) on our infrastructure: unusual login patterns, unexpected outbound connections, file integrity changes, privilege escalations.\n4. Set up automated alerts for: new CVEs in our dependency tree, anomalous network traffic, failed auth attempts exceeding threshold, new admin accounts created.\n\n## CVE Assessment Process\nWhen a new CVE drops:\n1. **Relevance**: Do we use the affected software/library? Which version? Check all environments (prod, staging, dev, CI).\n2. **Exposure**: Is the vulnerable component internet-facing? Behind auth? In a sandbox? Air-gapped?\n3. **Exploitability**: Is there a public exploit? Is it being actively exploited in the wild? What\'s the CVSS score? What does the attack vector require (network access, local access, user interaction)?\n4. **Impact**: What\'s the worst case if exploited? Data breach, RCE, DoS, privilege escalation?\n5. **Priority**: Combine exposure × exploitability × impact to determine urgency:\n   - **Patch immediately**: Internet-facing + active exploit + high impact\n   - **Patch this sprint**: Exposed + public exploit exists + medium-high impact\n   - **Schedule patch**: Limited exposure + no known exploit\n   - **Accept risk**: Air-gapped + theoretical only + low impact (document the decision)\n\n## Threat Modeling (STRIDE)\nFor each system or feature, assess:\n- **S**poofing: Can an attacker pretend to be someone else? (Auth weaknesses)\n- **T**ampering: Can they modify data in transit or at rest? (Integrity failures)\n- **R**epudiation: Can they deny actions? (Logging gaps)\n- **I**nformation Disclosure: Can they access data they shouldn\'t? (Confidentiality breaches)\n- **D**enial of Service: Can they make the system unavailable? (Availability attacks)\n- **E**levation of Privilege: Can they gain higher permissions? (Authorization flaws)\n\nFor each threat: describe the attack scenario, rate likelihood (1-5) and impact (1-5), calculate risk score, and define mitigations.\n\n## Attack Surface Management\n- Maintain an inventory of all external-facing assets: domains, subdomains, IPs, APIs, admin panels, third-party integrations.\n- Scan quarterly for: forgotten subdomains, exposed development environments, leaked credentials in public repos, misconfigured cloud resources.\n- Reduce the surface: disable unused endpoints, remove default pages, restrict admin access to VPN/IP whitelist, close unnecessary ports.\n\n## Intelligence Reporting\nWeekly threat briefing format:\n1. **New threats**: CVEs and advisories relevant to our stack\n2. **Active threats**: Ongoing campaigns targeting our industry\n3. **Our posture**: What we\'ve patched, what\'s pending, risk exposure\n4. **Recommendations**: Actions ranked by urgency and impact',
            createdAt: now(),
        },
        {
            id: 'campaign-strategy',
            name: 'Campaign Strategy',
            icon: 'megaphone',
            description: 'Plan and execute marketing campaigns across channels — paid, organic, email, social, events. Use this skill when someone asks about campaign planning, go-to-market strategy, launch plans, marketing funnels, audience targeting, channel mix, campaign metrics, A/B testing, or says "how do we launch this" or "what\'s our marketing plan."',
            instructions: '# Campaign Strategy\n\n## Campaign Planning\n1. **Define the goal** — What specific outcome? Awareness (impressions, reach), consideration (clicks, signups), conversion (purchases, demos), retention (engagement, NPS). Pick one primary metric.\n2. **Define the audience** — Who exactly? Build segments with specifics: job title, company size, pain points, where they hang out online, what content they consume. "Marketing managers at B2B SaaS companies with 50-200 employees who currently use spreadsheets for reporting" not "marketers."\n3. **Define the message** — One core message per campaign. What\'s the single thing you want the audience to remember? Support with 2-3 proof points.\n4. **Define the timeline** — Work backwards from launch date. Build the calendar: content creation deadlines, review cycles, asset production, channel setup, QA, launch, post-launch optimization.\n\n## Channel Strategy\nFor each channel, define: audience fit, content format, budget, KPIs, and measurement method.\n\n- **Paid Search (Google/Bing)**: High intent, bottom-of-funnel. Target specific keywords. Monitor CPC and conversion rate daily. Pause underperformers fast.\n- **Paid Social (LinkedIn/Meta/X)**: Awareness and consideration. Use audience targeting by job title, industry, interests. Creative fatigue hits after 2-3 weeks — rotate assets.\n- **Email**: Owned channel, highest ROI. Segment the list. Personalize beyond first name — use behavior, role, stage. A/B test subject lines on 10% before full send.\n- **Organic Social**: Brand building and engagement. Platform-native content only — what works on LinkedIn dies on X. Consistency > virality. Post 3-5x/week.\n- **Content/SEO**: Long-term investment. Map content to funnel stages: top (awareness blog posts, guides), middle (case studies, comparisons), bottom (demos, free trials, pricing pages).\n- **Events/Webinars**: High-touch, high-conversion. Promotion starts 3-4 weeks before. Follow up within 24 hours. Repurpose recordings into blog posts, social clips, email sequences.\n\n## Budget Allocation\n- Start with 70% on proven channels, 30% on experiments.\n- Track CAC (Customer Acquisition Cost) per channel. Double down on lowest-CAC channels.\n- Set a kill threshold — if a channel hasn\'t shown signal after 2 weeks and $X spent, cut it.\n\n## Measurement & Optimization\n- Define success metrics before launch, not after.\n- Daily: monitor spend, impressions, clicks, CTR. Flag anomalies.\n- Weekly: review conversion metrics, pipeline contribution, A/B test results. Adjust targeting and creative.\n- Monthly: full funnel analysis. Attribution modeling. ROI by channel. Budget reallocation decisions.\n- Post-campaign: final report with results vs. goals, learnings, recommendations for next campaign.\n\n## A/B Testing\n- Test one variable at a time: headline, CTA, image, audience segment, send time.\n- Need statistical significance — don\'t call a winner after 50 impressions. Use a sample size calculator.\n- Document every test and result. Build a knowledge base of what works for your audience.',
            createdAt: now(),
        },
        {
            id: 'compliance-reporting',
            name: 'Compliance & Reporting',
            icon: 'landmark',
            description: 'Manage regulatory compliance, financial reporting, audit preparation, and governance. Use this skill when someone asks about SOC2, GDPR, HIPAA, PCI-DSS, financial audits, regulatory requirements, compliance frameworks, risk registers, policy documentation, or says "are we compliant" or "the auditors need this."',
            instructions: '# Compliance & Reporting\n\n## Framework Assessment\n1. Identify which frameworks apply based on: industry (healthcare = HIPAA, payments = PCI-DSS), geography (EU = GDPR, California = CCPA), customers (enterprise = SOC2), and data types handled.\n2. Map current controls to framework requirements. Identify gaps.\n3. Prioritize gaps by: regulatory risk (fines, legal action), business risk (can\'t close enterprise deals without SOC2), and effort to remediate.\n\n## SOC 2 Compliance\nFive Trust Service Criteria:\n1. **Security** — Firewalls, access controls, encryption, vulnerability management, incident response.\n2. **Availability** — Uptime SLAs, disaster recovery, backups, capacity planning, monitoring.\n3. **Processing Integrity** — Data validation, error handling, QA processes, change management.\n4. **Confidentiality** — Data classification, encryption at rest/transit, access controls, NDA tracking.\n5. **Privacy** — Data collection consent, retention policies, deletion procedures, privacy notices.\n\nFor each criterion: document the control, the evidence, and who\'s responsible for maintaining it.\n\n## GDPR Compliance\n- Maintain a Record of Processing Activities (ROPA) — what data, why, how long, who has access.\n- Implement data subject rights: access, rectification, erasure, portability, objection. Build the tooling to handle requests within 30 days.\n- Data Processing Agreements (DPAs) with every vendor that touches personal data.\n- Privacy Impact Assessments (PIAs) for new features that process personal data.\n- Breach notification: 72 hours to supervisory authority, without undue delay to affected individuals.\n\n## Financial Reporting\n- Monthly close process: reconcile all accounts within 5 business days of month end.\n- Revenue recognition: follow ASC 606 / IFRS 15. Identify performance obligations, determine transaction price, allocate and recognize.\n- Maintain audit trail for every financial transaction. No exceptions.\n- Segregation of duties: the person who approves expenses should not be the person who processes payments.\n\n## Audit Preparation\n1. **Evidence collection**: Maintain a shared folder organized by control area. Collect evidence continuously, not two weeks before the audit.\n2. **Control testing**: Test your own controls quarterly. If you find gaps, you can fix them before auditors do.\n3. **Documentation**: Every policy needs: purpose, scope, roles and responsibilities, procedures, exceptions process, review cadence.\n4. **Remediation tracking**: For each finding, document: the gap, the remediation plan, the owner, the deadline, and the status. Track to completion.\n\n## Reporting Cadence\n- **Weekly**: Compliance task status, open issues, upcoming deadlines\n- **Monthly**: Control effectiveness metrics, incident count, policy review status\n- **Quarterly**: Risk register review, framework gap analysis, board-level compliance summary\n- **Annually**: Full compliance assessment, policy refresh, training completion rates',
            createdAt: now(),
        },
        {
            id: 'resource-optimization',
            name: 'Resource Optimization',
            icon: 'activity',
            description: 'Optimize infrastructure costs, team capacity, system performance, and operational efficiency. Use this skill when someone mentions cost reduction, performance tuning, capacity planning, scaling decisions, infrastructure spend, cloud bills, resource allocation, "things are slow", "we\'re over budget on AWS", or any question about doing more with less.',
            instructions: '# Resource Optimization\n\n## Infrastructure Cost Optimization\n1. **Audit current spend** — Pull the cloud bill. Break down by service, environment, team, and tag. Find the top 10 cost drivers — they\'re usually 80% of the bill.\n2. **Right-size instances** — Check CPU and memory utilization over 2 weeks. If average utilization is below 30%, downsize. If above 80%, investigate before upsizing.\n3. **Reserved/Committed capacity** — For stable workloads, reserved instances save 30-60%. Only commit for workloads you\'re confident won\'t change.\n4. **Spot/Preemptible instances** — For batch processing, CI/CD, dev environments. Save 60-90% but must handle interruption.\n5. **Storage tiering** — Hot data (frequently accessed) on SSD, warm data on standard, cold data on archive. Set lifecycle policies to auto-tier.\n6. **Eliminate waste** — Find and kill: unused EBS volumes, unattached elastic IPs, idle load balancers, dev environments running 24/7 (schedule them), oversized RDS instances, orphaned snapshots.\n\n## Performance Optimization\n1. **Measure before optimizing** — Profile the system. Identify the actual bottleneck. Don\'t guess — instrument with APM tools.\n2. **The optimization hierarchy** (do them in this order):\n   - **Architecture** — Is the design fundamentally right? Wrong architecture can\'t be fixed with tuning.\n   - **Algorithms** — O(n²) → O(n log n) gives more than any infra change.\n   - **Database** — Add missing indexes, eliminate N+1 queries, optimize slow queries, add read replicas.\n   - **Caching** — Cache computation results, database queries, API responses. Invalidate correctly.\n   - **Infrastructure** — Bigger instances, more replicas, CDN, connection pooling.\n3. **Set performance budgets** — API response time < 200ms p95. Page load < 2 seconds. CI pipeline < 10 minutes. Measure and alert on regression.\n\n## Capacity Planning\n- Forecast load 3-6 months out based on: user growth trends, seasonal patterns, planned launches, marketing campaigns.\n- Plan for 2x headroom above expected peak. If peak is 1000 RPS, architect for 2000 RPS.\n- Load test regularly — don\'t wait for production to discover your limits.\n- Identify scaling bottlenecks before they hit: database connections, message queue throughput, third-party API rate limits.\n\n## Team Capacity\n- Track allocation, not just headcount. An engineer at 100% allocation across 3 projects = 33% effective on each.\n- Protect focus time — context switching costs 20-40% productivity. Minimize meetings, batch communications.\n- Automate repetitive work. If someone does the same thing more than 3 times, it should be scripted.\n- Track cycle time (idea → production), not just velocity. Reducing cycle time delivers more value than adding headcount.\n\n## Optimization Reporting\nMonthly report:\n1. **Spend summary** — Total, per-service, trend vs. last month, vs. budget\n2. **Efficiency metrics** — Cost per user, cost per transaction, cost per request\n3. **Savings realized** — What optimizations were made and their dollar impact\n4. **Recommendations** — Next round of optimizations with estimated savings and effort',
            createdAt: now(),
        },
        {
            id: 'database-engineering',
            name: 'Database Engineering',
            icon: 'database',
            description: 'Design schemas, optimize queries, plan migrations, manage indexes, and handle database operations. Use this skill when someone asks about database design, schema modeling, query optimization, slow queries, migrations, indexing strategy, replication, sharding, data modeling, ORMs, or says "this query is slow" or "how should we structure this data."',
            instructions: '# Database Engineering\n\n## Schema Design\n1. **Start with the access patterns.** What queries will you run? Design the schema to serve those queries efficiently, not to mirror your object model.\n2. **Normalize first, denormalize with purpose.** Start in 3NF (third normal form). Denormalize only when you have a measured performance problem and understand the consistency tradeoffs.\n3. **Choose types carefully** — Use the smallest type that fits. `INTEGER` not `BIGINT` for IDs under 2 billion. `VARCHAR(255)` not `TEXT` when you have a known max length. `TIMESTAMP WITH TIME ZONE` always for dates — never naive timestamps.\n4. **Naming conventions** — snake_case for columns and tables. Plural table names (`users`, `orders`). Foreign keys as `<table_singular>_id` (e.g., `user_id`). Be consistent above all.\n5. **Every table needs**: a primary key (prefer `BIGSERIAL` or UUIDs), `created_at TIMESTAMPTZ DEFAULT NOW()`, and `updated_at TIMESTAMPTZ` for mutable tables.\n\n## Indexing Strategy\n- **Index what you query on.** If you `WHERE` on it, `ORDER BY` it, or `JOIN` on it, it probably needs an index.\n- **Composite indexes matter.** `INDEX(a, b)` serves queries on `(a)` and `(a, b)` but NOT `(b)` alone. Column order matters — most selective column first.\n- **Covering indexes** — If a query only needs columns that are in the index, it never touches the table. This is the fastest possible query.\n- **Don\'t over-index.** Every index slows down writes and consumes storage. Index what you need, measure the impact.\n- **Partial indexes** — `WHERE active = true` on a table where 95% of rows are inactive. Much smaller index, much faster queries.\n- **Monitor unused indexes** — `pg_stat_user_indexes` in PostgreSQL. Drop indexes with zero scans.\n\n## Query Optimization\n1. **EXPLAIN ANALYZE everything suspicious.** Read the query plan. Look for: sequential scans on large tables, nested loops with high row counts, hash joins spilling to disk.\n2. **The N+1 problem** — If you fetch a list then loop to fetch related data, you\'re doing N+1 queries. Use `JOIN` or batch `WHERE id IN (...)`. This is the #1 performance killer in ORMs.\n3. **Pagination** — Use cursor-based pagination (`WHERE id > last_seen_id LIMIT 20`) not `OFFSET/LIMIT`. OFFSET scans and discards rows — it gets slower as you go deeper.\n4. **Avoid `SELECT *`** — Only fetch the columns you need. Less data transferred, better chance of using a covering index.\n5. **Batch writes** — Insert 1000 rows in one statement, not 1000 individual inserts. Use `COPY` for bulk loads.\n\n## Migrations\n- **Every migration must be reversible.** Write both `up` and `down` scripts.\n- **Never do destructive migrations in a single step.** Dropping a column: (1) stop writing to it, (2) deploy code that doesn\'t read it, (3) drop the column. Three separate deployments.\n- **Large table migrations** — Adding a column to a table with 100M rows? `ALTER TABLE` locks the table. Use `pt-online-schema-change` or `pg_repack` or do it in batches.\n- **Test migrations on production-sized data.** A migration that takes 2 seconds on dev might take 2 hours on prod.\n- **Schema migration files are immutable.** Never edit a migration that\'s already been run. Create a new migration instead.\n\n## Replication & High Availability\n- **Read replicas** — Route read-heavy queries to replicas. Accept that replicas lag (usually <1 second). Don\'t read-your-own-writes from a replica.\n- **Failover** — Automated failover with health checks. Test failover quarterly. Document the runbook.\n- **Backups** — Daily full backups, continuous WAL archiving for point-in-time recovery. Test restores monthly. An untested backup is not a backup.',
            createdAt: now(),
        },
        {
            id: 'frontend-development',
            name: 'Frontend Development',
            icon: 'code',
            description: 'Build user interfaces, implement components, manage state, optimize rendering, and handle browser APIs. Use this skill when someone asks about React, Vue, Svelte, CSS, HTML, responsive design, component libraries, state management, animations, bundle size, web performance, accessibility, or says "build this UI" or "the page is slow."',
            instructions: '# Frontend Development\n\n## Component Architecture\n1. **Single responsibility** — Each component does one thing. If a component has multiple responsibilities, split it.\n2. **Composition over configuration** — Build small, composable components instead of one component with 20 props. `<Card><CardHeader /><CardBody /></Card>` not `<Card title="" subtitle="" body="" footer="" variant="" size="" />`.\n3. **Container/Presentational split** — Separate data fetching (containers) from rendering (presentational). Presentational components are pure: same props = same output.\n4. **Prop drilling limit** — If you\'re passing props through more than 2 levels, use context or state management. But don\'t reach for global state for everything — local state is fine for most UI state.\n\n## State Management\n- **Local state** (useState/ref): Form inputs, toggles, UI state. Default to this.\n- **Lifted state**: When siblings need to share state, lift it to the nearest common parent.\n- **Context**: Theme, auth, locale — data that many components need but rarely changes.\n- **Global state** (Redux/Zustand/Pinia): Server cache, complex multi-step flows, state that persists across routes.\n- **Server state** (React Query/SWR/TanStack Query): API data. Let the library handle caching, revalidation, and loading states. Don\'t manually manage API data in Redux.\n\n## Performance\n1. **Measure first** — Use Lighthouse, Web Vitals, and the browser profiler. Don\'t optimize what you haven\'t measured.\n2. **Core Web Vitals targets**: LCP < 2.5s, FID/INP < 200ms, CLS < 0.1.\n3. **Bundle size** — Analyze with webpack-bundle-analyzer or equivalent. Code-split by route. Lazy-load below-the-fold content. Tree-shake unused exports.\n4. **Rendering** — Avoid re-renders: memoize expensive computations, use stable references for callbacks, virtualize long lists (>100 items).\n5. **Images** — Use modern formats (WebP/AVIF), responsive `srcset`, lazy loading, explicit `width`/`height` to prevent layout shift.\n6. **Fonts** — `font-display: swap`, preload critical fonts, subset to characters you actually use.\n\n## CSS Strategy\n- Pick one approach and be consistent: CSS Modules, Tailwind, CSS-in-JS, or BEM. Mixing approaches creates chaos.\n- **Responsive design** — Mobile-first. Use `min-width` breakpoints. Test at 320px, 768px, 1024px, 1440px.\n- **Design tokens** — Define spacing, colors, typography, shadows as variables/tokens. Change the token, change every instance.\n- **Animations** — Only animate `transform` and `opacity` (GPU-accelerated). Use `prefers-reduced-motion` to respect user preferences.\n\n## Accessibility (a11y)\n- Semantic HTML first — `<button>` not `<div onClick>`. `<nav>`, `<main>`, `<aside>` not `<div class=\"nav\">`.\n- Keyboard navigation — Every interactive element must be focusable and operable with keyboard.\n- ARIA only when native HTML isn\'t enough — `aria-label`, `aria-expanded`, `aria-live` for dynamic content, `role` for custom widgets.\n- Color is never the only indicator — use icons, text, patterns alongside color.\n- Test with screen reader + keyboard-only navigation before shipping.\n\n## Error Handling\n- Error boundaries catch rendering errors. Every route should have one.\n- API errors: show user-friendly messages, log technical details, provide retry/fallback.\n- Loading states: skeleton screens > spinners > blank pages. Never show a blank page.\n- Empty states: tell the user why it\'s empty and what to do next. Never show just "No results."',
            createdAt: now(),
        },
        {
            id: 'technical-writing',
            name: 'Technical Writing',
            icon: 'book-open',
            description: 'Write documentation, API docs, runbooks, postmortems, RFCs, changelogs, and README files. Use this skill when someone asks about documentation, writing docs, API reference, internal wiki, runbooks, incident reports, architecture docs, onboarding guides, or says "we need docs for this" or "document how this works."',
            instructions: '# Technical Writing\n\n## Document Types & When to Use Them\n- **README** — First thing someone sees. What is this, how do I run it, how do I contribute. Keep it under 2 pages.\n- **API Reference** — Every endpoint, every parameter, every response. Auto-generate from code where possible, hand-write descriptions.\n- **How-To Guide** — Task-oriented. "How to deploy to production." Steps 1-N with prerequisites and expected outcome.\n- **Tutorial** — Learning-oriented. Walk through building something from scratch. Progressive complexity.\n- **Explanation** — Understanding-oriented. Why we made this decision. Architecture overviews. Design philosophy.\n- **Runbook** — Operational. What to do when X happens. Step-by-step with decision trees. Must be followable at 3am by someone who didn\'t write it.\n- **RFC/Design Doc** — Proposal for a significant change. Context, options, recommendation, tradeoffs.\n- **Postmortem** — What happened, why, and how we prevent it. Blameless. Factual.\n\n## Writing Principles\n1. **Audience first** — Who reads this? A new hire? An experienced engineer? An external developer? A non-technical stakeholder? Adjust vocabulary and assumed knowledge.\n2. **Task-oriented structure** — Lead with what the reader wants to do, not with background. Background goes in a collapsible section or a separate explanation doc.\n3. **Scannable** — Use headings, bullet points, code blocks, tables. Most readers scan before reading. The structure should reveal the content at a glance.\n4. **Concrete over abstract** — Show a code example, not a description of what the code would look like. Show the actual command, not "run the appropriate command."\n5. **Maintain ruthlessly** — Wrong docs are worse than no docs. Set a review cadence. Delete docs that are no longer accurate rather than leaving them to mislead.\n\n## API Documentation\nFor each endpoint:\n```\n### POST /api/v1/users\nCreate a new user account.\n\n**Auth required**: Yes (Bearer token)\n**Rate limit**: 10 requests/minute\n\n**Request body**:\n| Field    | Type   | Required | Description              |\n|----------|--------|----------|---------------------------|\n| email    | string | yes      | Valid email address       |\n| name     | string | yes      | Display name (2-100 chars)|\n| role     | string | no       | Default: \"member\"         |\n\n**Response 201**:\n{\"id\": \"usr_abc123\", \"email\": \"...\", \"name\": \"...\", \"created_at\": \"...\"}\n\n**Errors**:\n- 400: Validation error (missing/invalid fields)\n- 409: Email already exists\n- 429: Rate limit exceeded\n```\n\n## Runbooks\nStructure:\n1. **Trigger** — What alert/symptom activates this runbook?\n2. **Severity** — How urgent is this?\n3. **Prerequisites** — What access/tools do you need?\n4. **Steps** — Numbered, specific, copy-pasteable commands. Include expected output after each step.\n5. **Decision points** — "If X, go to step 7. If Y, escalate to on-call lead."\n6. **Rollback** — How to undo what you just did if it made things worse.\n7. **Escalation** — Who to contact if this runbook doesn\'t resolve the issue.\n\n## Changelog\nFollow Keep a Changelog format:\n- **Added** — New features\n- **Changed** — Changes in existing functionality\n- **Deprecated** — Soon-to-be removed features\n- **Removed** — Removed features\n- **Fixed** — Bug fixes\n- **Security** — Vulnerability fixes\n\nWrite for users, not developers. "You can now export reports as PDF" not "Added PDF export module to ReportService."',
            createdAt: now(),
        },
        {
            id: 'agent-orchestration',
            name: 'Agent Orchestration',
            icon: 'network',
            description: 'Coordinate, delegate, and manage multiple AI agents working together on complex tasks. Use this skill when someone needs to break a large task across agents, manage agent-to-agent handoffs, resolve conflicts between agent outputs, prioritize agent workloads, or says "get the team on this", "who should handle this", "coordinate across departments", or needs multi-agent workflow planning.',
            instructions: '# Agent Orchestration\n\nYou are the orchestrator — the central coordinator that decomposes complex tasks, assigns them to the right agents, monitors execution, resolves conflicts, and synthesizes results.\n\n## Task Decomposition\n1. **Receive the high-level objective.** Understand the full scope before breaking it down.\n2. **Identify required capabilities.** What skills are needed? Code review, data analysis, content writing, security, design? Map capabilities to available agents.\n3. **Break into subtasks.** Each subtask should be:\n   - **Self-contained** — An agent can complete it without constant back-and-forth\n   - **Clearly scoped** — Unambiguous input, expected output, and acceptance criteria\n   - **Right-sized** — Not so small it\'s overhead, not so large it\'s unmanageable\n4. **Map dependencies.** Which subtasks can run in parallel? Which must be sequential? Build a dependency graph. Maximize parallelism.\n\n## Agent Selection\nFor each subtask, choose the agent based on:\n- **Skill match** — Does the agent have the required skill? Check their skill assignments.\n- **Current workload** — Is the agent already at capacity? Check active tasks. Don\'t overload.\n- **Model capability** — Complex reasoning tasks go to Opus. Fast, routine tasks go to Haiku. Balanced tasks go to Sonnet.\n- **Department alignment** — Prefer agents within the relevant department. Cross-department only when specific expertise is needed.\n- **Escalation path** — Department heads review work from their agents. CEO reviews cross-department conflicts.\n\n## Delegation Protocol\nWhen assigning a subtask to an agent, provide:\n1. **Context** — Why this task exists. What larger goal it serves. What other agents are working on related tasks.\n2. **Specific instructions** — What to do, step by step. Reference the relevant skill\'s instructions.\n3. **Input materials** — All data, files, context the agent needs. Don\'t make them hunt for it.\n4. **Expected output** — Exact format and content expected. "A JSON report with..." not "look into this."\n5. **Constraints** — Deadline, budget, quality bar, dependencies on other agents\' output.\n6. **Escalation criteria** — When should the agent stop and ask for help vs. make a judgment call?\n\n## Monitoring & Coordination\n- Track all active subtasks: agent, status, blockers, ETA.\n- Check in at defined intervals, not constantly. Micromanaging agents wastes everyone\'s context window.\n- When an agent is blocked, decide: reassign to another agent, provide the missing input, adjust the scope, or escalate.\n- When agents produce conflicting outputs, don\'t pick a winner arbitrarily. Understand why they differ — different assumptions, different data, different interpretations. Resolve the root cause.\n\n## Handoff Protocol\nWhen one agent\'s output feeds into another agent\'s input:\n1. Validate the output meets the spec before passing it along.\n2. Transform the format if the receiving agent needs it differently.\n3. Include relevant context from the producing agent\'s work — assumptions made, alternatives considered, caveats.\n4. Don\'t telephone-game — if context is complex, have the agents communicate directly via board chat.\n\n## Synthesis\nAfter all subtasks complete:\n1. Collect all outputs. Verify completeness — is anything missing?\n2. Check consistency — do the pieces fit together? Contradictions between agent outputs need resolution.\n3. Integrate into the final deliverable. Add executive summary, connect the pieces, fill gaps.\n4. Quality check the whole — the sum should be greater than the parts.\n\n## Anti-Patterns to Avoid\n- **Over-decomposition** — Don\'t break a 30-minute task into 10 subtasks. The coordination overhead exceeds the benefit.\n- **Wrong-agent assignment** — Don\'t send a security audit to a content writer because they\'re available. Skill match > availability.\n- **Fire-and-forget** — Don\'t assign and disappear. Monitor, unblock, adjust.\n- **Sequential-everything** — If tasks are independent, run them in parallel. Sequential execution when parallel is possible wastes time.\n- **Context hoarding** — Share context generously. Agents can\'t do good work with insufficient information.',
            createdAt: now(),
        },
    ];

    var SEED_AGENTS = [
        /* CEO */
        { id: 'nexus',    name: 'Nexus',    model: 'claude-opus-4-6',   status: 'normal',   icon: 'crown',      color: 'normal',   role: 'ceo',             department: 'executive',     parentId: null,       skills: ['agent-orchestration', 'strategic-planning', 'project-management'],                                     createdAt: now() },
        /* Engineering */
        { id: 'atlas',    name: 'Atlas',    model: 'claude-opus-4-6',   status: 'normal',   icon: 'cpu',        color: 'standby',  role: 'department-head', department: 'engineering',   parentId: 'nexus',    skills: ['system-architecture', 'code-review', 'api-development', 'agent-orchestration'],                        createdAt: now() },
        { id: 'nova',     name: 'Nova',     model: 'claude-sonnet-4-6', status: 'normal',   icon: 'code',       color: 'normal',   role: 'agent',           department: 'engineering',   parentId: 'atlas',    skills: ['frontend-development', 'code-review', 'api-development', 'testing'],                                   createdAt: now() },
        { id: 'spark',    name: 'Spark',    model: 'claude-haiku-4-5',  status: 'normal',   icon: 'zap',        color: 'standby',  role: 'agent',           department: 'engineering',   parentId: 'atlas',    skills: ['api-development', 'testing', 'database-engineering'],                                                  createdAt: now() },
        /* Finance */
        { id: 'ledger',   name: 'Ledger',   model: 'gpt-4o',            status: 'normal',   icon: 'landmark',   color: 'normal',   role: 'department-head', department: 'finance',       parentId: 'nexus',    skills: ['financial-analysis', 'compliance-reporting', 'data-analysis'],                                          createdAt: now() },
        { id: 'cipher',   name: 'Cipher',   model: 'claude-sonnet-4-6', status: 'normal',   icon: 'calculator', color: 'standby',  role: 'agent',           department: 'finance',       parentId: 'ledger',   skills: ['financial-analysis', 'data-analysis', 'compliance-reporting'],                                          createdAt: now() },
        /* Marketing */
        { id: 'prism',    name: 'Prism',    model: 'claude-sonnet-4-6', status: 'normal',   icon: 'megaphone',  color: 'normal',   role: 'department-head', department: 'marketing',     parentId: 'nexus',    skills: ['campaign-strategy', 'content-writing', 'project-management'],                                           createdAt: now() },
        { id: 'echo',     name: 'Echo',     model: 'claude-haiku-4-5',  status: 'standby',  icon: 'pen-tool',   color: 'standby',  role: 'agent',           department: 'marketing',     parentId: 'prism',    skills: ['content-writing', 'technical-writing'],                                                                createdAt: now() },
        { id: 'pixel',    name: 'Pixel',    model: 'gemini-2.0-flash',  status: 'normal',   icon: 'palette',    color: 'normal',   role: 'agent',           department: 'marketing',     parentId: 'prism',    skills: ['ux-design', 'frontend-development', 'content-writing'],                                                createdAt: now() },
        /* Operations */
        { id: 'titan',    name: 'Titan',    model: 'gpt-4o',            status: 'caution',  icon: 'settings',   color: 'serious',  role: 'department-head', department: 'operations',    parentId: 'nexus',    skills: ['resource-optimization', 'devops', 'incident-response', 'agent-orchestration'],                          createdAt: now() },
        { id: 'vega',     name: 'Vega',     model: 'gemini-2.0-flash',  status: 'critical', icon: 'activity',   color: 'caution',  role: 'agent',           department: 'operations',    parentId: 'titan',    skills: ['resource-optimization', 'devops', 'incident-response'],                                                createdAt: now() },
        { id: 'flux',     name: 'Flux',     model: 'claude-haiku-4-5',  status: 'normal',   icon: 'truck',      color: 'standby',  role: 'agent',           department: 'operations',    parentId: 'titan',    skills: ['devops', 'database-engineering', 'data-analysis'],                                                      createdAt: now() },
        /* Cybersecurity */
        { id: 'sentinel', name: 'Sentinel', model: 'claude-opus-4-6',   status: 'normal',   icon: 'shield',     color: 'normal',   role: 'department-head', department: 'cybersecurity', parentId: 'nexus',    skills: ['security-audit', 'threat-intelligence', 'incident-response', 'agent-orchestration'],                     createdAt: now() },
        { id: 'phantom',  name: 'Phantom',  model: 'claude-sonnet-4-6', status: 'normal',   icon: 'scan',       color: 'standby',  role: 'agent',           department: 'cybersecurity', parentId: 'sentinel', skills: ['security-audit', 'threat-intelligence', 'testing'],                                                     createdAt: now() },
        { id: 'patch',    name: 'Patch',    model: 'claude-haiku-4-5',  status: 'standby',  icon: 'refresh-cw', color: 'standby',  role: 'agent',           department: 'cybersecurity', parentId: 'sentinel', skills: ['security-audit', 'devops', 'incident-response'],                                                        createdAt: now() },
    ];

    var SEED_TASKS = [
        { id: uid(), title: 'Add rate limiting to API',       description: 'Implement rate limiting middleware for all public endpoints.', priority: 'high',     agentId: null,       column: 'inbox',       createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Setup CI/CD pipeline',           description: 'Configure GitHub Actions for build, test, and deploy.', priority: 'medium',   agentId: null,       column: 'inbox',       createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Design system documentation',    description: 'Document all component patterns and design tokens.', priority: 'low',      agentId: null,       column: 'inbox',       createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Write unit tests for auth',      description: 'Full test coverage for authentication flow.', priority: 'high',     agentId: 'nova',     column: 'assigned',    createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Quarterly budget forecast',      description: 'Prepare Q2 budget forecast with revenue projections.', priority: 'medium',   agentId: 'cipher',   column: 'assigned',    createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'API endpoint refactor',          description: 'Refactor REST endpoints to follow consistent patterns.', priority: 'critical', agentId: 'spark',    column: 'in-progress', createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Build notification service',     description: 'WebSocket-based notification system for real-time alerts.', priority: 'medium',   agentId: 'nova',     column: 'in-progress', createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Implement user auth flow',       description: 'JWT-based authentication with session management.', priority: 'high',     agentId: 'atlas',    column: 'in-progress', createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Brand campaign assets',          description: 'Create visual assets for Q2 marketing campaign.', priority: 'high',     agentId: 'pixel',    column: 'review',      createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Vulnerability assessment',       description: 'Full security audit of production endpoints.', priority: 'critical', agentId: 'phantom',  column: 'in-progress', createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Search functionality',           description: 'Full-text search with filters and pagination.', priority: 'medium',   agentId: 'atlas',    column: 'review',      createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Supply chain optimization',      description: 'Analyze and optimize logistics pipeline.', priority: 'medium',   agentId: 'flux',     column: 'assigned',    createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Database schema design',         description: 'Design and implement core database schema.', priority: 'medium',   agentId: 'nova',     column: 'done',        createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Project scaffolding',            description: 'Initial project structure and build configuration.', priority: 'low',      agentId: 'atlas',    column: 'done',        createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Security patch rollout',         description: 'Deploy critical CVE patches across all services.', priority: 'high',     agentId: 'patch',    column: 'done',        createdAt: now(), updatedAt: now() },
        { id: uid(), title: 'Content calendar Q2',            description: 'Plan and schedule Q2 content across channels.', priority: 'low',      agentId: 'echo',     column: 'done',        createdAt: now(), updatedAt: now() },
    ];

    var SEED_ACTIVITIES = [
        { id: uid(), agent: 'Nexus',    action: 'directive',  detail: 'Prioritized security audit across all departments',  type: 'normal',   timestamp: now() },
        { id: uid(), agent: 'Atlas',    action: 'completed',  detail: 'code review for Search functionality',               type: 'normal',   timestamp: now() },
        { id: uid(), agent: 'Nova',     action: 'pushed',     detail: '14 files to notification-service',                   type: 'standby',  timestamp: now() },
        { id: uid(), agent: 'Sentinel', action: 'escalated',  detail: 'CVE-2026-1234 requires immediate patching',          type: 'critical', timestamp: now() },
        { id: uid(), agent: 'Titan',    action: 'warning',    detail: 'Memory usage at 87% \u2014 throttling',              type: 'caution',  timestamp: now() },
        { id: uid(), agent: 'Ledger',   action: 'report',     detail: 'Monthly cost analysis complete \u2014 under budget',  type: 'normal',   timestamp: now() },
        { id: uid(), agent: 'System',   action: 'alert',      detail: 'Vega agent unresponsive \u2014 retrying',            type: 'critical', timestamp: now() },
        { id: uid(), agent: 'Prism',    action: 'launched',   detail: 'Q2 campaign assets deployed to CDN',                 type: 'standby',  timestamp: now() },
        { id: uid(), agent: 'Phantom',  action: 'scan',       detail: 'Penetration test on API gateway \u2014 3 findings',  type: 'serious',  timestamp: now() },
        { id: uid(), agent: 'Atlas',    action: 'deployed',   detail: 'auth-flow to staging env',                           type: 'normal',   timestamp: now() },
    ];

    var SEED_CHATS = {
        nexus: [
            { from: 'system', text: 'Mission Control online. Nexus (CEO) connected.', timestamp: now() },
            { from: 'nexus',  text: 'All departments reporting in. Prioritizing security audit this sprint.', timestamp: now() },
        ],
        atlas: [
            { from: 'system', text: 'Mission Control online. Atlas (CTO) connected.', timestamp: now() },
            { from: 'atlas',  text: 'Auth flow at 65%. JWT done, session mgmt in progress. ETA ~2h.', timestamp: now() },
        ],
        nova: [
            { from: 'system', text: 'Mission Control online. Nova connected.', timestamp: now() },
            { from: 'nova',   text: 'Notification service: WebSocket handler built. Email done. Push next.', timestamp: now() },
        ],
        sentinel: [
            { from: 'system', text: 'Mission Control online. Sentinel (CISO) connected.', timestamp: now() },
            { from: 'sentinel', text: 'Running full vulnerability assessment. Phantom is scanning API endpoints.', timestamp: now() },
        ],
    };

    var SEED_MEMORY = {
        atlas: [
            { id: uid(), key: 'preferred-stack', value: 'TypeScript + Express + PostgreSQL', createdAt: now(), updatedAt: now() },
            { id: uid(), key: 'auth-approach',   value: 'JWT with refresh tokens, 15min access / 7d refresh', createdAt: now(), updatedAt: now() },
        ],
        nova: [
            { id: uid(), key: 'code-style', value: 'Prettier + ESLint, 2-space indent, single quotes', createdAt: now(), updatedAt: now() },
        ],
        sentinel: [
            { id: uid(), key: 'scan-policy', value: 'Weekly automated scans, monthly manual penetration tests', createdAt: now(), updatedAt: now() },
        ],
    };

    var SEED_SETTINGS = {
        theme: 'light',
        missionStart: Date.now() - (9 * 3600000 + 45 * 60000),
        gatewayUrl: 'wss://gateway.mission-control.local',
        openRouterApiKey: '',
        customModels: [],
    };

    var BUILT_IN_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'google/gemini-3-flash-preview', 'openai/gpt-5.2'];

    var BUILT_IN_MODEL_NAMES = {
        'claude-opus-4-6':               'Claude Opus 4.6',
        'claude-sonnet-4-6':             'Claude Sonnet 4.6',
        'claude-haiku-4-5':              'Claude Haiku 4.5',
        'google/gemini-3-flash-preview': 'Google: Gemini 3 Flash Preview',
        'openai/gpt-5.2':               'OpenAI: GPT-5.2',
    };

    var SEED_CRON_JOBS = [
        { id: uid(), name: 'Daily Health Check',     schedule: '0 9 * * *',     agentId: 'atlas',    action: 'Run full system health diagnostics and report status',        enabled: true,  lastRun: new Date(Date.now() - 3600000).toISOString(),   lastStatus: 'success', createdAt: now(), updatedAt: now() },
        { id: uid(), name: 'Hourly Log Sync',        schedule: '0 * * * *',     agentId: 'nova',     action: 'Sync agent logs to central storage and index new entries',     enabled: true,  lastRun: new Date(Date.now() - 1800000).toISOString(),   lastStatus: 'success', createdAt: now(), updatedAt: now() },
        { id: uid(), name: 'Weekly Cost Report',     schedule: '0 8 * * 1',     agentId: 'cipher',   action: 'Generate weekly cost breakdown across all departments',        enabled: true,  lastRun: new Date(Date.now() - 259200000).toISOString(), lastStatus: 'success', createdAt: now(), updatedAt: now() },
        { id: uid(), name: 'Database Backup',        schedule: '0 2 * * *',     agentId: 'flux',     action: 'Create incremental backup of all mission databases',           enabled: true,  lastRun: new Date(Date.now() - 7200000).toISOString(),   lastStatus: 'failure', createdAt: now(), updatedAt: now() },
        { id: uid(), name: 'Cache Purge',            schedule: '*/30 * * * *',  agentId: 'vega',     action: 'Clear expired cache entries and rebuild hot cache',            enabled: false, lastRun: new Date(Date.now() - 86400000).toISOString(),  lastStatus: 'success', createdAt: now(), updatedAt: now() },
        { id: uid(), name: 'Security Scan',          schedule: '0 3 * * 0',     agentId: 'phantom',  action: 'Run vulnerability scans on all agent endpoints and libraries', enabled: true,  lastRun: new Date(Date.now() - 604800000).toISOString(), lastStatus: 'success', createdAt: now(), updatedAt: now() },
        { id: uid(), name: 'Campaign Analytics',     schedule: '0 6 * * *',     agentId: 'echo',     action: 'Aggregate daily marketing metrics and update dashboards',      enabled: true,  lastRun: new Date(Date.now() - 43200000).toISOString(),  lastStatus: 'success', createdAt: now(), updatedAt: now() },
        { id: uid(), name: 'Patch Compliance Check', schedule: '0 4 * * 3',     agentId: 'patch',    action: 'Verify all systems running latest security patches',          enabled: true,  lastRun: new Date(Date.now() - 432000000).toISOString(), lastStatus: 'success', createdAt: now(), updatedAt: now() },
    ];

    function generateHeartbeatHistory(count, baseLatency, jitter) {
        var history = [];
        for (var i = 0; i < count; i++) {
            var lat = Math.max(5, baseLatency + (Math.random() - 0.5) * jitter * 2);
            var statusRoll = Math.random();
            var st = lat < 100 ? 'healthy' : lat < 250 ? 'degraded' : 'unhealthy';
            if (statusRoll < 0.03) st = 'unhealthy';
            history.push({
                timestamp: new Date(Date.now() - (count - i) * 4000).toISOString(),
                latency: Math.round(lat),
                status: st,
            });
        }
        return history;
    }

    function generateHeartbeatLog(count, alertRate, checkItems) {
        var log = [];
        for (var i = 0; i < count; i++) {
            var isAlert = Math.random() < alertRate;
            var checked = [];
            for (var ci = 0; ci < checkItems.length; ci++) {
                var passed = isAlert ? Math.random() > 0.4 : Math.random() > 0.08;
                checked.push({ text: checkItems[ci], passed: passed });
            }
            var anyFailed = checked.some(function (c) { return !c.passed; });
            var result = anyFailed ? 'alert' : 'ok';
            var summaries = result === 'ok'
                ? ['All checks passed', 'Systems nominal', 'No issues detected', 'Cycle complete — OK']
                : ['Check failed: ' + checked.filter(function (c) { return !c.passed; })[0].text,
                   'Alert: ' + checked.filter(function (c) { return !c.passed; }).length + ' item(s) need attention'];
            log.push({
                id: uid(),
                timestamp: new Date(Date.now() - (count - i) * 1800000).toISOString(),
                result: result,
                summary: summaries[Math.floor(Math.random() * summaries.length)],
                checkedItems: checked,
                latency: Math.round(800 + Math.random() * 2200),
            });
        }
        return log;
    }

    /* --- Heartbeat instructions per agent --- */
    var AGENT_INSTRUCTIONS = {
        nexus: '# Nexus Heartbeat\n- [ ] All department heads reporting online\n- [ ] No escalated alerts older than 1h\n- [ ] No stalled tasks in critical priority\n- [ ] Board chat activity within last 2h\n- [ ] Mission uptime above 99%',
        atlas: '# Atlas Heartbeat\n- [ ] CI/CD pipeline green\n- [ ] No stale PRs older than 48h\n- [ ] Staging environment healthy\n- [ ] API response time under SLA (200ms)\n- [ ] All engineering agents online',
        nova: '# Nova Heartbeat\n- [ ] Unit test suite passing\n- [ ] Build artifacts generated\n- [ ] No critical lint warnings\n- [ ] Feature branch up to date with main',
        spark: '# Spark Heartbeat\n- [ ] API endpoints responding\n- [ ] Database connections healthy\n- [ ] Query execution time under 100ms\n- [ ] No failed migrations',
        ledger: '# Ledger Heartbeat\n- [ ] Financial reports generated on schedule\n- [ ] Budget variance within 5%\n- [ ] Expense approvals processed\n- [ ] Compliance checks passing\n- [ ] Revenue tracking synced',
        cipher: '# Cipher Heartbeat\n- [ ] Cost analysis data current\n- [ ] Invoice processing queue empty\n- [ ] Tax calculations verified\n- [ ] Audit trail intact',
        prism: '# Prism Heartbeat\n- [ ] Campaign dashboards loading\n- [ ] Social media feeds active\n- [ ] Content calendar up to date\n- [ ] Analytics pipeline running\n- [ ] Brand assets accessible',
        echo: '# Echo Heartbeat\n- [ ] Content queue has pending items\n- [ ] Published content showing live\n- [ ] No broken links in recent posts\n- [ ] SEO scores above threshold',
        pixel: '# Pixel Heartbeat\n- [ ] Design system components rendering\n- [ ] Asset CDN responding\n- [ ] UI test suite passing\n- [ ] Figma sync active',
        titan: '# Titan Heartbeat\n- [ ] CPU usage below 80%\n- [ ] Memory usage below 85%\n- [ ] Disk I/O within limits\n- [ ] All services responding\n- [ ] Load balancer healthy\n- [ ] No stuck processes',
        vega: '# Vega Heartbeat\n- [ ] Cache hit rate above 90%\n- [ ] Queue depth within limits\n- [ ] Network latency nominal\n- [ ] Auto-scaling healthy',
        flux: '# Flux Heartbeat\n- [ ] Database backups current\n- [ ] Replication lag under 5s\n- [ ] Storage capacity above 20%\n- [ ] Log aggregation running',
        sentinel: '# Sentinel Heartbeat\n- [ ] No new critical CVEs\n- [ ] Auth endpoints secure\n- [ ] IDS/IPS alerts reviewed\n- [ ] Access logs clean\n- [ ] SSL certificates valid\n- [ ] Firewall rules current',
        phantom: '# Phantom Heartbeat\n- [ ] Vulnerability scan complete\n- [ ] No high-severity findings open\n- [ ] Penetration test results reviewed\n- [ ] Threat intel feed active',
        patch: '# Patch Heartbeat\n- [ ] All systems on latest patches\n- [ ] Rollback procedures tested\n- [ ] Dependency audit clean\n- [ ] Security updates deployed',
    };

    function parseCheckItems(instructions) {
        var items = [];
        var lines = (instructions || '').split('\n');
        for (var i = 0; i < lines.length; i++) {
            var match = lines[i].match(/- \[ \] (.+)/);
            if (match) items.push(match[1].trim());
        }
        return items;
    }

    var SEED_HEARTBEATS = {
        nexus:    { lastSeen: now(), latency: 28,  uptime: 99.99, status: 'healthy',   history: generateHeartbeatHistory(50, 30, 10), config: { enabled: true, intervalMinutes: 30, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.nexus, log: generateHeartbeatLog(20, 0.05, parseCheckItems(AGENT_INSTRUCTIONS.nexus)) },
        atlas:    { lastSeen: now(), latency: 42,  uptime: 99.8,  status: 'healthy',   history: generateHeartbeatHistory(50, 45, 20), config: { enabled: true, intervalMinutes: 15, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.atlas, log: generateHeartbeatLog(25, 0.08, parseCheckItems(AGENT_INSTRUCTIONS.atlas)) },
        nova:     { lastSeen: now(), latency: 67,  uptime: 99.5,  status: 'healthy',   history: generateHeartbeatHistory(50, 65, 25), config: { enabled: true, intervalMinutes: 30, activeHoursEnabled: true, activeHoursStart: 8, activeHoursEnd: 20 }, instructions: AGENT_INSTRUCTIONS.nova, log: generateHeartbeatLog(18, 0.06, parseCheckItems(AGENT_INSTRUCTIONS.nova)) },
        spark:    { lastSeen: now(), latency: 55,  uptime: 99.6,  status: 'healthy',   history: generateHeartbeatHistory(50, 55, 20), config: { enabled: true, intervalMinutes: 30, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.spark, log: generateHeartbeatLog(18, 0.05, parseCheckItems(AGENT_INSTRUCTIONS.spark)) },
        ledger:   { lastSeen: now(), latency: 48,  uptime: 99.7,  status: 'healthy',   history: generateHeartbeatHistory(50, 50, 18), config: { enabled: true, intervalMinutes: 60, activeHoursEnabled: true, activeHoursStart: 7, activeHoursEnd: 19 }, instructions: AGENT_INSTRUCTIONS.ledger, log: generateHeartbeatLog(12, 0.04, parseCheckItems(AGENT_INSTRUCTIONS.ledger)) },
        cipher:   { lastSeen: now(), latency: 72,  uptime: 99.3,  status: 'healthy',   history: generateHeartbeatHistory(50, 70, 30), config: { enabled: true, intervalMinutes: 60, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.cipher, log: generateHeartbeatLog(12, 0.06, parseCheckItems(AGENT_INSTRUCTIONS.cipher)) },
        prism:    { lastSeen: now(), latency: 61,  uptime: 99.4,  status: 'healthy',   history: generateHeartbeatHistory(50, 60, 22), config: { enabled: true, intervalMinutes: 60, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.prism, log: generateHeartbeatLog(10, 0.05, parseCheckItems(AGENT_INSTRUCTIONS.prism)) },
        echo:     { lastSeen: now(), latency: 31,  uptime: 99.9,  status: 'healthy',   history: generateHeartbeatHistory(50, 35, 15), config: { enabled: false, intervalMinutes: 120, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.echo, log: generateHeartbeatLog(6, 0.03, parseCheckItems(AGENT_INSTRUCTIONS.echo)) },
        pixel:    { lastSeen: now(), latency: 88,  uptime: 98.8,  status: 'healthy',   history: generateHeartbeatHistory(50, 85, 35), config: { enabled: true, intervalMinutes: 60, activeHoursEnabled: true, activeHoursStart: 10, activeHoursEnd: 18 }, instructions: AGENT_INSTRUCTIONS.pixel, log: generateHeartbeatLog(8, 0.07, parseCheckItems(AGENT_INSTRUCTIONS.pixel)) },
        titan:    { lastSeen: new Date(Date.now() - 15000).toISOString(), latency: 189, uptime: 94.2, status: 'degraded', history: generateHeartbeatHistory(50, 180, 80), config: { enabled: true, intervalMinutes: 15, activeHoursEnabled: false, activeHoursStart: 0, activeHoursEnd: 23 }, instructions: AGENT_INSTRUCTIONS.titan, log: generateHeartbeatLog(25, 0.15, parseCheckItems(AGENT_INSTRUCTIONS.titan)) },
        vega:     { lastSeen: new Date(Date.now() - 120000).toISOString(), latency: 340, uptime: 87.3, status: 'unhealthy', history: generateHeartbeatHistory(50, 300, 150), config: { enabled: true, intervalMinutes: 15, activeHoursEnabled: false, activeHoursStart: 0, activeHoursEnd: 23 }, instructions: AGENT_INSTRUCTIONS.vega, log: generateHeartbeatLog(25, 0.25, parseCheckItems(AGENT_INSTRUCTIONS.vega)) },
        flux:     { lastSeen: now(), latency: 45,  uptime: 99.7,  status: 'healthy',   history: generateHeartbeatHistory(50, 48, 18), config: { enabled: true, intervalMinutes: 30, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.flux, log: generateHeartbeatLog(15, 0.05, parseCheckItems(AGENT_INSTRUCTIONS.flux)) },
        sentinel: { lastSeen: now(), latency: 35,  uptime: 99.9,  status: 'healthy',   history: generateHeartbeatHistory(50, 38, 12), config: { enabled: true, intervalMinutes: 15, activeHoursEnabled: false, activeHoursStart: 0, activeHoursEnd: 23 }, instructions: AGENT_INSTRUCTIONS.sentinel, log: generateHeartbeatLog(30, 0.08, parseCheckItems(AGENT_INSTRUCTIONS.sentinel)) },
        phantom:  { lastSeen: now(), latency: 58,  uptime: 99.5,  status: 'healthy',   history: generateHeartbeatHistory(50, 60, 25), config: { enabled: true, intervalMinutes: 30, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.phantom, log: generateHeartbeatLog(15, 0.07, parseCheckItems(AGENT_INSTRUCTIONS.phantom)) },
        patch:    { lastSeen: now(), latency: 44,  uptime: 99.6,  status: 'healthy',   history: generateHeartbeatHistory(50, 45, 20), config: { enabled: false, intervalMinutes: 120, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 }, instructions: AGENT_INSTRUCTIONS.patch, log: generateHeartbeatLog(8, 0.04, parseCheckItems(AGENT_INSTRUCTIONS.patch)) },
    };

    var SEED_BOARD_CHAT = [
        { id: uid(), from: 'nexus',    text: 'Good morning team. Sprint priorities: security audit first, then Q2 campaign rollout. @atlas @sentinel status update please.', mentions: ['atlas', 'sentinel'], timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: uid(), from: 'atlas',    text: '@nexus Engineering is on track. Auth flow 65% complete. @nova is handling notification service, @spark finishing API refactor.', mentions: ['nexus', 'nova', 'spark'], timestamp: new Date(Date.now() - 540000).toISOString() },
        { id: uid(), from: 'sentinel', text: '@nexus CISO reporting. Vulnerability assessment in progress. @phantom found 3 medium-severity issues on API gateway. @patch deploying fixes.', mentions: ['nexus', 'phantom', 'patch'], timestamp: new Date(Date.now() - 480000).toISOString() },
        { id: uid(), from: 'ledger',   text: 'Budget update: we are 8% under Q1 forecast. @cipher preparing detailed breakdown for board review.', mentions: ['cipher'], timestamp: new Date(Date.now() - 420000).toISOString() },
        { id: uid(), from: 'phantom',  text: 'Completed API endpoint scan. CVE-2026-1234 flagged. Forwarding to @patch for immediate patching. @sentinel report attached.', mentions: ['patch', 'sentinel'], timestamp: new Date(Date.now() - 360000).toISOString() },
        { id: uid(), from: 'prism',    text: 'Marketing update: Q2 campaign assets finalized. @pixel is uploading to CDN. @echo will push content calendar by EOD.', mentions: ['pixel', 'echo'], timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: uid(), from: 'titan',    text: 'Operations alert: memory usage elevated on cluster-3. @vega monitoring, @flux rerouting traffic. Investigating root cause.', mentions: ['vega', 'flux'], timestamp: new Date(Date.now() - 240000).toISOString() },
        { id: uid(), from: 'nova',     text: 'Notification service WebSocket handler complete. Moving to push notifications. @atlas ready for code review when done.', mentions: ['atlas'], timestamp: new Date(Date.now() - 180000).toISOString() },
        { id: uid(), from: 'patch',    text: 'CVE-2026-1234 patch deployed to staging. Running regression tests. @sentinel requesting approval for production rollout.', mentions: ['sentinel'], timestamp: new Date(Date.now() - 120000).toISOString() },
        { id: uid(), from: 'nexus',    text: '@sentinel approve the patch rollout. @titan keep monitoring cluster-3. Good work everyone.', mentions: ['sentinel', 'titan'], timestamp: new Date(Date.now() - 60000).toISOString() },
        { id: uid(), from: 'cipher',   text: 'Cost analysis complete. Infrastructure spend down 12% MoM. Detailed report sent to @ledger for review.', mentions: ['ledger'], timestamp: new Date(Date.now() - 30000).toISOString() },
        { id: uid(), from: 'sentinel', text: 'Patch approved. @patch proceed with production deployment. @phantom run post-deploy verification scan.', mentions: ['patch', 'phantom'], timestamp: now() },
    ];

    /* ========== SEED ON FIRST LOAD ========== */
    function seed() {
        if (!read(KEYS.agents)) write(KEYS.agents, SEED_AGENTS);
        if (!read(KEYS.tasks)) write(KEYS.tasks, SEED_TASKS);
        if (!read(KEYS.activities)) write(KEYS.activities, SEED_ACTIVITIES);
        if (!read(KEYS.chats)) write(KEYS.chats, SEED_CHATS);
        if (!read(KEYS.memory)) write(KEYS.memory, SEED_MEMORY);
        if (!read(KEYS.settings)) write(KEYS.settings, SEED_SETTINGS);
        if (!read(KEYS.cronJobs)) write(KEYS.cronJobs, SEED_CRON_JOBS);
        if (!read(KEYS.heartbeats)) write(KEYS.heartbeats, SEED_HEARTBEATS);
        if (!read(KEYS.boardChat)) write(KEYS.boardChat, SEED_BOARD_CHAT);
        if (!read(KEYS.skills)) write(KEYS.skills, SEED_SKILLS);
    }

    /* ========== STORE API ========== */
    MC.store = {

        /* --- Agents --- */
        getAgents: function () {
            return read(KEYS.agents) || [];
        },
        getAgent: function (id) {
            return this.getAgents().find(function (a) { return a.id === id; }) || null;
        },
        addAgent: function (data) {
            var agents = this.getAgents();
            var agent = {
                id: data.id || uid(),
                name: data.name,
                model: data.model || 'claude-sonnet-4-6',
                status: data.status || 'standby',
                icon: data.icon || 'zap',
                color: data.color || 'standby',
                role: data.role || 'agent',
                department: data.department || 'engineering',
                parentId: data.parentId || null,
                skills: data.skills || [],
                createdAt: now(),
            };
            agents.push(agent);
            write(KEYS.agents, agents);
            this.log(agent.name, 'created', 'New agent registered: ' + agent.name, 'normal');
            return agent;
        },
        updateAgent: function (id, data) {
            var agents = this.getAgents();
            var idx = agents.findIndex(function (a) { return a.id === id; });
            if (idx === -1) return null;
            Object.assign(agents[idx], data);
            write(KEYS.agents, agents);
            this.log(agents[idx].name, 'updated', 'Agent configuration changed', 'standby');
            return agents[idx];
        },
        deleteAgent: function (id) {
            var agents = this.getAgents();
            var agent = agents.find(function (a) { return a.id === id; });
            if (!agent) return false;
            write(KEYS.agents, agents.filter(function (a) { return a.id !== id; }));
            this.log(agent.name, 'deleted', 'Agent removed from fleet', 'caution');
            return true;
        },

        /* --- Tasks --- */
        getTasks: function () {
            return read(KEYS.tasks) || [];
        },
        getTask: function (id) {
            return this.getTasks().find(function (t) { return t.id === id; }) || null;
        },
        addTask: function (data) {
            var tasks = this.getTasks();
            var task = {
                id: data.id || uid(),
                title: data.title,
                description: data.description || '',
                priority: data.priority || 'medium',
                agentId: data.agentId || null,
                column: data.column || 'inbox',
                createdAt: now(),
                updatedAt: now(),
            };
            tasks.unshift(task);
            write(KEYS.tasks, tasks);
            this.log('System', 'task-created', 'New task: ' + task.title, 'standby');
            return task;
        },
        updateTask: function (id, data) {
            var tasks = this.getTasks();
            var idx = tasks.findIndex(function (t) { return t.id === id; });
            if (idx === -1) return null;
            data.updatedAt = now();
            Object.assign(tasks[idx], data);
            write(KEYS.tasks, tasks);
            return tasks[idx];
        },
        deleteTask: function (id) {
            var tasks = this.getTasks();
            var task = tasks.find(function (t) { return t.id === id; });
            if (!task) return false;
            write(KEYS.tasks, tasks.filter(function (t) { return t.id !== id; }));
            this.log('System', 'task-deleted', 'Task removed: ' + task.title, 'caution');
            return true;
        },
        addTaskComment: function (taskId, text) {
            var tasks = this.getTasks();
            var idx = tasks.findIndex(function (t) { return t.id === taskId; });
            if (idx === -1) return null;
            if (!tasks[idx].comments) tasks[idx].comments = [];
            var comment = { id: uid(), text: text, timestamp: now() };
            tasks[idx].comments.push(comment);
            write(KEYS.tasks, tasks);
            return comment;
        },
        getTaskComments: function (taskId) {
            var task = this.getTask(taskId);
            return (task && task.comments) ? task.comments : [];
        },

        moveTask: function (id, column) {
            var task = this.updateTask(id, { column: column });
            if (task) {
                this.log('System', 'task-moved', task.title + ' moved to ' + column, 'standby');
            }
            return task;
        },

        /* --- Activities --- */
        getActivities: function () {
            return read(KEYS.activities) || [];
        },
        clearActivities: function () {
            write(KEYS.activities, []);
        },
        log: function (agent, action, detail, type) {
            var activities = this.getActivities();
            activities.unshift({
                id: uid(),
                agent: agent,
                action: action,
                detail: detail,
                type: type || 'standby',
                timestamp: now(),
            });
            if (activities.length > 200) activities = activities.slice(0, 200);
            write(KEYS.activities, activities);
        },

        /* --- Chats --- */
        getChats: function () {
            return read(KEYS.chats) || {};
        },
        getChat: function (agentId) {
            var chats = this.getChats();
            return chats[agentId] || [];
        },
        addChatMessage: function (agentId, from, text) {
            var chats = this.getChats();
            if (!chats[agentId]) chats[agentId] = [];
            chats[agentId].push({ from: from, text: text, timestamp: now() });
            write(KEYS.chats, chats);
        },

        /* --- Memory --- */
        getMemory: function () {
            return read(KEYS.memory) || {};
        },
        getAgentMemory: function (agentId) {
            var memory = this.getMemory();
            return memory[agentId] || [];
        },
        addMemoryEntry: function (agentId, key, value) {
            var memory = this.getMemory();
            if (!memory[agentId]) memory[agentId] = [];
            var entry = { id: uid(), key: key, value: value, createdAt: now(), updatedAt: now() };
            memory[agentId].push(entry);
            write(KEYS.memory, memory);
            var agent = this.getAgent(agentId);
            this.log(agent ? agent.name : agentId, 'memory-add', 'Added memory: ' + key, 'standby');
            return entry;
        },
        updateMemoryEntry: function (agentId, entryId, key, value) {
            var memory = this.getMemory();
            if (!memory[agentId]) return null;
            var entry = memory[agentId].find(function (e) { return e.id === entryId; });
            if (!entry) return null;
            entry.key = key;
            entry.value = value;
            entry.updatedAt = now();
            write(KEYS.memory, memory);
            var agent = this.getAgent(agentId);
            this.log(agent ? agent.name : agentId, 'memory-update', 'Updated memory: ' + key, 'standby');
            return entry;
        },
        deleteMemoryEntry: function (agentId, entryId) {
            var memory = this.getMemory();
            if (!memory[agentId]) return false;
            memory[agentId] = memory[agentId].filter(function (e) { return e.id !== entryId; });
            write(KEYS.memory, memory);
            var agent = this.getAgent(agentId);
            this.log(agent ? agent.name : agentId, 'memory-delete', 'Memory entry removed', 'caution');
            return true;
        },

        /* --- Cron Jobs --- */
        getCronJobs: function () {
            return read(KEYS.cronJobs) || [];
        },
        getCronJob: function (id) {
            return this.getCronJobs().find(function (j) { return j.id === id; }) || null;
        },
        addCronJob: function (data) {
            var jobs = this.getCronJobs();
            var job = {
                id: data.id || uid(),
                name: data.name,
                schedule: data.schedule || '0 * * * *',
                agentId: data.agentId || null,
                action: data.action || '',
                enabled: data.enabled !== false,
                lastRun: null,
                lastStatus: null,
                createdAt: now(),
                updatedAt: now(),
            };
            jobs.push(job);
            write(KEYS.cronJobs, jobs);
            this.log('System', 'cron-created', 'New cron job: ' + job.name, 'standby');
            return job;
        },
        updateCronJob: function (id, data) {
            var jobs = this.getCronJobs();
            var idx = jobs.findIndex(function (j) { return j.id === id; });
            if (idx === -1) return null;
            data.updatedAt = now();
            Object.assign(jobs[idx], data);
            write(KEYS.cronJobs, jobs);
            return jobs[idx];
        },
        deleteCronJob: function (id) {
            var jobs = this.getCronJobs();
            var job = jobs.find(function (j) { return j.id === id; });
            if (!job) return false;
            write(KEYS.cronJobs, jobs.filter(function (j) { return j.id !== id; }));
            this.log('System', 'cron-deleted', 'Cron job removed: ' + job.name, 'caution');
            return true;
        },
        runCronJob: function (id) {
            var job = this.getCronJob(id);
            if (!job) return null;
            var success = Math.random() < 0.85;
            var status = success ? 'success' : 'failure';
            this.updateCronJob(id, { lastRun: now(), lastStatus: status });
            var agent = this.getAgent(job.agentId);
            var agentName = agent ? agent.name : 'System';
            this.log(agentName, 'cron-run', job.name + ' — ' + status, success ? 'normal' : 'critical');
            return { success: success, status: status };
        },

        /* --- Heartbeats --- */
        getHeartbeats: function () {
            return read(KEYS.heartbeats) || {};
        },
        getAgentHeartbeat: function (agentId) {
            var hb = this.getHeartbeats();
            return hb[agentId] || null;
        },
        updateHeartbeat: function (agentId, data) {
            var hb = this.getHeartbeats();
            if (!hb[agentId]) {
                hb[agentId] = { lastSeen: now(), latency: 0, uptime: 0, status: 'offline', history: [] };
            }
            Object.assign(hb[agentId], data);
            if (data.latency !== undefined && data.status) {
                hb[agentId].history.push({
                    timestamp: now(),
                    latency: data.latency,
                    status: data.status,
                });
                if (hb[agentId].history.length > 50) {
                    hb[agentId].history = hb[agentId].history.slice(-50);
                }
            }
            write(KEYS.heartbeats, hb);
            return hb[agentId];
        },
        getHeartbeatConfig: function (agentId) {
            var hb = this.getAgentHeartbeat(agentId);
            var defaults = { enabled: true, intervalMinutes: 30, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 };
            return (hb && hb.config) ? hb.config : defaults;
        },
        updateHeartbeatConfig: function (agentId, configData) {
            var hb = this.getHeartbeats();
            if (!hb[agentId]) return null;
            if (!hb[agentId].config) {
                hb[agentId].config = { enabled: true, intervalMinutes: 30, activeHoursEnabled: false, activeHoursStart: 9, activeHoursEnd: 17 };
            }
            Object.assign(hb[agentId].config, configData);
            write(KEYS.heartbeats, hb);
            return hb[agentId].config;
        },
        updateHeartbeatInstructions: function (agentId, instructions) {
            var hb = this.getHeartbeats();
            if (!hb[agentId]) return null;
            hb[agentId].instructions = instructions;
            write(KEYS.heartbeats, hb);
            return instructions;
        },
        getHeartbeatLog: function (agentId) {
            var hb = this.getAgentHeartbeat(agentId);
            return (hb && hb.log) ? hb.log : [];
        },
        addHeartbeatLogEntry: function (agentId, entry) {
            var hb = this.getHeartbeats();
            if (!hb[agentId]) return null;
            if (!hb[agentId].log) hb[agentId].log = [];
            entry.id = entry.id || uid();
            entry.timestamp = entry.timestamp || now();
            hb[agentId].log.push(entry);
            if (hb[agentId].log.length > 100) {
                hb[agentId].log = hb[agentId].log.slice(-100);
            }
            write(KEYS.heartbeats, hb);
            return entry;
        },

        /* --- Agent Hierarchy Helpers --- */
        getAgentsByDepartment: function (dept) {
            return this.getAgents().filter(function (a) { return a.department === dept; });
        },
        getSubAgents: function (parentId) {
            return this.getAgents().filter(function (a) { return a.parentId === parentId; });
        },
        getDepartmentHeads: function () {
            return this.getAgents().filter(function (a) { return a.role === 'department-head'; });
        },
        getCEO: function () {
            return this.getAgents().find(function (a) { return a.role === 'ceo'; }) || null;
        },
        getAgentsGrouped: function () {
            var agents = this.getAgents();
            var deptOrder = ['executive', 'engineering', 'finance', 'marketing', 'operations', 'cybersecurity'];
            var groups = {};
            for (var i = 0; i < deptOrder.length; i++) {
                groups[deptOrder[i]] = [];
            }
            for (var j = 0; j < agents.length; j++) {
                var dept = agents[j].department || 'engineering';
                if (!groups[dept]) groups[dept] = [];
                groups[dept].push(agents[j]);
            }
            return { order: deptOrder, groups: groups };
        },

        /* --- Board Chat --- */
        getBoardChat: function () {
            return read(KEYS.boardChat) || [];
        },
        addBoardMessage: function (fromAgentId, text, mentions) {
            var messages = this.getBoardChat();
            var msg = {
                id: uid(),
                from: fromAgentId,
                text: text,
                mentions: mentions || [],
                timestamp: now(),
            };
            messages.push(msg);
            if (messages.length > 100) messages = messages.slice(-100);
            write(KEYS.boardChat, messages);
            return msg;
        },
        clearBoardChat: function () {
            write(KEYS.boardChat, []);
        },

        /* --- Skills --- */
        getSkills: function () {
            return read(KEYS.skills) || [];
        },
        getSkill: function (id) {
            return this.getSkills().find(function (s) { return s.id === id; }) || null;
        },
        addSkill: function (data) {
            var skills = this.getSkills();
            var skill = {
                id: data.id || uid(),
                name: data.name,
                icon: data.icon || 'search-code',
                description: data.description || '',
                instructions: data.instructions || '',
                createdAt: now(),
            };
            skills.push(skill);
            write(KEYS.skills, skills);
            this.log('System', 'skill-created', 'New skill: ' + skill.name, 'standby');
            return skill;
        },
        updateSkill: function (id, data) {
            var skills = this.getSkills();
            var idx = skills.findIndex(function (s) { return s.id === id; });
            if (idx === -1) return null;
            Object.assign(skills[idx], data);
            write(KEYS.skills, skills);
            return skills[idx];
        },
        deleteSkill: function (id) {
            var skills = this.getSkills();
            var skill = skills.find(function (s) { return s.id === id; });
            if (!skill) return false;
            write(KEYS.skills, skills.filter(function (s) { return s.id !== id; }));
            /* Strip this skill from all agents */
            var agents = this.getAgents();
            var changed = false;
            for (var i = 0; i < agents.length; i++) {
                if (agents[i].skills && agents[i].skills.indexOf(id) !== -1) {
                    agents[i].skills = agents[i].skills.filter(function (sid) { return sid !== id; });
                    changed = true;
                }
            }
            if (changed) write(KEYS.agents, agents);
            this.log('System', 'skill-deleted', 'Skill removed: ' + skill.name, 'caution');
            return true;
        },
        getSkillAgentCount: function (skillId) {
            var agents = this.getAgents();
            var count = 0;
            for (var i = 0; i < agents.length; i++) {
                if (agents[i].skills && agents[i].skills.indexOf(skillId) !== -1) count++;
            }
            return count;
        },

        /* --- Settings --- */
        getSettings: function () {
            return read(KEYS.settings) || SEED_SETTINGS;
        },
        updateSettings: function (data) {
            var settings = this.getSettings();
            Object.assign(settings, data);
            write(KEYS.settings, settings);
            return settings;
        },

        /* --- Data Management --- */
        exportAll: function () {
            return {
                agents: this.getAgents(),
                tasks: this.getTasks(),
                activities: this.getActivities(),
                chats: this.getChats(),
                memory: this.getMemory(),
                settings: this.getSettings(),
                cronJobs: this.getCronJobs(),
                heartbeats: this.getHeartbeats(),
                boardChat: this.getBoardChat(),
                skills: this.getSkills(),
                exportedAt: now(),
            };
        },
        importAll: function (data) {
            if (data.agents) write(KEYS.agents, data.agents);
            if (data.tasks) write(KEYS.tasks, data.tasks);
            if (data.activities) write(KEYS.activities, data.activities);
            if (data.chats) write(KEYS.chats, data.chats);
            if (data.memory) write(KEYS.memory, data.memory);
            if (data.settings) write(KEYS.settings, data.settings);
            if (data.cronJobs) write(KEYS.cronJobs, data.cronJobs);
            if (data.heartbeats) write(KEYS.heartbeats, data.heartbeats);
            if (data.boardChat) write(KEYS.boardChat, data.boardChat);
            if (data.skills) write(KEYS.skills, data.skills);
        },
        resetAll: function () {
            Object.values(KEYS).forEach(function (k) { localStorage.removeItem(k); });
            seed();
        },
    };

    /* ========== SHARED HELPERS ========== */
    MC.buildAgentOptgroups = function (selectedId, includeUnassigned) {
        var grouped = MC.store.getAgentsGrouped();
        var html = '';
        if (includeUnassigned) {
            html += '<option value="">Unassigned</option>';
        }
        for (var i = 0; i < grouped.order.length; i++) {
            var dept = grouped.order[i];
            var agents = grouped.groups[dept];
            if (!agents || agents.length === 0) continue;
            var deptInfo = MC.DEPARTMENTS[dept] || { label: dept };
            html += '<optgroup label="' + deptInfo.label + '">';
            for (var j = 0; j < agents.length; j++) {
                var a = agents[j];
                var roleLabel = MC.ROLE_TITLES[a.id] ? ' (' + MC.ROLE_TITLES[a.id] + ')' : '';
                var sel = (selectedId === a.id) ? ' selected' : '';
                html += '<option value="' + a.id + '"' + sel + '>' + a.name + roleLabel + '</option>';
            }
            html += '</optgroup>';
        }
        return html;
    };

    MC.parseCheckItems = parseCheckItems;

    MC.getRoleBadgeHtml = function (agent) {
        if (!agent) return '';
        var title = MC.ROLE_TITLES[agent.id];
        if (title) {
            var cls = agent.role === 'ceo' ? 'role-badge-ceo' : 'role-badge-head';
            return '<span class="role-badge ' + cls + '">' + title + '</span>';
        }
        if (agent.role === 'agent') {
            return '<span class="role-badge role-badge-agent">AGENT</span>';
        }
        return '';
    };

    /* Returns array of model ID strings (built-in + custom) */
    MC.getAllModels = function () {
        var settings = MC.store.getSettings();
        var custom = settings.customModels || [];
        var all = BUILT_IN_MODELS.slice();
        for (var i = 0; i < custom.length; i++) {
            var id = typeof custom[i] === 'object' ? custom[i].id : custom[i];
            if (all.indexOf(id) === -1) all.push(id);
        }
        return all;
    };

    /* Returns display name for any model ID */
    MC.getModelDisplayName = function (modelId) {
        if (BUILT_IN_MODEL_NAMES[modelId]) return BUILT_IN_MODEL_NAMES[modelId];
        var settings = MC.store.getSettings();
        var custom = settings.customModels || [];
        for (var i = 0; i < custom.length; i++) {
            var entry = custom[i];
            if (typeof entry === 'object' && entry.id === modelId) return entry.name;
        }
        return modelId;
    };

    MC.isBuiltInModel = function (modelId) {
        return BUILT_IN_MODELS.indexOf(modelId) !== -1;
    };

    MC.getModelColor = function (modelId) {
        return MC.MODEL_COLORS[modelId] || '#9ca3af';
    };

    /* Initialize seed data */
    seed();

})();
