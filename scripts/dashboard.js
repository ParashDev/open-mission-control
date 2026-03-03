/* ========== DASHBOARD PAGE ========== */
(function () {
    'use strict';

    function getAgentIconHtml(agent) {
        var colorMap = {
            standby: 'bg-status-standby/10 text-status-standby',
            normal: 'bg-status-normal/10 text-status-normal',
            serious: 'bg-status-serious/10 text-status-serious',
            caution: 'bg-status-caution/10 text-status-caution',
            critical: 'bg-status-critical/10 text-status-critical',
            off: 'bg-neutral-500/10 text-neutral-500',
        };
        var cls = colorMap[agent.color] || colorMap.standby;
        return '<div class="agent-icon-box ' + cls + '">' +
            '<i data-lucide="' + (agent.icon || 'zap') + '" class="w-[18px] h-[18px]"></i>' +
        '</div>';
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function fmtTokens(n) {
        if (!n || n === 0) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return String(n);
    }

    /* System gauges */
    var sysData = { cpu: 42, ram: 58, disk: 34, net: 12.4 };

    function sysColor(v) {
        if (v >= 90) return 'critical';
        if (v >= 75) return 'serious';
        if (v >= 60) return 'caution';
        return 'normal';
    }

    function sysBar(label, value, unit) {
        var c = sysColor(value);
        var display = unit === ' MB/s' ? value.toFixed(1) : Math.round(value);
        return '<div>' +
            '<div class="flex justify-between font-mono text-[11px] mb-1">' +
                '<span class="text-neutral-500">' + label + '</span>' +
                '<span class="text-status-' + c + ' tabular-nums">' + display + unit + '</span>' +
            '</div>' +
            '<div class="h-1.5 rounded-full bg-neutral-200 dark:bg-mc-border overflow-hidden">' +
                '<div class="h-full rounded-full bg-status-' + c + ' transition-all duration-1000" style="width:' + Math.min(value, 100) + '%"></div>' +
            '</div>' +
        '</div>';
    }

    function renderSystemPanel() {
        return '<div class="space-y-4">' +
            sysBar('CPU', sysData.cpu, '%') +
            sysBar('RAM', sysData.ram, '%') +
            sysBar('DISK', sysData.disk, '%') +
            sysBar('NET', sysData.net, ' MB/s') +
        '</div>' +
        '<div class="mt-4 pt-4 border-t border-neutral-200 dark:border-mc-border space-y-2.5">' +
            '<div class="flex items-center justify-between">' +
                '<span class="font-mono text-[11px] text-neutral-500">Gateway</span>' +
                '<div class="flex items-center gap-1.5">' +
                    '<span class="w-1.5 h-1.5 rounded-full bg-status-normal"></span>' +
                    '<span class="font-mono text-[11px] text-status-normal">Operational</span>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center justify-between">' +
                '<span class="font-mono text-[11px] text-neutral-500">Uptime</span>' +
                '<span class="font-mono text-[11px] tabular-nums">14d 6h 23m</span>' +
            '</div>' +
        '</div>';
    }

    /* ---------- Cron helpers ---------- */
    function cronToHuman(expr) {
        if (!expr) return 'Unknown';
        var parts = expr.split(/\s+/);
        if (parts.length < 5) return expr;
        var min = parts[0], hour = parts[1], dom = parts[2], mon = parts[3], dow = parts[4];

        if (min.indexOf('*/') === 0 && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
            var n = parseInt(min.slice(2));
            return 'Every ' + n + 'min';
        }
        if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*') return 'Hourly';
        if (min !== '*' && hour !== '*' && dom === '*' && mon === '*' && dow === '*') return 'Daily ' + fmtTime(hour, min);
        if (min !== '*' && hour !== '*' && dom === '*' && mon === '*' && dow !== '*') {
            var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            return days[parseInt(dow)] + ' ' + fmtTime(hour, min);
        }
        return expr;
    }

    function fmtTime(hour, min) {
        var h = parseInt(hour);
        var m = String(min).padStart(2, '0');
        var ampm = h >= 12 ? 'PM' : 'AM';
        var h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return h12 + ':' + m + ampm;
    }

    function getNextRun(schedule, lastRun) {
        /* Simple estimate based on cron pattern */
        var parts = schedule.split(/\s+/);
        if (parts.length < 5) return null;
        var min = parts[0], hour = parts[1], dow = parts[4];
        var now = Date.now();
        var base = lastRun ? new Date(lastRun).getTime() : now;

        /* Every N minutes */
        if (min.indexOf('*/') === 0 && hour === '*') {
            var interval = parseInt(min.slice(2)) * 60000;
            var next = base + interval;
            while (next < now) next += interval;
            return next;
        }
        /* Hourly */
        if (min === '0' && hour === '*') {
            var next2 = base + 3600000;
            while (next2 < now) next2 += 3600000;
            return next2;
        }
        /* Daily */
        if (min !== '*' && hour !== '*' && dow === '*') {
            var d = new Date();
            d.setHours(parseInt(hour), parseInt(min), 0, 0);
            if (d.getTime() < now) d.setDate(d.getDate() + 1);
            return d.getTime();
        }
        /* Weekly */
        if (min !== '*' && hour !== '*' && dow !== '*') {
            var wd = parseInt(dow);
            var d2 = new Date();
            d2.setHours(parseInt(hour), parseInt(min), 0, 0);
            var diff = wd - d2.getDay();
            if (diff < 0) diff += 7;
            if (diff === 0 && d2.getTime() < now) diff = 7;
            d2.setDate(d2.getDate() + diff);
            return d2.getTime();
        }
        return null;
    }

    function timeUntil(ms) {
        if (!ms) return 'Unknown';
        var diff = ms - Date.now();
        if (diff < 0) return 'Overdue';
        if (diff < 60000) return Math.floor(diff / 1000) + 's';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ' + Math.floor((diff % 3600000) / 60000) + 'm';
        return Math.floor(diff / 86400000) + 'd ' + Math.floor((diff % 86400000) / 3600000) + 'h';
    }

    /* ---------- Heartbeat helpers ---------- */
    var HB_STATUS = {
        healthy:   { label: 'Healthy',   color: 'status-normal' },
        degraded:  { label: 'Degraded',  color: 'status-serious' },
        unhealthy: { label: 'Unhealthy', color: 'status-critical' },
        offline:   { label: 'Offline',   color: 'status-off' },
    };

    function render() {
        var agents = MC.store.getAgents();
        var tasks = MC.store.getTasks();
        var activities = MC.store.getActivities().slice(0, 10);
        var heartbeats = MC.store.getHeartbeats();

        var online = agents.filter(function (a) { return a.status !== 'off'; }).length;
        var activeTasks = tasks.filter(function (t) { return t.column !== 'done'; }).length;

        /* ===== Stat cards ===== */
        var stats = [
            { label: 'Total Agents', value: agents.length, icon: 'users', color: 'standby' },
            { label: 'Active Tasks', value: activeTasks, icon: 'list-checks', color: 'normal' },
            { label: 'Tokens Used', value: fmtTokens(87400), icon: 'hash', color: 'serious' },
            { label: 'Est. Cost', value: '$12.40', icon: 'receipt', color: 'caution' },
        ];

        var statCardsHtml = '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 reveal">';
        for (var i = 0; i < stats.length; i++) {
            var s = stats[i];
            statCardsHtml += '<div class="p-4 rounded-xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">' +
                '<div class="flex items-center gap-2 mb-2">' +
                    '<div class="w-7 h-7 rounded-lg bg-status-' + s.color + '/10 flex items-center justify-center">' +
                        '<i data-lucide="' + s.icon + '" class="w-3.5 h-3.5 text-status-' + s.color + '"></i>' +
                    '</div>' +
                    '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-500">' + s.label + '</span>' +
                '</div>' +
                '<div class="font-mono text-2xl font-bold">' + s.value + '</div>' +
            '</div>';
        }
        statCardsHtml += '</div>';

        /* ===== Leadership fleet ===== */
        var leaders = agents.filter(function (a) { return a.role === 'ceo' || a.role === 'department-head'; });

        var agentGridHtml = '<section class="reveal">' +
            '<div class="flex items-center justify-between mb-3">' +
                '<div class="flex items-center gap-2">' +
                    '<i data-lucide="users" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Leadership</span>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<span class="w-1.5 h-1.5 rounded-full bg-status-normal"></span>' +
                    '<span class="font-mono text-[10px] text-neutral-500">' + online + '/' + agents.length + ' online</span>' +
                '</div>' +
            '</div>' +
            '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">';

        for (var j = 0; j < leaders.length; j++) {
            var a = leaders[j];
            var dInfo = MC.DEPARTMENTS[a.department] || { label: '' };
            var subCount = MC.store.getSubAgents(a.id).length;
            var roleBadge = MC.getRoleBadgeHtml(a);

            agentGridHtml += '<div class="p-4 rounded-xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border hover:-translate-y-1 transition-all duration-200">' +
                '<div class="flex items-center justify-between mb-3">' +
                    '<div class="flex items-center gap-2.5">' +
                        getAgentIconHtml(a) +
                        '<div>' +
                            '<div class="font-mono text-sm font-medium">' + a.name + '</div>' +
                            '<div class="font-mono text-[10px] text-neutral-500">' + dInfo.label + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<span class="w-2.5 h-2.5 rounded-full bg-status-' + a.status + '"></span>' +
                '</div>' +
                '<div class="flex items-center justify-between">' +
                    roleBadge +
                    (subCount > 0 ? '<span class="font-mono text-[10px] text-neutral-400">' + subCount + ' agents</span>' : '') +
                '</div>' +
            '</div>';
        }

        agentGridHtml += '</div></section>';

        /* ===== Task Pipeline ===== */
        var totalTasks = tasks.length;
        var pipelineHtml = '<section class="reveal">' +
            '<div class="flex items-center gap-2 mb-3">' +
                '<i data-lucide="git-branch" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Task Pipeline</span>' +
                '<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-mc-border text-neutral-500">' + totalTasks + ' total</span>' +
            '</div>' +
            '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">';

        /* Stacked bar */
        if (totalTasks > 0) {
            pipelineHtml += '<div class="flex h-3 rounded-full overflow-hidden mb-4">';
            for (var pi = 0; pi < MC.COLUMNS.length; pi++) {
                var col = MC.COLUMNS[pi];
                var colCount = tasks.filter(function (t) { return t.column === col.id; }).length;
                var pct = (colCount / totalTasks) * 100;
                if (pct > 0) {
                    pipelineHtml += '<div class="bg-' + col.color + ' transition-all duration-500" style="width:' + pct + '%" title="' + col.label + ': ' + colCount + '"></div>';
                }
            }
            pipelineHtml += '</div>';
        }

        /* Column breakdown */
        pipelineHtml += '<div class="grid grid-cols-5 gap-2">';
        for (var ci = 0; ci < MC.COLUMNS.length; ci++) {
            var c = MC.COLUMNS[ci];
            var cnt = tasks.filter(function (t) { return t.column === c.id; }).length;
            pipelineHtml += '<div class="text-center">' +
                '<div class="font-mono text-xl font-bold tabular-nums text-' + c.color + '">' + cnt + '</div>' +
                '<div class="font-mono text-[9px] uppercase tracking-wider text-neutral-500 mt-0.5">' + c.label + '</div>' +
            '</div>';
        }
        pipelineHtml += '</div>' +
            '</div></section>';

        /* ===== Heartbeat Alerts ===== */
        var alertAgents = [];
        for (var hi = 0; hi < agents.length; hi++) {
            var hb = heartbeats[agents[hi].id];
            if (hb && (hb.status === 'degraded' || hb.status === 'unhealthy')) {
                alertAgents.push({ agent: agents[hi], beat: hb });
            }
        }

        var alertsHtml = '<section class="reveal">' +
            '<div class="flex items-center justify-between mb-3">' +
                '<div class="flex items-center gap-2">' +
                    '<i data-lucide="bell-ring" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Heartbeat Alerts</span>' +
                '</div>' +
                (alertAgents.length > 0
                    ? '<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-status-critical/10 text-status-critical">' + alertAgents.length + ' issue' + (alertAgents.length !== 1 ? 's' : '') + '</span>'
                    : '<span class="font-mono text-[10px] text-status-normal">All clear</span>') +
            '</div>' +
            '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">';

        if (alertAgents.length === 0) {
            alertsHtml += '<div class="flex items-center gap-3 py-2">' +
                '<div class="w-8 h-8 rounded-lg bg-status-normal/10 flex items-center justify-center">' +
                    '<i data-lucide="shield-check" class="w-4 h-4 text-status-normal"></i>' +
                '</div>' +
                '<div>' +
                    '<div class="font-mono text-[13px] font-medium text-status-normal">All agents healthy</div>' +
                    '<div class="font-mono text-[10px] text-neutral-500">No degraded or unhealthy agents detected</div>' +
                '</div>' +
            '</div>';
        } else {
            alertsHtml += '<div class="space-y-2.5">';
            for (var ai = 0; ai < alertAgents.length; ai++) {
                var aa = alertAgents[ai];
                var agt = aa.agent;
                var beat = aa.beat;
                var sm = HB_STATUS[beat.status] || HB_STATUS.offline;
                var deptLabel = (MC.DEPARTMENTS[agt.department] || {}).label || '';

                alertsHtml += '<div class="flex items-center gap-3 p-2.5 rounded-xl bg-' + sm.color + '/5 border border-' + sm.color + '/10">' +
                    getAgentIconHtml(agt) +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="font-mono text-[13px] font-medium">' + escapeHtml(agt.name) + '</span>' +
                            MC.getRoleBadgeHtml(agt) +
                        '</div>' +
                        '<div class="font-mono text-[10px] text-neutral-500">' + deptLabel + ' \u00b7 ' + beat.latency + 'ms \u00b7 ' + beat.uptime.toFixed(1) + '% uptime</div>' +
                    '</div>' +
                    '<div class="flex items-center gap-1.5 flex-shrink-0">' +
                        '<span class="w-2 h-2 rounded-full bg-' + sm.color + ' heartbeat-pulse"></span>' +
                        '<span class="font-mono text-[10px] text-' + sm.color + ' font-medium">' + sm.label + '</span>' +
                    '</div>' +
                '</div>';
            }
            alertsHtml += '</div>';
        }

        alertsHtml += '</div></section>';

        /* ===== Upcoming Cron Jobs ===== */
        var cronJobs = MC.store.getCronJobs();
        var upcoming = [];
        for (var cj = 0; cj < cronJobs.length; cj++) {
            var job = cronJobs[cj];
            if (!job.enabled) continue;
            var nextRun = getNextRun(job.schedule, job.lastRun);
            upcoming.push({ job: job, nextRun: nextRun });
        }
        /* Sort by soonest */
        upcoming.sort(function (a, b) {
            if (!a.nextRun) return 1;
            if (!b.nextRun) return -1;
            return a.nextRun - b.nextRun;
        });
        upcoming = upcoming.slice(0, 10);

        var cronHtml = '<section class="reveal">' +
            '<div class="flex items-center gap-2 mb-3">' +
                '<i data-lucide="clock" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Upcoming Jobs</span>' +
            '</div>' +
            '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border h-[220px] flex flex-col">';

        if (upcoming.length === 0) {
            cronHtml += '<div class="font-mono text-[12px] text-neutral-500 text-center py-3">No scheduled jobs</div>';
        } else {
            cronHtml += '<div class="flex-1 overflow-y-auto space-y-2.5 pr-1 mc-scroll">';
            for (var ui = 0; ui < upcoming.length; ui++) {
                var u = upcoming[ui];
                var cAgent = MC.store.getAgent(u.job.agentId);
                var cAgentName = cAgent ? cAgent.name : 'Unassigned';
                var countdown = timeUntil(u.nextRun);
                var countdownColor = 'status-standby';
                if (u.nextRun) {
                    var diff = u.nextRun - Date.now();
                    if (diff < 1800000) countdownColor = 'status-serious'; /* < 30min */
                    if (diff < 300000) countdownColor = 'status-critical';  /* < 5min */
                }
                var lastBadge = '';
                if (u.job.lastStatus === 'success') {
                    lastBadge = '<span class="w-1.5 h-1.5 rounded-full bg-status-normal"></span>';
                } else if (u.job.lastStatus === 'failure') {
                    lastBadge = '<span class="w-1.5 h-1.5 rounded-full bg-status-critical"></span>';
                }

                cronHtml += '<div class="flex items-center gap-3 py-1.5">' +
                    '<div class="w-8 h-8 rounded-lg bg-status-standby/10 flex items-center justify-center flex-shrink-0">' +
                        '<i data-lucide="timer" class="w-4 h-4 text-status-standby"></i>' +
                    '</div>' +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="font-mono text-[12px] font-medium truncate">' + escapeHtml(u.job.name) + '</span>' +
                            lastBadge +
                        '</div>' +
                        '<div class="font-mono text-[10px] text-neutral-500">' + escapeHtml(cAgentName) + ' \u00b7 ' + cronToHuman(u.job.schedule) + '</div>' +
                    '</div>' +
                    '<div class="text-right flex-shrink-0">' +
                        '<div class="font-mono text-[12px] font-semibold tabular-nums text-' + countdownColor + '">' + countdown + '</div>' +
                        '<div class="font-mono text-[9px] text-neutral-400">until next</div>' +
                    '</div>' +
                '</div>';
            }
            cronHtml += '</div>';
        }

        cronHtml += '</div></section>';

        /* ===== Activity feed ===== */
        var activityHtml = '<section class="reveal">' +
            '<div class="flex items-center gap-2 mb-3">' +
                '<i data-lucide="radio" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Recent Activity</span>' +
            '</div>' +
            '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border h-[260px] flex flex-col">' +
                '<div class="flex-1 overflow-y-auto space-y-1 pr-1 mc-scroll">';

        for (var k = 0; k < activities.length; k++) {
            var act = activities[k];
            var colorMap = {
                normal: 'status-normal', standby: 'status-standby', caution: 'status-caution',
                serious: 'status-serious', critical: 'status-critical', off: 'status-off'
            };
            var dotColor = colorMap[act.type] || 'status-off';
            var time = act.timestamp ? new Date(act.timestamp).toTimeString().slice(0, 8) : '';
            activityHtml += '<div class="flex gap-3 py-2 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors">' +
                '<span class="w-1.5 h-1.5 rounded-full bg-' + dotColor + ' mt-1.5 flex-shrink-0"></span>' +
                '<div class="min-w-0">' +
                    '<div class="flex items-center gap-2 mb-0.5">' +
                        '<span class="font-mono text-[11px] font-medium">' + act.agent + '</span>' +
                        '<span class="font-mono text-[10px] text-neutral-400">' + act.action + '</span>' +
                    '</div>' +
                    '<p class="font-mono text-[11px] text-neutral-500 truncate">' + act.detail + '</p>' +
                    '<span class="font-mono text-[9px] text-neutral-400 tabular-nums">' + time + '</span>' +
                '</div>' +
            '</div>';
        }

        activityHtml += '</div></div></section>';

        /* ===== System Status ===== */
        var systemHtml = '<section class="reveal">' +
            '<div class="flex items-center gap-2 mb-3">' +
                '<i data-lucide="activity" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">System Status</span>' +
            '</div>' +
            '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">' +
                renderSystemPanel() +
            '</div>' +
        '</section>';

        /* ===== Layout ===== */
        var content = document.getElementById('page-content');
        content.innerHTML =
            '<div class="pt-4">' +
                statCardsHtml +
                '<div class="mb-4">' + agentGridHtml + '</div>' +
                /* Activity + System */
                '<div class="grid grid-cols-12 gap-4 mb-4">' +
                    '<div class="col-span-12 lg:col-span-8">' + activityHtml + '</div>' +
                    '<div class="col-span-12 lg:col-span-4">' + systemHtml + '</div>' +
                '</div>' +
                /* Pipeline + Alerts + Upcoming */
                '<div class="grid grid-cols-12 gap-4">' +
                    '<div class="col-span-12 md:col-span-4">' + pipelineHtml + '</div>' +
                    '<div class="col-span-12 md:col-span-4">' + alertsHtml + '</div>' +
                    '<div class="col-span-12 md:col-span-4">' + cronHtml + '</div>' +
                '</div>' +
            '</div>';

        lucide.createIcons();

        /* Trigger reveal */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Update header agent count */
        MC.header.updateAgentCount();
    }

    /* Simulate system gauges */
    setInterval(function () {
        sysData.cpu = Math.round(Math.max(10, Math.min(95, sysData.cpu + (Math.random() - 0.5) * 15)));
        sysData.ram = Math.round(Math.max(30, Math.min(90, sysData.ram + (Math.random() - 0.5) * 8)));
        sysData.disk = Math.round(Math.max(30, Math.min(80, sysData.disk + (Math.random() - 0.3) * 2)));
        sysData.net = Math.max(1, Math.min(50, sysData.net + (Math.random() - 0.5) * 10));
        sysData.net = Math.round(sysData.net * 10) / 10;
        var panel = document.querySelector('#page-content .space-y-4');
        if (panel && panel.parentElement) {
            panel.parentElement.innerHTML = renderSystemPanel();
        }
    }, 3000);

    document.addEventListener('mc:ready', render);
})();
