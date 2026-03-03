/* ========== HEARTBEAT MONITORING PAGE — OpenClaw Pattern ========== */
(function () {
    'use strict';

    /* ---------- State ---------- */
    var expandedAgent = null;
    var activeTab = {};          // agentId → 'log' | 'config'
    var expandedLogEntry = {};   // agentId → logEntryId
    var searchQuery = '';
    var filterMode = 'all';      // all | enabled | disabled | alerts
    var healthInterval = null;
    var cycleInterval = null;
    var lastCycleCheck = {};      // agentId → Date.now() of last simulated cycle
    var modalAgentId = null;

    /* ---------- Helpers ---------- */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    var STATUS_MAP = {
        healthy:   { label: 'Healthy',   color: 'status-normal',   glow: 'glow-normal' },
        degraded:  { label: 'Degraded',  color: 'status-serious',  glow: 'glow-serious' },
        unhealthy: { label: 'Unhealthy', color: 'status-critical', glow: 'glow-critical' },
        offline:   { label: 'Offline',   color: 'status-off',      glow: '' },
    };

    function timeAgo(isoStr) {
        if (!isoStr) return 'Unknown';
        var diff = Date.now() - new Date(isoStr).getTime();
        if (diff < 0) diff = 0;
        if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
    }

    function latencyColor(ms) {
        if (ms === 0) return 'status-off';
        if (ms < 80) return 'status-normal';
        if (ms < 200) return 'status-standby';
        if (ms < 350) return 'status-serious';
        return 'status-critical';
    }

    function formatInterval(mins) {
        if (mins < 60) return mins + 'm';
        if (mins < 1440) return (mins / 60) + 'h';
        return (mins / 1440) + 'd';
    }

    function formatTime(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        var h = d.getHours();
        var m = d.getMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }

    function formatDateTime(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        var mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
        return mon + ' ' + d.getDate() + ', ' + formatTime(isoStr);
    }

    /* ---------- Compute summary stats ---------- */
    function computeStats(agents, heartbeats) {
        var enabledCount = 0, totalCount = agents.length;
        var okCycles = 0, alertCycles = 0;
        var totalLatency = 0, latencyCount = 0;
        var cutoff = Date.now() - 86400000;

        for (var i = 0; i < agents.length; i++) {
            var hb = heartbeats[agents[i].id];
            if (!hb) continue;
            var cfg = hb.config || {};
            if (cfg.enabled !== false) enabledCount++;
            if (hb.status !== 'offline') { totalLatency += hb.latency; latencyCount++; }

            var log = hb.log || [];
            for (var li = 0; li < log.length; li++) {
                if (new Date(log[li].timestamp).getTime() > cutoff) {
                    if (log[li].result === 'ok') okCycles++;
                    else alertCycles++;
                }
            }
        }
        return {
            enabled: enabledCount,
            total: totalCount,
            okCycles: okCycles,
            alertCycles: alertCycles,
            avgLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
        };
    }

    /* ---------- Update stat card values in-place ---------- */
    function updateStats() {
        var agents = MC.store.getAgents();
        var heartbeats = MC.store.getHeartbeats();
        var stats = computeStats(agents, heartbeats);
        var el;
        el = document.getElementById('stat-active');
        if (el) el.textContent = stats.enabled + '/' + stats.total;
        el = document.getElementById('stat-ok');
        if (el) el.textContent = String(stats.okCycles);
        el = document.getElementById('stat-alerts');
        if (el) el.textContent = String(stats.alertCycles);
        el = document.getElementById('stat-latency');
        if (el) el.textContent = stats.avgLatency + 'ms';
    }

    /* ---------- Filter agents ---------- */
    function filterAgents(agents, heartbeats) {
        return agents.filter(function (agent) {
            var hb = heartbeats[agent.id] || {};
            var cfg = hb.config || {};
            if (searchQuery && agent.name.toLowerCase().indexOf(searchQuery.toLowerCase()) === -1) return false;
            if (filterMode === 'enabled' && cfg.enabled === false) return false;
            if (filterMode === 'disabled' && cfg.enabled !== false) return false;
            if (filterMode === 'alerts') {
                var log = hb.log || [];
                var hasRecent = false;
                var cutoff = Date.now() - 86400000;
                for (var i = 0; i < log.length; i++) {
                    if (log[i].result === 'alert' && new Date(log[i].timestamp).getTime() > cutoff) { hasRecent = true; break; }
                }
                if (!hasRecent) return false;
            }
            return true;
        });
    }

    /* ========== ZONE 1 — Summary Stats ========== */
    function renderStats(stats) {
        var cards = [
            { id: 'stat-active',  icon: 'heart-pulse',  label: 'Active Heartbeats', value: stats.enabled + '/' + stats.total, color: 'status-normal' },
            { id: 'stat-ok',      icon: 'check-circle', label: 'OK Cycles (24h)',    value: String(stats.okCycles),            color: 'status-standby' },
            { id: 'stat-alerts',  icon: 'bell-ring',    label: 'Alerts (24h)',       value: String(stats.alertCycles),          color: stats.alertCycles > 0 ? 'status-critical' : 'status-normal' },
            { id: 'stat-latency', icon: 'gauge',        label: 'Avg Latency',        value: stats.avgLatency + 'ms',           color: latencyColor(stats.avgLatency) },
        ];
        var html = '<div id="hb-stats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 reveal">';
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            html += '<div class="rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border p-4">' +
                '<div class="flex items-center gap-2 mb-2">' +
                    '<div class="w-8 h-8 rounded-lg bg-' + c.color + '/10 flex items-center justify-center">' +
                        '<i data-lucide="' + c.icon + '" class="w-4 h-4 text-' + c.color + '"></i>' +
                    '</div>' +
                    '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-500">' + c.label + '</span>' +
                '</div>' +
                '<div id="' + c.id + '" class="font-mono text-xl font-bold tabular-nums text-' + c.color + '">' + c.value + '</div>' +
            '</div>';
        }
        html += '</div>';
        return html;
    }

    /* ========== ZONE 2 — Toolbar ========== */
    function renderToolbar() {
        return '<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5 reveal">' +
            '<div class="relative flex-1">' +
                '<i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"></i>' +
                '<input id="hb-search" type="text" placeholder="Search agents..." value="' + escapeHtml(searchQuery) + '" ' +
                    'class="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border font-mono text-[12px] text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-status-standby/50">' +
            '</div>' +
            '<select id="hb-filter" class="px-3 py-2 rounded-xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border font-mono text-[12px] text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer">' +
                '<option value="all"' + (filterMode === 'all' ? ' selected' : '') + '>All Agents</option>' +
                '<option value="enabled"' + (filterMode === 'enabled' ? ' selected' : '') + '>Enabled</option>' +
                '<option value="disabled"' + (filterMode === 'disabled' ? ' selected' : '') + '>Disabled</option>' +
                '<option value="alerts"' + (filterMode === 'alerts' ? ' selected' : '') + '>Alerts Only</option>' +
            '</select>' +
            '<button id="hb-run-all" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-status-standby/10 hover:bg-status-standby/20 border border-status-standby/20 font-mono text-[11px] font-semibold text-status-standby transition-colors whitespace-nowrap">' +
                '<i data-lucide="play" class="w-3.5 h-3.5"></i>Run All Now' +
            '</button>' +
        '</div>';
    }

    /* ========== ZONE 3 — Agent Cards ========== */
    function renderCard(agent, beat) {
        var sm = STATUS_MAP[beat.status] || STATUS_MAP.offline;
        var cfg = beat.config || {};
        var isEnabled = cfg.enabled !== false;
        var isExpanded = expandedAgent === agent.id;
        var uptimeWidth = Math.min(100, Math.max(0, beat.uptime));
        var tab = activeTab[agent.id] || 'config';
        var deptInfo = MC.DEPARTMENTS[agent.department] || { label: agent.department || '' };
        var roleBadge = MC.getRoleBadgeHtml(agent);

        var agentColorMap = {
            standby: 'bg-status-standby/10 text-status-standby',
            normal: 'bg-status-normal/10 text-status-normal',
            serious: 'bg-status-serious/10 text-status-serious',
            caution: 'bg-status-caution/10 text-status-caution',
            critical: 'bg-status-critical/10 text-status-critical',
            off: 'bg-neutral-500/10 text-neutral-500',
        };
        var agentCls = agentColorMap[agent.color] || agentColorMap.standby;

        var log = beat.log || [];
        var lastLog = log.length > 0 ? log[log.length - 1] : null;
        var lastResultBadge = '';
        if (lastLog) {
            var rc = lastLog.result === 'ok' ? 'status-normal' : 'status-critical';
            lastResultBadge = '<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-' + rc + '/10 text-' + rc + '">' + lastLog.result.toUpperCase() + '</span>';
        }

        var html = '<div class="hb-card rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border overflow-hidden transition-all duration-200" data-agent-id="' + agent.id + '">';

        html += '<div class="p-4 cursor-pointer heartbeat-card-header" data-agent-id="' + agent.id + '">' +
            '<div class="flex items-center justify-between mb-3">' +
                '<div class="flex items-center gap-3 min-w-0">' +
                    '<div class="agent-icon-box ' + agentCls + '">' +
                        '<i data-lucide="' + (agent.icon || 'zap') + '" class="w-[18px] h-[18px]"></i>' +
                    '</div>' +
                    '<div class="min-w-0">' +
                        '<div class="flex items-center gap-2 flex-wrap">' +
                            '<span class="font-mono text-[13px] font-semibold truncate">' + escapeHtml(agent.name) + '</span>' +
                            roleBadge +
                        '</div>' +
                        '<div class="font-mono text-[10px] text-neutral-500 truncate">' + deptInfo.label + ' &middot; ' + agent.model + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2 flex-shrink-0 ml-2">' +
                    '<div class="hb-toggle mc-toggle' + (isEnabled ? ' active' : '') + '" data-agent-id="' + agent.id + '" title="' + (isEnabled ? 'Enabled' : 'Disabled') + '"></div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center gap-3 mb-3 flex-wrap">' +
                '<div class="flex items-center gap-1.5">' +
                    '<i data-lucide="clock" class="w-3 h-3 text-neutral-500"></i>' +
                    '<span class="hb-last-seen font-mono text-[11px] text-neutral-400">' + timeAgo(beat.lastSeen) + '</span>' +
                '</div>' +
                '<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-mc-hover text-neutral-500">' + formatInterval(cfg.intervalMinutes || 30) + '</span>' +
                lastResultBadge +
                '<div class="flex items-center gap-2 ml-auto">' +
                    '<span class="hb-status-dot w-2.5 h-2.5 rounded-full bg-' + sm.color + (beat.status !== 'offline' ? ' heartbeat-pulse' : '') + ' ' + sm.glow + '"></span>' +
                    '<span class="hb-status-label font-mono text-[10px] text-' + sm.color + '">' + sm.label + '</span>' +
                '</div>' +
            '</div>' +
            '<div>' +
                '<div class="flex items-center justify-between mb-1">' +
                    '<span class="font-mono text-[10px] text-neutral-500">Uptime</span>' +
                    '<span class="hb-uptime-pct font-mono text-[10px] tabular-nums text-neutral-400">' + beat.uptime.toFixed(1) + '%</span>' +
                '</div>' +
                '<div class="h-1.5 rounded-full bg-neutral-200 dark:bg-mc-hover overflow-hidden">' +
                    '<div class="hb-uptime-bar h-full rounded-full bg-' + sm.color + ' transition-all duration-500" style="width:' + uptimeWidth + '%"></div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center justify-center mt-2">' +
                '<i data-lucide="' + (isExpanded ? 'chevron-up' : 'chevron-down') + '" class="w-3.5 h-3.5 text-neutral-400"></i>' +
            '</div>' +
        '</div>';

        if (isExpanded) {
            html += renderExpandedPanel(agent, beat, tab);
        }

        html += '</div>';
        return html;
    }

    /* --- Expanded panel (tabs + content) --- */
    function renderExpandedPanel(agent, beat, tab) {
        var html = '<div class="hb-expanded border-t border-neutral-200 dark:border-mc-border">';
        html += '<div class="flex border-b border-neutral-200 dark:border-mc-border">' +
            '<button class="hb-tab flex-1 py-2.5 font-mono text-[11px] font-semibold text-center transition-colors ' +
                (tab === 'config' ? 'text-status-standby border-b-2 border-status-standby' : 'text-neutral-400 hover:text-neutral-300') + '" data-agent-id="' + agent.id + '" data-tab="config">Config</button>' +
            '<button class="hb-tab flex-1 py-2.5 font-mono text-[11px] font-semibold text-center transition-colors ' +
                (tab === 'log' ? 'text-status-standby border-b-2 border-status-standby' : 'text-neutral-400 hover:text-neutral-300') + '" data-agent-id="' + agent.id + '" data-tab="log">Log</button>' +
        '</div>';
        html += '<div class="hb-tab-content">';
        if (tab === 'log') {
            html += renderLogTab(agent, beat);
        } else {
            html += renderConfigTab(agent, beat);
        }
        html += '</div></div>';
        return html;
    }

    /* --- Log Tab --- */
    function renderLogTab(agent, beat) {
        var log = (beat.log || []).slice().reverse();
        var html = '<div class="px-4 py-3">' +
            '<div class="max-h-64 overflow-y-auto mc-scroll space-y-1">';

        if (log.length === 0) {
            html += '<div class="text-center font-mono text-[11px] text-neutral-500 py-4">No log entries</div>';
        }

        for (var i = 0; i < Math.min(log.length, 50); i++) {
            var entry = log[i];
            var isAlert = entry.result === 'alert';
            var isExpandedLog = expandedLogEntry[agent.id] === entry.id;
            var iconName = isAlert ? 'alert-triangle' : 'check-circle';
            var entryColor = isAlert ? 'status-critical' : 'status-normal';
            var bgTint = isAlert ? 'bg-status-critical/5' : '';

            html += '<div class="rounded-lg overflow-hidden ' + bgTint + '">' +
                '<div class="hb-log-row flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors" data-agent-id="' + agent.id + '" data-log-id="' + entry.id + '">' +
                    '<i data-lucide="' + iconName + '" class="w-3.5 h-3.5 text-' + entryColor + ' flex-shrink-0"></i>' +
                    '<span class="font-mono text-[10px] text-neutral-400 tabular-nums flex-shrink-0">' + formatTime(entry.timestamp) + '</span>' +
                    '<span class="font-mono text-[10px] text-neutral-300 dark:text-neutral-500 truncate flex-1">' + escapeHtml(entry.summary) + '</span>' +
                    '<span class="font-mono text-[9px] px-1 py-0.5 rounded bg-neutral-100 dark:bg-mc-hover text-neutral-500 tabular-nums flex-shrink-0">' + entry.latency + 'ms</span>' +
                    '<i data-lucide="' + (isExpandedLog ? 'chevron-up' : 'chevron-down') + '" class="w-3 h-3 text-neutral-400 flex-shrink-0"></i>' +
                '</div>';

            if (isExpandedLog && entry.checkedItems) {
                html += '<div class="px-3 pb-2 pt-1 space-y-0.5">';
                for (var ci = 0; ci < entry.checkedItems.length; ci++) {
                    var item = entry.checkedItems[ci];
                    var passIcon = item.passed ? 'check' : 'x';
                    var passColor = item.passed ? 'text-status-normal' : 'text-status-critical';
                    html += '<div class="flex items-center gap-2 py-0.5">' +
                        '<i data-lucide="' + passIcon + '" class="w-3 h-3 ' + passColor + ' flex-shrink-0"></i>' +
                        '<span class="font-mono text-[10px] text-neutral-400">' + escapeHtml(item.text) + '</span>' +
                    '</div>';
                }
                html += '<div class="font-mono text-[9px] text-neutral-500 mt-1">' + formatDateTime(entry.timestamp) + '</div>';
                html += '</div>';
            }

            html += '</div>';
        }

        html += '</div></div>';
        return html;
    }

    /* --- Config Tab --- */
    function renderConfigTab(agent, beat) {
        var cfg = beat.config || {};
        var interval = cfg.intervalMinutes || 30;
        var activeEnabled = cfg.activeHoursEnabled || false;
        var start = cfg.activeHoursStart != null ? cfg.activeHoursStart : 9;
        var end = cfg.activeHoursEnd != null ? cfg.activeHoursEnd : 17;
        var checkItems = MC.parseCheckItems(beat.instructions || '');

        var intervalOptions = [1, 5, 10, 15, 30, 60, 120, 360, 720, 1440];
        var intervalHtml = '';
        for (var oi = 0; oi < intervalOptions.length; oi++) {
            var v = intervalOptions[oi];
            intervalHtml += '<option value="' + v + '"' + (interval === v ? ' selected' : '') + '>' + formatInterval(v) + '</option>';
        }

        function hourOpts(selected) {
            var h = '';
            for (var hi = 0; hi < 24; hi++) {
                var lbl = (hi === 0 ? '12' : hi > 12 ? (hi - 12) : hi) + (hi < 12 ? ' AM' : ' PM');
                h += '<option value="' + hi + '"' + (selected === hi ? ' selected' : '') + '>' + lbl + '</option>';
            }
            return h;
        }

        var html = '<div class="px-4 py-3 space-y-4">';

        html += '<div class="flex items-center justify-between">' +
            '<span class="font-mono text-[11px] text-neutral-500">Interval</span>' +
            '<select class="hb-cfg-interval px-2 py-1 rounded-lg bg-neutral-100 dark:bg-mc-hover border border-neutral-200 dark:border-mc-border font-mono text-[11px] text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer" data-agent-id="' + agent.id + '">' +
                intervalHtml +
            '</select>' +
        '</div>';

        html += '<div class="flex items-center justify-between">' +
            '<span class="font-mono text-[11px] text-neutral-500">Active Hours</span>' +
            '<div class="hb-cfg-active-toggle mc-toggle' + (activeEnabled ? ' active' : '') + '" data-agent-id="' + agent.id + '"></div>' +
        '</div>';

        if (activeEnabled) {
            html += '<div class="flex items-center gap-2">' +
                '<select class="hb-cfg-start flex-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-mc-hover border border-neutral-200 dark:border-mc-border font-mono text-[10px] text-neutral-600 dark:text-neutral-400 focus:outline-none cursor-pointer" data-agent-id="' + agent.id + '">' + hourOpts(start) + '</select>' +
                '<span class="font-mono text-[10px] text-neutral-500">to</span>' +
                '<select class="hb-cfg-end flex-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-mc-hover border border-neutral-200 dark:border-mc-border font-mono text-[10px] text-neutral-600 dark:text-neutral-400 focus:outline-none cursor-pointer" data-agent-id="' + agent.id + '">' + hourOpts(end) + '</select>' +
            '</div>';
        }

        html += '<div class="flex items-center justify-between">' +
            '<span class="font-mono text-[11px] text-neutral-500">Check Items</span>' +
            '<span class="font-mono text-[11px] text-neutral-400">' + checkItems.length + ' items</span>' +
        '</div>';

        html += '<div class="flex gap-2 pt-1">' +
            '<button class="hb-edit-instructions flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-mc-hover border border-neutral-200 dark:border-mc-border font-mono text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors" data-agent-id="' + agent.id + '">' +
                '<i data-lucide="file-edit" class="w-3 h-3"></i>Edit Instructions' +
            '</button>' +
            '<button class="hb-run-now flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-status-standby/10 border border-status-standby/20 font-mono text-[10px] font-semibold text-status-standby hover:bg-status-standby/20 transition-colors" data-agent-id="' + agent.id + '">' +
                '<i data-lucide="play" class="w-3 h-3"></i>Run Now' +
            '</button>' +
        '</div>';

        html += '</div>';
        return html;
    }

    /* ========== ZONE 4 — Instructions Modal ========== */
    function renderModal() {
        return '<div id="hb-modal" class="mc-modal-overlay" hidden>' +
            '<div class="mc-modal w-full max-w-lg mx-4">' +
                '<div class="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-mc-border">' +
                    '<div class="flex items-center gap-2">' +
                        '<i data-lucide="file-text" class="w-4 h-4 text-status-standby"></i>' +
                        '<span id="hb-modal-title" class="font-mono text-[13px] font-semibold">Edit Instructions</span>' +
                    '</div>' +
                    '<button id="hb-modal-close" class="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-mc-hover transition-colors">' +
                        '<i data-lucide="x" class="w-4 h-4 text-neutral-400"></i>' +
                    '</button>' +
                '</div>' +
                '<div class="p-4">' +
                    '<textarea id="hb-modal-textarea" class="w-full h-48 p-3 rounded-xl bg-neutral-50 dark:bg-mc-dark border border-neutral-200 dark:border-mc-border font-mono text-[11px] text-neutral-700 dark:text-neutral-300 resize-none focus:outline-none focus:ring-1 focus:ring-status-standby/50 mc-scroll" placeholder="# Agent Heartbeat\n- [ ] Check item one\n- [ ] Check item two"></textarea>' +
                    '<div class="flex items-center justify-between mt-2">' +
                        '<span class="font-mono text-[10px] text-neutral-500">Use <code class="px-1 py-0.5 rounded bg-neutral-100 dark:bg-mc-hover text-[9px]">- [ ] item</code> for checklist lines</span>' +
                        '<span id="hb-modal-count" class="font-mono text-[10px] text-neutral-400">0 items</span>' +
                    '</div>' +
                '</div>' +
                '<div class="flex justify-end gap-2 p-4 border-t border-neutral-200 dark:border-mc-border">' +
                    '<button id="hb-modal-cancel" class="px-4 py-2 rounded-xl font-mono text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-mc-hover transition-colors">Cancel</button>' +
                    '<button id="hb-modal-save" class="px-4 py-2 rounded-xl bg-status-standby/10 border border-status-standby/20 font-mono text-[11px] font-semibold text-status-standby hover:bg-status-standby/20 transition-colors">Save</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    /* ---------- Modal helpers ---------- */
    function openModal(agentId) {
        modalAgentId = agentId;
        var agent = MC.store.getAgent(agentId);
        var hb = MC.store.getAgentHeartbeat(agentId) || {};
        var modal = document.getElementById('hb-modal');
        var title = document.getElementById('hb-modal-title');
        var textarea = document.getElementById('hb-modal-textarea');
        if (!modal || !textarea) return;
        title.textContent = (agent ? agent.name : agentId) + ' \u2014 Instructions';
        textarea.value = hb.instructions || '';
        updateModalCount();
        modal.hidden = false;
    }

    function closeModal() {
        var modal = document.getElementById('hb-modal');
        if (modal) modal.hidden = true;
        modalAgentId = null;
    }

    function updateModalCount() {
        var textarea = document.getElementById('hb-modal-textarea');
        var countEl = document.getElementById('hb-modal-count');
        if (!textarea || !countEl) return;
        var items = MC.parseCheckItems(textarea.value);
        countEl.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');
    }

    function saveModal() {
        if (!modalAgentId) return;
        var textarea = document.getElementById('hb-modal-textarea');
        if (!textarea) return;
        MC.store.updateHeartbeatInstructions(modalAgentId, textarea.value);
        closeModal();
        // Only refresh config tab content if that card is expanded on config
        if (expandedAgent === modalAgentId && activeTab[modalAgentId] === 'config') {
            refreshTabContent(modalAgentId);
        }
    }

    /* ========== Surgical DOM updates ========== */

    /* Replace a single card's outerHTML */
    function refreshCard(agentId) {
        var card = document.querySelector('.hb-card[data-agent-id="' + agentId + '"]');
        if (!card) return;
        var agent = MC.store.getAgent(agentId);
        var beat = MC.store.getAgentHeartbeat(agentId) || { lastSeen: null, latency: 0, uptime: 0, status: 'offline', history: [], config: {}, instructions: '', log: [] };
        var tmp = document.createElement('div');
        tmp.innerHTML = renderCard(agent, beat);
        var newCard = tmp.firstElementChild;
        card.replaceWith(newCard);
        lucide.createIcons({ nameAttr: 'data-lucide', node: newCard });
    }

    /* Replace only the tab content area inside an expanded card */
    function refreshTabContent(agentId) {
        var card = document.querySelector('.hb-card[data-agent-id="' + agentId + '"]');
        if (!card) return;
        var tabContent = card.querySelector('.hb-tab-content');
        if (!tabContent) return;
        var agent = MC.store.getAgent(agentId);
        var beat = MC.store.getAgentHeartbeat(agentId) || { lastSeen: null, latency: 0, uptime: 0, status: 'offline', history: [], config: {}, instructions: '', log: [] };
        var tab = activeTab[agentId] || 'config';
        tabContent.innerHTML = tab === 'log' ? renderLogTab(agent, beat) : renderConfigTab(agent, beat);
        lucide.createIcons({ nameAttr: 'data-lucide', node: tabContent });

        // Also update tab button styles
        card.querySelectorAll('.hb-tab').forEach(function (btn) {
            var isActive = btn.dataset.tab === tab;
            btn.className = 'hb-tab flex-1 py-2.5 font-mono text-[11px] font-semibold text-center transition-colors ' +
                (isActive ? 'text-status-standby border-b-2 border-status-standby' : 'text-neutral-400 hover:text-neutral-300');
        });
    }

    /* Re-render only the grid (for search/filter changes) */
    function refreshGrid() {
        var grid = document.getElementById('hb-grid');
        if (!grid) return;
        var agents = MC.store.getAgents();
        var heartbeats = MC.store.getHeartbeats();
        var filtered = filterAgents(agents, heartbeats);
        var html = '';
        if (filtered.length === 0) {
            html = '<div class="col-span-full text-center font-mono text-[12px] text-neutral-500 py-8">No agents match your filter</div>';
        }
        for (var i = 0; i < filtered.length; i++) {
            var agent = filtered[i];
            var beat = heartbeats[agent.id] || { lastSeen: null, latency: 0, uptime: 0, status: 'offline', history: [], config: {}, instructions: '', log: [] };
            html += renderCard(agent, beat);
        }
        grid.innerHTML = html;
        lucide.createIcons({ nameAttr: 'data-lucide', node: grid });
    }

    /* ========== Full render (initial only) ========== */
    function render() {
        var agents = MC.store.getAgents();
        var heartbeats = MC.store.getHeartbeats();
        var stats = computeStats(agents, heartbeats);
        var filtered = filterAgents(agents, heartbeats);

        var html = '<div class="pt-4">';
        html += renderStats(stats);
        html += renderToolbar();
        html += '<div id="hb-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start reveal">';
        if (filtered.length === 0) {
            html += '<div class="col-span-full text-center font-mono text-[12px] text-neutral-500 py-8">No agents match your filter</div>';
        }
        for (var i = 0; i < filtered.length; i++) {
            var agent = filtered[i];
            var beat = heartbeats[agent.id] || { lastSeen: null, latency: 0, uptime: 0, status: 'offline', history: [], config: {}, instructions: '', log: [] };
            html += renderCard(agent, beat);
        }
        html += '</div>';
        html += renderModal();
        html += '</div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });
    }

    /* ========== Event delegation (bound once, never re-bound) ========== */
    function bindDelegation() {
        var root = document.getElementById('page-content');
        if (!root) return;

        root.addEventListener('click', function (e) {
            var target = e.target;

            /* --- Enable/disable toggle --- */
            var toggle = target.closest('.hb-toggle:not(.hb-cfg-active-toggle)');
            if (toggle) {
                e.stopPropagation();
                var id = toggle.dataset.agentId;
                var cfg = MC.store.getHeartbeatConfig(id);
                MC.store.updateHeartbeatConfig(id, { enabled: !cfg.enabled });
                toggle.classList.toggle('active');
                toggle.title = toggle.classList.contains('active') ? 'Enabled' : 'Disabled';
                updateStats();
                return;
            }

            /* --- Card header expand/collapse --- */
            var header = target.closest('.heartbeat-card-header');
            if (header) {
                var agentId = header.dataset.agentId;
                var wasExpanded = expandedAgent === agentId;
                var prevExpanded = expandedAgent;

                // Collapse previous card if different
                if (prevExpanded && prevExpanded !== agentId) {
                    expandedAgent = null;
                    refreshCard(prevExpanded);
                }

                // Toggle this card
                expandedAgent = wasExpanded ? null : agentId;
                if (!activeTab[agentId]) activeTab[agentId] = 'config';
                refreshCard(agentId);
                return;
            }

            /* --- Tab switching --- */
            var tabBtn = target.closest('.hb-tab');
            if (tabBtn) {
                e.stopPropagation();
                var tabAgentId = tabBtn.dataset.agentId;
                var newTab = tabBtn.dataset.tab;
                if (activeTab[tabAgentId] === newTab) return;
                activeTab[tabAgentId] = newTab;
                refreshTabContent(tabAgentId);
                return;
            }

            /* --- Log entry expand --- */
            var logRow = target.closest('.hb-log-row');
            if (logRow) {
                var logAgentId = logRow.dataset.agentId;
                var logId = logRow.dataset.logId;
                expandedLogEntry[logAgentId] = expandedLogEntry[logAgentId] === logId ? null : logId;
                refreshTabContent(logAgentId);
                return;
            }

            /* --- Config: active hours toggle --- */
            var activeToggle = target.closest('.hb-cfg-active-toggle');
            if (activeToggle) {
                e.stopPropagation();
                var atId = activeToggle.dataset.agentId;
                var atCfg = MC.store.getHeartbeatConfig(atId);
                MC.store.updateHeartbeatConfig(atId, { activeHoursEnabled: !atCfg.activeHoursEnabled });
                refreshTabContent(atId);
                return;
            }

            /* --- Edit instructions button --- */
            var editBtn = target.closest('.hb-edit-instructions');
            if (editBtn) {
                e.stopPropagation();
                openModal(editBtn.dataset.agentId);
                return;
            }

            /* --- Run Now button --- */
            var runBtn = target.closest('.hb-run-now');
            if (runBtn) {
                e.stopPropagation();
                var runId = runBtn.dataset.agentId;
                runCycle(runId);
                if (expandedAgent === runId) {
                    refreshTabContent(runId);
                }
                updateStats();
                return;
            }

            /* --- Run All Now --- */
            if (target.closest('#hb-run-all')) {
                runAllCycles();
                return;
            }

            /* --- Modal close / cancel / save --- */
            if (target.closest('#hb-modal-close') || target.closest('#hb-modal-cancel')) {
                closeModal();
                return;
            }
            if (target.closest('#hb-modal-save')) {
                saveModal();
                return;
            }

            /* --- Modal backdrop --- */
            if (target.id === 'hb-modal') {
                closeModal();
                return;
            }
        });

        /* --- Change events (search, filter, config selects) --- */
        root.addEventListener('input', function (e) {
            if (e.target.id === 'hb-search') {
                searchQuery = e.target.value;
                refreshGrid();
                return;
            }
            if (e.target.id === 'hb-modal-textarea') {
                updateModalCount();
                return;
            }
        });

        root.addEventListener('change', function (e) {
            if (e.target.id === 'hb-filter') {
                filterMode = e.target.value;
                refreshGrid();
                return;
            }

            var cfgInterval = e.target.closest('.hb-cfg-interval');
            if (cfgInterval) {
                e.stopPropagation();
                MC.store.updateHeartbeatConfig(cfgInterval.dataset.agentId, { intervalMinutes: parseInt(cfgInterval.value) });
                return;
            }

            var cfgStart = e.target.closest('.hb-cfg-start');
            if (cfgStart) {
                e.stopPropagation();
                MC.store.updateHeartbeatConfig(cfgStart.dataset.agentId, { activeHoursStart: parseInt(cfgStart.value) });
                return;
            }

            var cfgEnd = e.target.closest('.hb-cfg-end');
            if (cfgEnd) {
                e.stopPropagation();
                MC.store.updateHeartbeatConfig(cfgEnd.dataset.agentId, { activeHoursEnd: parseInt(cfgEnd.value) });
                return;
            }
        });
    }

    /* ========== Targeted DOM update for health pings ========== */
    function updateDOM() {
        updateStats();

        document.querySelectorAll('.hb-card').forEach(function (card) {
            var agentId = card.dataset.agentId;
            var beat = MC.store.getAgentHeartbeat(agentId);
            if (!beat) return;

            var sm = STATUS_MAP[beat.status] || STATUS_MAP.offline;

            var dot = card.querySelector('.hb-status-dot');
            if (dot) {
                dot.className = 'hb-status-dot w-2.5 h-2.5 rounded-full bg-' + sm.color +
                    (beat.status !== 'offline' ? ' heartbeat-pulse' : '') + ' ' + sm.glow;
            }
            var label = card.querySelector('.hb-status-label');
            if (label) {
                label.textContent = sm.label;
                label.className = 'hb-status-label font-mono text-[10px] text-' + sm.color;
            }
            var lastSeen = card.querySelector('.hb-last-seen');
            if (lastSeen) lastSeen.textContent = timeAgo(beat.lastSeen);

            var uptimeBar = card.querySelector('.hb-uptime-bar');
            if (uptimeBar) {
                uptimeBar.style.width = Math.min(100, Math.max(0, beat.uptime)) + '%';
                uptimeBar.className = 'hb-uptime-bar h-full rounded-full bg-' + sm.color + ' transition-all duration-500';
            }
            var uptimePct = card.querySelector('.hb-uptime-pct');
            if (uptimePct) uptimePct.textContent = beat.uptime.toFixed(1) + '%';
        });
    }

    /* ========== Layer A — Health pings ========== */
    function simulateHealth() {
        var agents = MC.store.getAgents();
        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            var hb = MC.store.getAgentHeartbeat(agent.id);
            if (!hb || hb.status === 'offline') continue;
            var cfg = hb.config || {};
            if (cfg.enabled === false) continue;

            var baseLatency = hb.latency || 50;
            var jitter = (Math.random() - 0.5) * 60;
            var newLatency = Math.max(5, Math.round(baseLatency + jitter));

            var newStatus = 'healthy';
            if (newLatency > 300) newStatus = 'unhealthy';
            else if (newLatency > 150) newStatus = 'degraded';

            var roll = Math.random();
            if (roll < 0.02) newStatus = 'unhealthy';
            else if (roll < 0.05) newStatus = 'degraded';

            MC.store.updateHeartbeat(agent.id, {
                lastSeen: new Date().toISOString(),
                latency: newLatency,
                status: newStatus,
            });
        }
        updateDOM();
    }

    /* ========== Layer B — Heartbeat cycles ========== */
    var SIMULATION_SPEED = 60;

    function runCycle(agentId) {
        var hb = MC.store.getAgentHeartbeat(agentId);
        if (!hb) return;

        var instructions = hb.instructions || '';
        var checkItems = MC.parseCheckItems(instructions);
        if (checkItems.length === 0) {
            checkItems = ['System responsive'];
        }

        var passRate = 0.92;
        if (hb.status === 'degraded') passRate = 0.75;
        else if (hb.status === 'unhealthy') passRate = 0.55;

        var checked = [];
        for (var i = 0; i < checkItems.length; i++) {
            checked.push({ text: checkItems[i], passed: Math.random() < passRate });
        }

        var anyFailed = checked.some(function (c) { return !c.passed; });
        var result = anyFailed ? 'alert' : 'ok';
        var failedItems = checked.filter(function (c) { return !c.passed; });
        var summary = result === 'ok'
            ? ['All checks passed', 'Systems nominal', 'No issues detected', 'Cycle complete \u2014 OK'][Math.floor(Math.random() * 4)]
            : 'Alert: ' + failedItems.length + ' item(s) failed \u2014 ' + failedItems[0].text;

        var entry = {
            result: result,
            summary: summary,
            checkedItems: checked,
            latency: Math.round(800 + Math.random() * 2200),
        };

        MC.store.addHeartbeatLogEntry(agentId, entry);
        lastCycleCheck[agentId] = Date.now();

        if (result === 'alert') {
            var agent = MC.store.getAgent(agentId);
            var agentName = agent ? agent.name : agentId;
            MC.store.log(agentName, 'heartbeat-alert', summary, 'critical');
        }

        return entry;
    }

    function runAllCycles() {
        var agents = MC.store.getAgents();
        var heartbeats = MC.store.getHeartbeats();
        for (var i = 0; i < agents.length; i++) {
            var hb = heartbeats[agents[i].id];
            if (!hb) continue;
            var cfg = hb.config || {};
            if (cfg.enabled === false) continue;
            runCycle(agents[i].id);
        }
        // Refresh expanded card's log tab if visible
        if (expandedAgent && (activeTab[expandedAgent] || 'config') === 'log') {
            refreshTabContent(expandedAgent);
        }
        updateStats();
    }

    function simulateCycles() {
        var agents = MC.store.getAgents();
        var heartbeats = MC.store.getHeartbeats();
        var nowMs = Date.now();
        var didRun = false;

        for (var i = 0; i < agents.length; i++) {
            var agentId = agents[i].id;
            var hb = heartbeats[agentId];
            if (!hb) continue;
            var cfg = hb.config || {};
            if (cfg.enabled === false) continue;

            if (cfg.activeHoursEnabled) {
                var currentHour = new Date().getHours();
                if (cfg.activeHoursStart <= cfg.activeHoursEnd) {
                    if (currentHour < cfg.activeHoursStart || currentHour >= cfg.activeHoursEnd) continue;
                } else {
                    if (currentHour < cfg.activeHoursStart && currentHour >= cfg.activeHoursEnd) continue;
                }
            }

            var intervalMs = (cfg.intervalMinutes || 30) * 60000;
            var realIntervalMs = intervalMs / SIMULATION_SPEED;
            var lastCheck = lastCycleCheck[agentId] || 0;

            if (nowMs - lastCheck >= realIntervalMs) {
                runCycle(agentId);
                didRun = true;
            }
        }

        if (didRun) {
            if (expandedAgent && (activeTab[expandedAgent] || 'config') === 'log') {
                refreshTabContent(expandedAgent);
            }
            updateStats();
        }
    }

    /* ========== Init ========== */
    function init() {
        var agents = MC.store.getAgents();
        var heartbeats = MC.store.getHeartbeats();
        for (var i = 0; i < agents.length; i++) {
            var hb = heartbeats[agents[i].id];
            if (hb && hb.log && hb.log.length > 0) {
                lastCycleCheck[agents[i].id] = new Date(hb.log[hb.log.length - 1].timestamp).getTime();
            }
        }

        render();
        bindDelegation();
        healthInterval = setInterval(simulateHealth, 4000);
        cycleInterval = setInterval(simulateCycles, 10000);
    }

    window.addEventListener('beforeunload', function () {
        if (healthInterval) clearInterval(healthInterval);
        if (cycleInterval) clearInterval(cycleInterval);
    });

    document.addEventListener('mc:ready', init);
})();
