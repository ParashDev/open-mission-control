# Open Mission Control

A free, open-source mission control UI for AI agent orchestration. Built to work with [OpenClaw](https://github.com/openclaw) or any AI agent framework of your choice.

## What is this?

This is the **frontend** — a fully functional command center UI with dashboards, agent management, task boards, heartbeat monitoring, chat, and more. Everything runs in the browser with simulated data out of the box so you can see exactly how it works.

The idea is simple: **take this UI, feed it to OpenClaw (or Claude, or any AI coding agent), and let it build the real backend for you.** You choose the stack — Node, Python, Go, whatever. You choose the database — Postgres, Supabase, Firebase. You choose the agent framework — OpenClaw, CrewAI, AutoGen, or your own. This UI gives you the complete interface layer so you're not starting from scratch.

## Live Demo

**[openclaw-mission-control.dplooy.com](https://openclaw-mission-control.dplooy.com)**

No sign-up, no install — just open it and explore. Everything runs in your browser.

## How to use it

### 1. Try it locally
Clone this repo, open `index.html` in a browser. That's it — no install, no build, no server. Everything works with localStorage and simulated agents so you can explore every feature.

### 2. Build your backend
Point your AI coding tool at this codebase and tell it what you want:
- *"Connect this to a real Supabase backend"*
- *"Replace the localStorage store with a REST API"*
- *"Wire up the heartbeat system to real agent health checks"*
- *"Make the chat work with OpenClaw agents"*

The UI is vanilla HTML/JS with a clean `store.js` data layer — easy for any AI tool to understand and extend.

### 3. Make it yours
Add agents, remove departments, change the org structure, swap the theme. Everything is in plain files, no framework lock-in.

## What's included

| Page | What it does |
|------|-------------|
| **Dashboard** | Real-time overview — agent status, task pipeline, activity feed, heartbeat alerts |
| **Agents** | 15 agents across 6 departments with org hierarchy, status, and skill assignments |
| **Tasks** | Kanban board with drag-and-drop, priorities, and agent assignment |
| **Heartbeat** | OpenClaw-pattern heartbeat monitoring — configurable intervals, checklist cycles, execution logs |
| **Chat** | Per-agent chat interface |
| **Board Chat** | Team-wide channel with @mentions |
| **Activity** | Chronological log of all agent actions and system events |
| **Cron Jobs** | Scheduled task management with status tracking |
| **Skills** | Agent capability system with detailed instruction sets |
| **Memory** | Per-agent key-value memory store |
| **System** | Settings, theme toggle, data export/import, factory reset |

## Tech Stack

- Vanilla HTML, CSS, JavaScript — no build step, no frameworks, no dependencies to install
- Tailwind CSS via CDN
- Lucide Icons via CDN
- Google Fonts (Inter + JetBrains Mono)
- localStorage for data persistence (replace with your own backend)

## Project Structure

```
├── index.html          # Dashboard
├── agents.html         # Agent management
├── tasks.html          # Kanban board
├── heartbeat.html      # Heartbeat monitoring
├── chat.html           # Agent chat
├── activity.html       # Activity feed
├── cron-jobs.html      # Scheduled jobs
├── skills.html         # Agent skills
├── memory.html         # Agent memory
├── system.html         # Settings & data
├── scripts/
│   ├── store.js        # Data layer — localStorage CRUD + seed data (swap this for your API)
│   ├── shared.js       # Bootstrap & scroll-reveal
│   ├── sidebar.js      # Navigation sidebar
│   ├── header.js       # Page header
│   ├── theme.js        # Light/dark theme toggle
│   ├── clock.js        # Mission clock
│   └── [page].js       # One script per page
└── styles/
    └── custom.css      # Custom animations & components
```

## License

MIT — use it however you want.
