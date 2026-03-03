/* ========== MEMORY BROWSER PAGE ========== */
(function () {
    'use strict';

    var selectedAgentId = null;
    var searchQuery = '';
    var editingEntryId = null;

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

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
        return '<div class="w-8 h-8 rounded-lg ' + cls + ' flex items-center justify-center flex-shrink-0">' +
            '<i data-lucide="' + (agent.icon || 'zap') + '" class="w-4 h-4"></i>' +
        '</div>';
    }

    function render() {
        var agents = MC.store.getAgents();
        if (!selectedAgentId && agents.length > 0) {
            selectedAgentId = agents[0].id;
        }

        var html = '<div class="pt-4 flex flex-col md:flex-row gap-4">';

        /* Agent list sidebar — grouped by department */
        var grouped = MC.store.getAgentsGrouped();

        html += '<div class="chat-sidebar md:flex-shrink-0 reveal">' +
            '<div class="flex items-center gap-2 mb-3">' +
                '<i data-lucide="users" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Agents</span>' +
            '</div>' +
            '<div class="rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border overflow-hidden">' +
                '<div class="max-h-[300px] md:max-h-[calc(100vh-180px)] overflow-y-auto mc-scroll">';

        for (var gi = 0; gi < grouped.order.length; gi++) {
            var dept = grouped.order[gi];
            var deptAgents = grouped.groups[dept];
            if (!deptAgents || deptAgents.length === 0) continue;

            var dInfo = MC.DEPARTMENTS[dept] || { label: dept, icon: 'folder' };
            html += '<div class="px-3 pt-2.5 pb-1">' +
                '<div class="flex items-center gap-1.5">' +
                    '<i data-lucide="' + dInfo.icon + '" class="w-2.5 h-2.5 text-neutral-400"></i>' +
                    '<span class="font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">' + dInfo.label + '</span>' +
                '</div>' +
            '</div>';

            for (var i = 0; i < deptAgents.length; i++) {
                var a = deptAgents[i];
                var isSelected = a.id === selectedAgentId;
                var entryCount = MC.store.getAgentMemory(a.id).length;
                html += '<button class="memory-agent-btn w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors text-left' +
                    (isSelected ? ' bg-status-standby/5' : '') + '" data-agent-id="' + a.id + '">' +
                    getAgentIconHtml(a) +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-1.5">' +
                            '<span class="font-mono text-[13px] font-medium' + (isSelected ? ' text-status-standby' : '') + '">' + escapeHtml(a.name) + '</span>' +
                            MC.getRoleBadgeHtml(a) +
                        '</div>' +
                        '<div class="font-mono text-[10px] text-neutral-500">' + entryCount + ' entries</div>' +
                    '</div>' +
                '</button>';
            }
        }

        html += '</div></div></div>';

        /* Memory panel */
        html += '<div class="flex-1 reveal">';

        if (selectedAgentId) {
            var agent = MC.store.getAgent(selectedAgentId);
            var entries = MC.store.getAgentMemory(selectedAgentId);

            /* Filter entries */
            var filtered = entries;
            if (searchQuery) {
                var q = searchQuery.toLowerCase();
                filtered = entries.filter(function (e) {
                    return e.key.toLowerCase().indexOf(q) !== -1 ||
                           e.value.toLowerCase().indexOf(q) !== -1;
                });
            }

            /* Header */
            html += '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">' +
                '<div class="flex items-center gap-2">' +
                    '<i data-lucide="brain" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">' + (agent ? escapeHtml(agent.name) : '') + ' Memory</span>' +
                    '<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-mc-border text-neutral-500">' + filtered.length + '</span>' +
                '</div>' +
                '<div class="flex items-center gap-3">' +
                    '<div class="relative">' +
                        '<i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<input type="text" id="memory-search" class="mc-input pl-9 w-40" placeholder="Search..." value="' + escapeHtml(searchQuery) + '">' +
                    '</div>' +
                    '<button id="add-memory-btn" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' +
                        '<i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Entry' +
                    '</button>' +
                '</div>' +
            '</div>';

            /* Add entry form (hidden by default) */
            html += '<div id="add-entry-form" class="hidden mb-4 p-4 rounded-xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">' +
                '<div class="space-y-3">' +
                    '<input type="text" id="new-entry-key" class="mc-input" placeholder="Key (e.g. preferred-language)">' +
                    '<textarea id="new-entry-value" class="mc-input mc-textarea" placeholder="Value..."></textarea>' +
                    '<div class="flex justify-end gap-2">' +
                        '<button id="cancel-add-entry" class="font-mono text-[12px] px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                        '<button id="save-add-entry" class="font-mono text-[12px] px-3 py-1.5 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">Save</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

            /* Entries */
            html += '<div class="space-y-3">';

            if (filtered.length === 0) {
                html += '<div class="p-8 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border text-center">' +
                    '<p class="font-mono text-[13px] text-neutral-500">No memory entries' + (searchQuery ? ' matching "' + escapeHtml(searchQuery) + '"' : '') + '</p>' +
                '</div>';
            }

            for (var ei = 0; ei < filtered.length; ei++) {
                var entry = filtered[ei];
                var isEditing = editingEntryId === entry.id;

                if (isEditing) {
                    html += '<div class="p-4 rounded-xl bg-white dark:bg-mc-card border border-status-standby/30">' +
                        '<div class="space-y-3">' +
                            '<input type="text" class="mc-input edit-entry-key" value="' + escapeHtml(entry.key) + '" data-entry-id="' + entry.id + '">' +
                            '<textarea class="mc-input mc-textarea edit-entry-value" data-entry-id="' + entry.id + '">' + escapeHtml(entry.value) + '</textarea>' +
                            '<div class="flex justify-end gap-2">' +
                                '<button class="cancel-edit-btn font-mono text-[12px] px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" data-entry-id="' + entry.id + '">Cancel</button>' +
                                '<button class="save-edit-btn font-mono text-[12px] px-3 py-1.5 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors" data-entry-id="' + entry.id + '">Save</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                } else {
                    html += '<div class="p-4 rounded-xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border hover:border-neutral-300 dark:hover:border-mc-border transition-colors">' +
                        '<div class="flex items-start justify-between gap-3">' +
                            '<div class="flex-1 min-w-0">' +
                                '<div class="font-mono text-[12px] font-semibold text-status-standby mb-1">' + escapeHtml(entry.key) + '</div>' +
                                '<p class="font-mono text-[13px] text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">' + escapeHtml(entry.value) + '</p>' +
                                '<span class="font-mono text-[9px] text-neutral-400 mt-2 block tabular-nums">Updated: ' + new Date(entry.updatedAt).toLocaleString() + '</span>' +
                            '</div>' +
                            '<div class="flex items-center gap-1 flex-shrink-0">' +
                                '<button class="edit-entry-btn w-7 h-7 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" data-entry-id="' + entry.id + '" title="Edit">' +
                                    '<i data-lucide="pencil" class="w-3 h-3 text-neutral-500"></i>' +
                                '</button>' +
                                '<button class="delete-entry-btn w-7 h-7 rounded-lg bg-status-critical/10 flex items-center justify-center hover:bg-status-critical/20 transition-colors" data-entry-id="' + entry.id + '" title="Delete">' +
                                    '<i data-lucide="trash-2" class="w-3 h-3 text-status-critical"></i>' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }
            }

            html += '</div>';
        } else {
            html += '<div class="flex items-center justify-center h-64">' +
                '<p class="font-mono text-[13px] text-neutral-500">Select an agent to view memory.</p>' +
            '</div>';
        }

        html += '</div></div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Reveal */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Bind events */
        document.querySelectorAll('.memory-agent-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selectedAgentId = this.dataset.agentId;
                editingEntryId = null;
                searchQuery = '';
                render();
            });
        });

        var searchInput = document.getElementById('memory-search');
        if (searchInput) {
            searchInput.addEventListener('input', function (e) {
                searchQuery = e.target.value;
                render();
            });
        }

        var addBtn = document.getElementById('add-memory-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                var form = document.getElementById('add-entry-form');
                form.classList.toggle('hidden');
            });
        }

        var cancelAdd = document.getElementById('cancel-add-entry');
        if (cancelAdd) {
            cancelAdd.addEventListener('click', function () {
                document.getElementById('add-entry-form').classList.add('hidden');
            });
        }

        var saveAdd = document.getElementById('save-add-entry');
        if (saveAdd) {
            saveAdd.addEventListener('click', function () {
                var key = document.getElementById('new-entry-key').value.trim();
                var value = document.getElementById('new-entry-value').value.trim();
                if (!key) { document.getElementById('new-entry-key').focus(); return; }
                MC.store.addMemoryEntry(selectedAgentId, key, value);
                render();
            });
        }

        document.querySelectorAll('.edit-entry-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                editingEntryId = this.dataset.entryId;
                render();
            });
        });

        document.querySelectorAll('.cancel-edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                editingEntryId = null;
                render();
            });
        });

        document.querySelectorAll('.save-edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var entryId = this.dataset.entryId;
                var keyInput = document.querySelector('.edit-entry-key[data-entry-id="' + entryId + '"]');
                var valueInput = document.querySelector('.edit-entry-value[data-entry-id="' + entryId + '"]');
                if (keyInput && valueInput) {
                    var key = keyInput.value.trim();
                    var value = valueInput.value.trim();
                    if (!key) { keyInput.focus(); return; }
                    MC.store.updateMemoryEntry(selectedAgentId, entryId, key, value);
                }
                editingEntryId = null;
                render();
            });
        });

        document.querySelectorAll('.delete-entry-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                MC.store.deleteMemoryEntry(selectedAgentId, this.dataset.entryId);
                render();
            });
        });
    }

    document.addEventListener('mc:ready', render);
})();
