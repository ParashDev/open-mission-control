# Open Mission Control

A simulated AI agent command center built as a single-page dashboard. Monitor, manage, and orchestrate a team of AI agents across departments — all running in the browser with localStorage persistence.

## Features

- **Dashboard** — Real-time overview of agent status, task pipeline, and activity feed
- **Agents** — 15 agents organized across 6 departments (Executive, Engineering, Finance, Marketing, Operations, Cybersecurity) with an org hierarchy
- **Tasks** — Kanban board with drag-and-drop, priority levels, and agent assignment
- **Heartbeat** — OpenClaw-pattern heartbeat monitoring with configurable intervals, checklist-based cycles, and execution logs
- **Chat** — Per-agent chat interface with simulated responses
- **Board Chat** — Team-wide communication channel with @mentions
- **Activity Feed** — Chronological log of all agent actions and system events
- **Cron Jobs** — Scheduled task management with status tracking
- **Skills** — Agent capability system with detailed instruction sets
- **Memory** — Per-agent key-value memory store
- **System** — Settings, data export/import, and factory reset

## Tech Stack

- Vanilla HTML, CSS, JavaScript — no build step, no frameworks
- Tailwind CSS via CDN
- Lucide Icons via CDN
- Google Fonts (Inter + JetBrains Mono)
- localStorage for all data persistence

## Getting Started

1. Clone the repo
2. Open `index.html` in a browser
3. That's it — no install, no build, no server needed

All seed data is generated on first load. Use **System > Reset All Data** to restore defaults at any time.

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
│   ├── store.js        # localStorage CRUD + seed data
│   ├── shared.js       # Bootstrap & scroll-reveal
│   ├── sidebar.js      # Navigation sidebar
│   ├── header.js       # Page header
│   ├── theme.js        # Light/dark theme toggle
│   ├── clock.js        # Mission clock
│   ├── dashboard.js    # Dashboard page
│   ├── agents.js       # Agents page
│   ├── tasks.js        # Tasks page
│   ├── heartbeat.js    # Heartbeat page
│   ├── chat.js         # Chat page
│   ├── board-chat.js   # Board chat page
│   ├── activity.js     # Activity page
│   ├── cron-jobs.js    # Cron jobs page
│   ├── skills.js       # Skills page
│   ├── memory.js       # Memory page
│   └── system.js       # System page
└── styles/
    └── custom.css      # Custom animations & components
```

## License

MIT
