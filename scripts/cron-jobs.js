/* ========== CRON JOBS PAGE ========== */
(function () {
    'use strict';

    var searchQuery = '';
    var filterAgent = 'all';
    var filterEnabled = 'all';

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    /* ---------- Cron-to-human parser ---------- */
    function cronToHuman(expr) {
        if (!expr) return 'Unknown';
        var parts = expr.split(/\s+/);
        if (parts.length < 5) return expr;

        var min = parts[0], hour = parts[1], dom = parts[2], mon = parts[3], dow = parts[4];
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        /* Every N minutes */
        if (min.indexOf('*/') === 0 && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
            var n = parseInt(min.slice(2));
            return 'Every ' + n + ' minute' + (n > 1 ? 's' : '');
        }

        /* Every N hours */
        if (min !== '*' && hour.indexOf('*/') === 0 && dom === '*' && mon === '*' && dow === '*') {
            var h = parseInt(hour.slice(2));
            return 'Every ' + h + ' hour' + (h > 1 ? 's' : '') + ' at :' + min.padStart(2, '0');
        }

        /* Top of every hour */
        if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
            return 'Every hour';
        }

        /* Daily at specific time */
        if (min !== '*' && hour !== '*' && dom === '*' && mon === '*' && dow === '*') {
            return 'Daily at ' + formatTime(hour, min);
        }

        /* Weekly on specific day */
        if (min !== '*' && hour !== '*' && dom === '*' && mon === '*' && dow !== '*') {
            var dayName = days[parseInt(dow)] || dow;
            return 'Weekly on ' + dayName + ' at ' + formatTime(hour, min);
        }

        /* Monthly on specific day */
        if (min !== '*' && hour !== '*' && dom !== '*' && mon === '*' && dow === '*') {
            return 'Monthly on day ' + dom + ' at ' + formatTime(hour, min);
        }

        return expr;
    }

    function formatTime(hour, min) {
        var h = parseInt(hour);
        var m = min.padStart(2, '0');
        var ampm = h >= 12 ? 'PM' : 'AM';
        var h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return h12 + ':' + m + ' ' + ampm;
    }

    function timeAgo(isoStr) {
        if (!isoStr) return 'Never';
        var diff = Date.now() - new Date(isoStr).getTime();
        if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
    }

    function render() {
        var jobs = MC.store.getCronJobs();
        var agents = MC.store.getAgents();

        /* Filter */
        var filtered = jobs.filter(function (j) {
            if (filterAgent !== 'all' && j.agentId !== filterAgent) return false;
            if (filterEnabled === 'enabled' && !j.enabled) return false;
            if (filterEnabled === 'disabled' && j.enabled) return false;
            if (searchQuery) {
                var q = searchQuery.toLowerCase();
                if (j.name.toLowerCase().indexOf(q) === -1 &&
                    j.schedule.toLowerCase().indexOf(q) === -1 &&
                    j.action.toLowerCase().indexOf(q) === -1) return false;
            }
            return true;
        });

        /* Toolbar */
        var html = '<div class="pt-4">' +
            '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 reveal">' +
                '<div class="flex flex-wrap items-center gap-3">' +
                    '<div class="relative">' +
                        '<i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<input type="text" id="cron-search" class="mc-input pl-9 w-48" placeholder="Search jobs..." value="' + escapeHtml(searchQuery) + '">' +
                    '</div>' +
                    '<select id="cron-filter-agent" class="mc-input mc-select w-36 text-[12px]">' +
                        '<option value="all">All Agents</option>' +
                        MC.buildAgentOptgroups(filterAgent, false) +
                    '</select>' +
                    '<select id="cron-filter-enabled" class="mc-input mc-select w-32 text-[12px]">' +
                        '<option value="all"' + (filterEnabled === 'all' ? ' selected' : '') + '>All Status</option>' +
                        '<option value="enabled"' + (filterEnabled === 'enabled' ? ' selected' : '') + '>Enabled</option>' +
                        '<option value="disabled"' + (filterEnabled === 'disabled' ? ' selected' : '') + '>Disabled</option>' +
                    '</select>' +
                '</div>' +
                '<button id="add-cron-btn" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' +
                    '<i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Cron Job' +
                '</button>' +
            '</div>';

        /* Count */
        html += '<div class="mb-3 font-mono text-[11px] text-neutral-500 reveal">' +
            filtered.length + ' job' + (filtered.length !== 1 ? 's' : '') +
            (filtered.length !== jobs.length ? ' (filtered from ' + jobs.length + ')' : '') +
        '</div>';

        /* Table */
        html += '<div class="rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border overflow-hidden reveal">' +
            '<div class="overflow-x-auto">' +
            '<table class="w-full">' +
            '<thead>' +
                '<tr class="border-b border-neutral-200 dark:border-mc-border">' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3">Name</th>' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3 hidden md:table-cell">Schedule</th>' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3 hidden sm:table-cell">Agent</th>' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3 hidden lg:table-cell">Last Run</th>' +
                    '<th class="text-center font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3">Enabled</th>' +
                    '<th class="text-right font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3">Actions</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>';

        for (var i = 0; i < filtered.length; i++) {
            var job = filtered[i];
            var agent = MC.store.getAgent(job.agentId);
            var agentName = agent ? agent.name : 'Unassigned';
            var humanSchedule = cronToHuman(job.schedule);

            var statusBadge = '';
            if (job.lastStatus === 'success') {
                statusBadge = '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-status-normal/10 text-status-normal">success</span>';
            } else if (job.lastStatus === 'failure') {
                statusBadge = '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-status-critical/10 text-status-critical">failure</span>';
            }

            html += '<tr class="border-b border-neutral-100 dark:border-mc-border/50 hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors">' +
                '<td class="px-4 py-3">' +
                    '<div class="font-mono text-[13px] font-medium">' + escapeHtml(job.name) + '</div>' +
                    '<div class="font-mono text-[10px] text-neutral-500 md:hidden">' + escapeHtml(humanSchedule) + '</div>' +
                '</td>' +
                '<td class="px-4 py-3 hidden md:table-cell">' +
                    '<div class="font-mono text-[12px] text-neutral-400">' + escapeHtml(humanSchedule) + '</div>' +
                    '<div class="font-mono text-[10px] text-neutral-600">' + escapeHtml(job.schedule) + '</div>' +
                '</td>' +
                '<td class="px-4 py-3 hidden sm:table-cell"><span class="font-mono text-[12px] text-neutral-500">' + escapeHtml(agentName) + '</span></td>' +
                '<td class="px-4 py-3 hidden lg:table-cell">' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="font-mono text-[12px] text-neutral-500">' + timeAgo(job.lastRun) + '</span>' +
                        statusBadge +
                    '</div>' +
                '</td>' +
                '<td class="px-4 py-3 text-center">' +
                    '<div class="flex justify-center">' +
                        '<div class="mc-toggle cron-toggle' + (job.enabled ? ' active' : '') + '" data-job-id="' + job.id + '"></div>' +
                    '</div>' +
                '</td>' +
                '<td class="px-4 py-3 text-right">' +
                    '<div class="flex items-center justify-end gap-2">' +
                        '<button class="run-cron-btn w-8 h-8 rounded-lg bg-status-normal/10 flex items-center justify-center hover:bg-status-normal/20 transition-colors" data-job-id="' + job.id + '" title="Run Now">' +
                            '<i data-lucide="play" class="w-3.5 h-3.5 text-status-normal"></i>' +
                        '</button>' +
                        '<button class="edit-cron-btn w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" data-job-id="' + job.id + '" title="Edit">' +
                            '<i data-lucide="pencil" class="w-3.5 h-3.5 text-neutral-500"></i>' +
                        '</button>' +
                        '<button class="delete-cron-btn w-8 h-8 rounded-lg bg-status-critical/10 flex items-center justify-center hover:bg-status-critical/20 transition-colors" data-job-id="' + job.id + '" title="Delete">' +
                            '<i data-lucide="trash-2" class="w-3.5 h-3.5 text-status-critical"></i>' +
                        '</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }

        if (filtered.length === 0) {
            html += '<tr><td colspan="6" class="px-4 py-8 text-center font-mono text-[13px] text-neutral-500">No cron jobs found</td></tr>';
        }

        html += '</tbody></table></div></div></div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Reveals */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Bind events */
        document.getElementById('cron-search').addEventListener('input', function (e) {
            searchQuery = e.target.value;
            render();
        });
        document.getElementById('cron-filter-agent').addEventListener('change', function (e) {
            filterAgent = e.target.value;
            render();
        });
        document.getElementById('cron-filter-enabled').addEventListener('change', function (e) {
            filterEnabled = e.target.value;
            render();
        });
        document.getElementById('add-cron-btn').addEventListener('click', function () {
            showModal(null);
        });

        document.querySelectorAll('.cron-toggle').forEach(function (el) {
            el.addEventListener('click', function () {
                var id = this.dataset.jobId;
                var job = MC.store.getCronJob(id);
                if (job) {
                    MC.store.updateCronJob(id, { enabled: !job.enabled });
                    render();
                }
            });
        });

        document.querySelectorAll('.run-cron-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = this.dataset.jobId;
                var result = (MC.engine && MC.engine.executeCronJob)
                    ? MC.engine.executeCronJob(id)
                    : MC.store.runCronJob(id);
                if (result) {
                    showRunResult(id, result);
                }
            });
        });

        document.querySelectorAll('.edit-cron-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var job = MC.store.getCronJob(this.dataset.jobId);
                if (job) showModal(job);
            });
        });

        document.querySelectorAll('.delete-cron-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var job = MC.store.getCronJob(this.dataset.jobId);
                if (job) showConfirm(job);
            });
        });
    }

    /* ---------- Run result toast ---------- */
    function showRunResult(jobId, result) {
        var job = MC.store.getCronJob(jobId);
        var name = job ? job.name : 'Job';
        var toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 z-[120] px-4 py-3 rounded-xl font-mono text-[12px] shadow-lg border transition-all duration-300 ' +
            (result.success
                ? 'bg-status-normal/10 text-status-normal border-status-normal/20'
                : 'bg-status-critical/10 text-status-critical border-status-critical/20');
        toast.innerHTML = '<div class="flex items-center gap-2">' +
            '<i data-lucide="' + (result.success ? 'check-circle' : 'x-circle') + '" class="w-4 h-4"></i>' +
            '<span>' + escapeHtml(name) + ' — ' + result.status + '</span>' +
        '</div>';
        document.body.appendChild(toast);
        lucide.createIcons();
        setTimeout(function () { toast.style.opacity = '0'; }, 2500);
        setTimeout(function () { toast.remove(); render(); }, 3000);
    }

    /* ---------- Add/Edit Modal ---------- */
    function showModal(job) {
        var isEdit = !!job;
        var agents = MC.store.getAgents();
        var overlay = document.createElement('div');
        overlay.className = 'mc-modal-overlay';

        var html = '<div class="mc-modal p-6">' +
            '<div class="flex items-center justify-between mb-6">' +
                '<h2 class="font-mono text-sm font-semibold uppercase tracking-wider">' + (isEdit ? 'Edit Cron Job' : 'Add Cron Job') + '</h2>' +
                '<button class="modal-close w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                    '<i data-lucide="x" class="w-4 h-4"></i>' +
                '</button>' +
            '</div>' +
            '<div class="space-y-4">' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Name</label>' +
                    '<input type="text" id="modal-name" class="mc-input" placeholder="Job name" value="' + (isEdit ? escapeHtml(job.name) : '') + '">' +
                '</div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Cron Expression</label>' +
                    '<input type="text" id="modal-schedule" class="mc-input" placeholder="0 * * * *" value="' + (isEdit ? escapeHtml(job.schedule) : '') + '">' +
                    '<div id="modal-schedule-preview" class="font-mono text-[10px] text-neutral-500 mt-1"></div>' +
                '</div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Agent</label>' +
                    '<select id="modal-agent" class="mc-input mc-select">' +
                        MC.buildAgentOptgroups(isEdit ? job.agentId : '', true) +
                    '</select></div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Action</label>' +
                    '<textarea id="modal-action" class="mc-input mc-textarea" placeholder="Describe what this job does...">' + (isEdit ? escapeHtml(job.action) : '') + '</textarea>' +
                '</div>' +
                '<div class="flex items-center justify-between">' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Enabled</label>' +
                    '<div id="modal-toggle" class="mc-toggle' + (isEdit ? (job.enabled ? ' active' : '') : ' active') + '"></div>' +
                '</div>' +
            '</div>' +
            '<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-mc-border">' +
                '<button class="modal-close font-mono text-[12px] px-4 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                '<button id="modal-save" class="font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' + (isEdit ? 'Save Changes' : 'Add Job') + '</button>' +
            '</div>' +
        '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        lucide.createIcons();

        var enabled = isEdit ? job.enabled : true;

        /* Schedule preview */
        function updatePreview() {
            var val = document.getElementById('modal-schedule').value.trim();
            var preview = document.getElementById('modal-schedule-preview');
            if (val) {
                preview.textContent = cronToHuman(val);
            } else {
                preview.textContent = '';
            }
        }
        updatePreview();
        document.getElementById('modal-schedule').addEventListener('input', updatePreview);

        /* Toggle */
        document.getElementById('modal-toggle').addEventListener('click', function () {
            enabled = !enabled;
            this.classList.toggle('active', enabled);
        });

        /* Close */
        overlay.querySelectorAll('.modal-close').forEach(function (el) {
            el.addEventListener('click', function () { overlay.remove(); });
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.remove();
        });

        /* Save */
        document.getElementById('modal-save').addEventListener('click', function () {
            var name = document.getElementById('modal-name').value.trim();
            var schedule = document.getElementById('modal-schedule').value.trim();
            var agentId = document.getElementById('modal-agent').value || null;
            var action = document.getElementById('modal-action').value.trim();
            if (!name) { document.getElementById('modal-name').focus(); return; }
            if (!schedule) { document.getElementById('modal-schedule').focus(); return; }

            if (isEdit) {
                MC.store.updateCronJob(job.id, { name: name, schedule: schedule, agentId: agentId, action: action, enabled: enabled });
            } else {
                MC.store.addCronJob({ name: name, schedule: schedule, agentId: agentId, action: action, enabled: enabled });
            }
            overlay.remove();
            render();
        });
    }

    /* ---------- Delete confirm ---------- */
    function showConfirm(job) {
        var overlay = document.createElement('div');
        overlay.className = 'mc-confirm-overlay';

        overlay.innerHTML = '<div class="mc-modal p-6 max-w-sm">' +
            '<div class="flex items-center gap-3 mb-4">' +
                '<div class="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">' +
                    '<i data-lucide="alert-triangle" class="w-5 h-5 text-status-critical"></i>' +
                '</div>' +
                '<div>' +
                    '<h3 class="font-mono text-sm font-semibold">Delete Cron Job</h3>' +
                    '<p class="font-mono text-[12px] text-neutral-500">This action cannot be undone.</p>' +
                '</div>' +
            '</div>' +
            '<p class="font-mono text-[13px] mb-6">Are you sure you want to delete <strong>' + escapeHtml(job.name) + '</strong>?</p>' +
            '<div class="flex justify-end gap-3">' +
                '<button class="confirm-cancel font-mono text-[12px] px-4 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                '<button class="confirm-delete font-mono text-[12px] px-4 py-2 rounded-lg bg-status-critical/10 text-status-critical hover:bg-status-critical/20 transition-colors">Delete</button>' +
            '</div>' +
        '</div>';

        document.body.appendChild(overlay);
        lucide.createIcons();

        overlay.querySelector('.confirm-cancel').addEventListener('click', function () { overlay.remove(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('.confirm-delete').addEventListener('click', function () {
            MC.store.deleteCronJob(job.id);
            overlay.remove();
            render();
        });
    }

    document.addEventListener('mc:ready', render);
})();
