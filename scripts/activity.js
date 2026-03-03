/* ========== ACTIVITY LOG PAGE ========== */
(function () {
    'use strict';

    var searchQuery = '';
    var filterType = 'all';
    var filterAgent = 'all';

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    var TYPES = ['normal', 'standby', 'caution', 'serious', 'critical', 'off'];
    var colorMap = {
        normal: 'status-normal', standby: 'status-standby', caution: 'status-caution',
        serious: 'status-serious', critical: 'status-critical', off: 'status-off'
    };

    function render() {
        var activities = MC.store.getActivities();
        var agents = MC.store.getAgents();

        /* Unique agent names from activity data */
        var agentNames = [];
        var seen = {};
        for (var ai = 0; ai < activities.length; ai++) {
            if (!seen[activities[ai].agent]) {
                seen[activities[ai].agent] = true;
                agentNames.push(activities[ai].agent);
            }
        }
        agentNames.sort();

        /* Filter */
        var filtered = activities.filter(function (a) {
            if (filterType !== 'all' && a.type !== filterType) return false;
            if (filterAgent !== 'all' && a.agent !== filterAgent) return false;
            if (searchQuery) {
                var q = searchQuery.toLowerCase();
                if (a.agent.toLowerCase().indexOf(q) === -1 &&
                    a.action.toLowerCase().indexOf(q) === -1 &&
                    a.detail.toLowerCase().indexOf(q) === -1) return false;
            }
            return true;
        });

        /* Toolbar */
        var html = '<div class="pt-4">' +
            '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 reveal">' +
                '<div class="flex flex-wrap items-center gap-3">' +
                    '<div class="relative">' +
                        '<i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<input type="text" id="activity-search" class="mc-input pl-9 w-48" placeholder="Search activity..." value="' + escapeHtml(searchQuery) + '">' +
                    '</div>' +
                    '<select id="activity-filter-type" class="mc-input mc-select w-32 text-[12px]">' +
                        '<option value="all">All Types</option>';

        for (var ti = 0; ti < TYPES.length; ti++) {
            html += '<option value="' + TYPES[ti] + '"' + (filterType === TYPES[ti] ? ' selected' : '') + '>' +
                TYPES[ti].charAt(0).toUpperCase() + TYPES[ti].slice(1) + '</option>';
        }

        html += '</select>' +
                    '<select id="activity-filter-agent" class="mc-input mc-select w-32 text-[12px]">' +
                        '<option value="all">All Agents</option>';

        for (var ni = 0; ni < agentNames.length; ni++) {
            html += '<option value="' + escapeHtml(agentNames[ni]) + '"' + (filterAgent === agentNames[ni] ? ' selected' : '') + '>' + escapeHtml(agentNames[ni]) + '</option>';
        }

        html += '</select></div>' +
                '<button id="clear-activity-btn" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-critical/10 text-status-critical hover:bg-status-critical/20 transition-colors">' +
                    '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Clear All' +
                '</button>' +
            '</div>';

        /* Activity count */
        html += '<div class="mb-3 font-mono text-[11px] text-neutral-500 reveal">' +
            filtered.length + ' entries' + (filtered.length !== activities.length ? ' (filtered from ' + activities.length + ')' : '') +
        '</div>';

        /* Activity list */
        html += '<div class="rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border overflow-hidden reveal">' +
            '<div class="divide-y divide-neutral-100 dark:divide-mc-border/50 max-h-[calc(100vh-220px)] overflow-y-auto mc-scroll">';

        if (filtered.length === 0) {
            html += '<div class="px-4 py-8 text-center font-mono text-[13px] text-neutral-500">No activity found</div>';
        }

        for (var i = 0; i < filtered.length; i++) {
            var act = filtered[i];
            var dotColor = colorMap[act.type] || 'status-off';
            var time = act.timestamp ? new Date(act.timestamp).toLocaleString() : '';
            var timeShort = act.timestamp ? new Date(act.timestamp).toTimeString().slice(0, 8) : '';

            html += '<div class="flex items-start gap-3 py-3 px-4 hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors">' +
                '<span class="w-2 h-2 rounded-full bg-' + dotColor + ' mt-1.5 flex-shrink-0"></span>' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center gap-2 mb-0.5">' +
                        '<span class="font-mono text-[12px] font-medium">' + escapeHtml(act.agent) + '</span>' +
                        '<span class="font-mono text-[11px] text-neutral-400">' + escapeHtml(act.action) + '</span>' +
                        '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-' + dotColor + '/10 text-' + dotColor + ' hidden sm:inline">' + act.type + '</span>' +
                    '</div>' +
                    '<p class="font-mono text-[12px] text-neutral-500 truncate">' + escapeHtml(act.detail) + '</p>' +
                '</div>' +
                '<span class="font-mono text-[10px] text-neutral-400 tabular-nums flex-shrink-0 hidden sm:block">' + time + '</span>' +
                '<span class="font-mono text-[10px] text-neutral-400 tabular-nums flex-shrink-0 sm:hidden">' + timeShort + '</span>' +
            '</div>';
        }

        html += '</div></div></div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Reveal */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Bind events */
        document.getElementById('activity-search').addEventListener('input', function (e) {
            searchQuery = e.target.value;
            render();
        });
        document.getElementById('activity-filter-type').addEventListener('change', function (e) {
            filterType = e.target.value;
            render();
        });
        document.getElementById('activity-filter-agent').addEventListener('change', function (e) {
            filterAgent = e.target.value;
            render();
        });
        document.getElementById('clear-activity-btn').addEventListener('click', function () {
            showClearConfirm();
        });
    }

    function showClearConfirm() {
        var overlay = document.createElement('div');
        overlay.className = 'mc-confirm-overlay';

        overlay.innerHTML = '<div class="mc-modal p-6 max-w-sm">' +
            '<div class="flex items-center gap-3 mb-4">' +
                '<div class="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">' +
                    '<i data-lucide="alert-triangle" class="w-5 h-5 text-status-critical"></i>' +
                '</div>' +
                '<div>' +
                    '<h3 class="font-mono text-sm font-semibold">Clear Activity Log</h3>' +
                    '<p class="font-mono text-[12px] text-neutral-500">This action cannot be undone.</p>' +
                '</div>' +
            '</div>' +
            '<p class="font-mono text-[13px] mb-6">Are you sure you want to clear all activity entries?</p>' +
            '<div class="flex justify-end gap-3">' +
                '<button class="confirm-cancel font-mono text-[12px] px-4 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                '<button class="confirm-clear font-mono text-[12px] px-4 py-2 rounded-lg bg-status-critical/10 text-status-critical hover:bg-status-critical/20 transition-colors">Clear All</button>' +
            '</div>' +
        '</div>';

        document.body.appendChild(overlay);
        lucide.createIcons();

        overlay.querySelector('.confirm-cancel').addEventListener('click', function () { overlay.remove(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('.confirm-clear').addEventListener('click', function () {
            MC.store.clearActivities();
            overlay.remove();
            render();
        });
    }

    document.addEventListener('mc:ready', render);
})();
