/* ========== TASKS / KANBAN PAGE ========== */
(function () {
    'use strict';

    var searchQuery = '';
    var filterAgent = 'all';
    var filterPriority = 'all';

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function getAgentName(agentId) {
        if (!agentId) return null;
        var agent = MC.store.getAgent(agentId);
        return agent ? agent.name : null;
    }

    function card(task) {
        var p = MC.PRIORITY[task.priority] || MC.PRIORITY.medium;
        var agentName = getAgentName(task.agentId);
        var agent = task.agentId ? MC.store.getAgent(task.agentId) : null;
        var initial = agentName ? agentName.charAt(0) : '?';

        var agentHtml = agentName
            ? '<div class="flex items-center gap-1.5">' +
                '<div class="w-5 h-5 rounded-full bg-status-standby/10 flex items-center justify-center text-[10px] font-mono font-medium text-status-standby">' + initial + '</div>' +
                '<span class="font-mono text-[10px] text-neutral-500">' + escapeHtml(agentName) + '</span>' +
                (agent ? MC.getRoleBadgeHtml(agent) : '') +
              '</div>'
            : '<span class="font-mono text-[10px] text-neutral-400 italic">Unassigned</span>';

        return '<div class="task-card p-3 rounded-lg bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border cursor-grab active:cursor-grabbing hover:border-status-standby/30 transition-colors" data-task-id="' + task.id + '">' +
            '<div class="flex items-center justify-between mb-2">' +
                '<span class="text-[10px] font-mono px-1.5 py-0.5 rounded ' + p.css + '">' + p.label + '</span>' +
            '</div>' +
            '<p class="text-[13px] font-medium mb-2 leading-tight">' + escapeHtml(task.title) + '</p>' +
            '<div class="flex items-center justify-between">' +
                agentHtml +
            '</div>' +
        '</div>';
    }

    function render() {
        var tasks = MC.store.getTasks();
        var agents = MC.store.getAgents();

        /* Apply filters */
        var filtered = tasks.filter(function (t) {
            if (filterAgent !== 'all' && t.agentId !== filterAgent) return false;
            if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
            if (searchQuery) {
                var q = searchQuery.toLowerCase();
                if (t.title.toLowerCase().indexOf(q) === -1 &&
                    (t.description || '').toLowerCase().indexOf(q) === -1) return false;
            }
            return true;
        });

        /* Toolbar */
        var html = '<div class="pt-4">' +
            '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 reveal">' +
                '<div class="flex flex-wrap items-center gap-3">' +
                    '<div class="relative">' +
                        '<i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<input type="text" id="task-search" class="mc-input pl-9 w-48" placeholder="Search tasks..." value="' + escapeHtml(searchQuery) + '">' +
                    '</div>' +
                    '<select id="task-filter-agent" class="mc-input mc-select w-36 text-[12px]">' +
                        '<option value="all">All Agents</option>' +
                        MC.buildAgentOptgroups(filterAgent, false) +
                    '</select>' +
                    '<select id="task-filter-priority" class="mc-input mc-select w-32 text-[12px]">' +
                        '<option value="all">All Priority</option>' +
                        '<option value="low"' + (filterPriority === 'low' ? ' selected' : '') + '>Low</option>' +
                        '<option value="medium"' + (filterPriority === 'medium' ? ' selected' : '') + '>Medium</option>' +
                        '<option value="high"' + (filterPriority === 'high' ? ' selected' : '') + '>High</option>' +
                        '<option value="critical"' + (filterPriority === 'critical' ? ' selected' : '') + '>Critical</option>' +
                    '</select>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<button id="bc-toggle-btn" class="bc-toggle-btn flex items-center gap-1.5 font-mono text-[12px] px-3 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" title="Board Chat">' +
                        '<i data-lucide="message-circle" class="w-3.5 h-3.5"></i>' +
                        '<span class="hidden sm:inline">Board</span>' +
                        '<span id="bc-unread-dot" class="bc-unread-dot" style="display:none"></span>' +
                    '</button>' +
                    '<button id="add-task-btn" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' +
                        '<i data-lucide="plus" class="w-3.5 h-3.5"></i> New Task' +
                    '</button>' +
                '</div>' +
            '</div>';

        /* Kanban columns */
        html += '<div class="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:snap-none reveal">';

        for (var ci = 0; ci < MC.COLUMNS.length; ci++) {
            var col = MC.COLUMNS[ci];
            var colTasks = filtered.filter(function (t) { return t.column === col.id; });

            html += '<div class="kanban-col min-w-[220px] flex-1 snap-start">' +
                '<div class="flex items-center gap-2 mb-2.5">' +
                    '<span class="w-2 h-2 rounded-full bg-' + col.color + '"></span>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">' + col.label + '</span>' +
                    '<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-mc-border text-neutral-500">' + colTasks.length + '</span>' +
                '</div>' +
                '<div class="space-y-2 min-h-[160px] p-2 rounded-xl bg-neutral-100/50 dark:bg-mc-dark/50 border border-dashed border-neutral-200 dark:border-mc-border/50" data-column="' + col.id + '">';

            for (var ti = 0; ti < colTasks.length; ti++) {
                html += card(colTasks[ti]);
            }

            html += '</div></div>';
        }

        html += '</div></div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Reveal */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Bind events */
        document.getElementById('task-search').addEventListener('input', function (e) {
            searchQuery = e.target.value;
            render();
        });
        document.getElementById('task-filter-agent').addEventListener('change', function (e) {
            filterAgent = e.target.value;
            render();
        });
        document.getElementById('task-filter-priority').addEventListener('change', function (e) {
            filterPriority = e.target.value;
            render();
        });
        document.getElementById('add-task-btn').addEventListener('click', function () {
            showTaskModal(null);
        });

        /* Board chat toggle */
        document.getElementById('bc-toggle-btn').addEventListener('click', function () {
            if (MC.boardChat) MC.boardChat.toggle();
        });

        /* Click task card to open detail */
        document.querySelectorAll('.task-card').forEach(function (el) {
            el.addEventListener('click', function (e) {
                if (e.target.closest('.sortable-handle')) return;
                var task = MC.store.getTask(this.dataset.taskId);
                if (task) showDetailPanel(task);
            });
        });

        /* Init SortableJS */
        initSortable();
    }

    function initSortable() {
        var cols = document.querySelectorAll('[data-column]');
        cols.forEach(function (el) {
            new Sortable(el, {
                group: 'tasks',
                animation: 200,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                onEnd: function (evt) {
                    var taskId = evt.item.dataset.taskId;
                    var newCol = evt.to.dataset.column;
                    MC.store.moveTask(taskId, newCol);
                    updateColumnCounts();
                }
            });
        });
    }

    function updateColumnCounts() {
        var tasks = MC.store.getTasks();
        MC.COLUMNS.forEach(function (col) {
            var count = tasks.filter(function (t) { return t.column === col.id; }).length;
            var container = document.querySelector('[data-column="' + col.id + '"]');
            if (container) {
                var badge = container.parentElement.querySelector('.rounded.bg-neutral-200, .rounded.dark\\:bg-mc-border');
                if (!badge) {
                    var badges = container.parentElement.querySelectorAll('.font-mono.text-\\[10px\\]');
                    badges.forEach(function (b) {
                        if (b.classList.contains('rounded')) b.textContent = count;
                    });
                }
            }
        });
    }

    /* ---------- Task Modal ---------- */
    function showTaskModal(task) {
        var isEdit = !!task;
        var overlay = document.createElement('div');
        overlay.className = 'mc-modal-overlay';

        var html = '<div class="mc-modal p-6">' +
            '<div class="flex items-center justify-between mb-6">' +
                '<h2 class="font-mono text-sm font-semibold uppercase tracking-wider">' + (isEdit ? 'Edit Task' : 'New Task') + '</h2>' +
                '<button class="modal-close w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                    '<i data-lucide="x" class="w-4 h-4"></i>' +
                '</button>' +
            '</div>' +
            '<div class="space-y-4">' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Title</label>' +
                    '<input type="text" id="modal-title" class="mc-input" placeholder="Task title" value="' + (isEdit ? escapeHtml(task.title) : '') + '">' +
                '</div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Description</label>' +
                    '<textarea id="modal-desc" class="mc-input mc-textarea" placeholder="Task description...">' + (isEdit ? escapeHtml(task.description) : '') + '</textarea>' +
                '</div>' +
                '<div class="grid grid-cols-2 gap-3">' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Priority</label>' +
                        '<select id="modal-priority" class="mc-input mc-select">' +
                            '<option value="low"' + (isEdit && task.priority === 'low' ? ' selected' : '') + '>Low</option>' +
                            '<option value="medium"' + (isEdit && task.priority === 'medium' ? ' selected' : (!isEdit ? ' selected' : '')) + '>Medium</option>' +
                            '<option value="high"' + (isEdit && task.priority === 'high' ? ' selected' : '') + '>High</option>' +
                            '<option value="critical"' + (isEdit && task.priority === 'critical' ? ' selected' : '') + '>Critical</option>' +
                        '</select>' +
                    '</div>' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Assign Agent</label>' +
                        '<select id="modal-agent" class="mc-input mc-select">' +
                            MC.buildAgentOptgroups(isEdit ? task.agentId : '', true) +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div id="skill-match-hint"></div>' +
            '</div>' +
            '<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-mc-border">' +
                '<button class="modal-close font-mono text-[12px] px-4 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                '<button id="modal-save" class="font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' + (isEdit ? 'Save' : 'Create Task') + '</button>' +
            '</div>' +
        '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        lucide.createIcons();

        overlay.querySelectorAll('.modal-close').forEach(function (el) {
            el.addEventListener('click', function () { overlay.remove(); });
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.remove();
        });

        /* Skill-match hint */
        function updateSkillHint() {
            var hintEl = document.getElementById('skill-match-hint');
            if (!hintEl || !MC.engine || !MC.engine.suggestAgent) return;
            var title = document.getElementById('modal-title').value;
            var desc = document.getElementById('modal-desc').value;
            var selectedAgent = document.getElementById('modal-agent').value;
            if (!title) { hintEl.innerHTML = ''; return; }

            var suggestions = MC.engine.suggestAgent({ title: title, description: desc });
            if (suggestions.length === 0) { hintEl.innerHTML = ''; return; }

            var best = suggestions[0];
            var isMatch = selectedAgent === best.agent.id;
            var skillNames = best.matchedSkills.map(function(sid) {
                var s = MC.store.getSkill(sid);
                return s ? s.name : sid;
            }).join(', ');

            if (isMatch) {
                hintEl.innerHTML = '<div class="flex items-center gap-1.5 mt-2">' +
                    '<i data-lucide="check-circle" class="w-3 h-3 text-status-normal"></i>' +
                    '<span class="font-mono text-[10px] text-status-normal">Good match: ' + skillNames + '</span>' +
                '</div>';
            } else {
                hintEl.innerHTML = '<div class="flex items-center gap-1.5 mt-2">' +
                    '<i data-lucide="lightbulb" class="w-3 h-3 text-status-serious"></i>' +
                    '<span class="font-mono text-[10px] text-status-serious">Suggested: ' +
                        best.agent.name + ' (skills: ' + skillNames + ')</span>' +
                '</div>';
            }
            lucide.createIcons();
        }
        document.getElementById('modal-agent').addEventListener('change', updateSkillHint);
        document.getElementById('modal-title').addEventListener('input', updateSkillHint);
        document.getElementById('modal-desc').addEventListener('input', updateSkillHint);
        updateSkillHint();

        document.getElementById('modal-save').addEventListener('click', function () {
            var title = document.getElementById('modal-title').value.trim();
            if (!title) { document.getElementById('modal-title').focus(); return; }

            var data = {
                title: title,
                description: document.getElementById('modal-desc').value.trim(),
                priority: document.getElementById('modal-priority').value,
                agentId: document.getElementById('modal-agent').value || null,
            };

            if (isEdit) {
                MC.store.updateTask(task.id, data);
                MC.store.log('System', 'task-updated', 'Task updated: ' + title, 'standby');
            } else {
                if (data.agentId) data.column = 'assigned';
                MC.store.addTask(data);
            }
            overlay.remove();
            render();
        });
    }

    /* ---------- Detail Modal (two-panel) ---------- */
    function showDetailPanel(task) {
        /* Close board chat if open */
        if (MC.boardChat && MC.boardChat.isOpen()) {
            MC.boardChat.close();
        }

        var agentName = getAgentName(task.agentId);
        var agent = task.agentId ? MC.store.getAgent(task.agentId) : null;
        var p = MC.PRIORITY[task.priority] || MC.PRIORITY.medium;
        var colInfo = MC.COLUMNS.find(function (c) { return c.id === task.column; });
        var comments = MC.store.getTaskComments(task.id);

        var overlay = document.createElement('div');
        overlay.className = 'mc-modal-overlay';
        overlay.id = 'task-detail-modal';

        /* --- LEFT PANEL: title, description, comments --- */
        var leftHtml = '<div class="flex-1 min-w-0 p-6 overflow-y-auto mc-scroll">' +
            /* Title */
            '<h2 class="text-[16px] font-semibold leading-snug mb-2">' + escapeHtml(task.title) + '</h2>' +
            /* Description */
            '<div class="mb-6">' +
                '<p class="font-mono text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed">' +
                    (escapeHtml(task.description) || '<span class="italic text-neutral-400">No description provided.</span>') +
                '</p>' +
            '</div>' +
            /* Comments section */
            '<div class="border-t border-neutral-200 dark:border-mc-border pt-4">' +
                '<div class="flex items-center gap-2 mb-4">' +
                    '<i data-lucide="message-circle" class="w-4 h-4 text-neutral-400"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Activity</span>' +
                    '<span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-mc-border text-neutral-500">' + comments.length + '</span>' +
                '</div>' +
                /* Comment input */
                '<div class="flex gap-3 mb-4">' +
                    '<div class="w-7 h-7 rounded-full bg-status-standby/10 flex items-center justify-center flex-shrink-0 mt-0.5">' +
                        '<i data-lucide="user" class="w-3.5 h-3.5 text-status-standby"></i>' +
                    '</div>' +
                    '<div class="flex-1">' +
                        '<textarea id="detail-comment-input" class="mc-input font-mono text-[12px] resize-none w-full" rows="2" placeholder="Write a comment..."></textarea>' +
                        '<div class="flex justify-end mt-2">' +
                            '<button id="detail-comment-submit" class="font-mono text-[11px] px-3 py-1.5 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">Comment</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                /* Existing comments */
                '<div id="detail-comments-list" class="space-y-3">';

        if (comments.length === 0) {
            leftHtml += '<p class="font-mono text-[11px] text-neutral-400 italic text-center py-4">No activity yet</p>';
        } else {
            for (var ci = 0; ci < comments.length; ci++) {
                var c = comments[ci];
                var timeAgo = formatTimeAgo(c.timestamp);
                leftHtml += '<div class="flex gap-3">' +
                    '<div class="w-7 h-7 rounded-full bg-neutral-200 dark:bg-mc-hover flex items-center justify-center flex-shrink-0 mt-0.5">' +
                        '<i data-lucide="user" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                    '</div>' +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-2 mb-0.5">' +
                            '<span class="font-mono text-[11px] font-medium">Operator</span>' +
                            '<span class="font-mono text-[10px] text-neutral-400">' + timeAgo + '</span>' +
                        '</div>' +
                        '<p class="font-mono text-[12px] text-neutral-600 dark:text-neutral-400 leading-relaxed">' + escapeHtml(c.text) + '</p>' +
                    '</div>' +
                '</div>';
            }
        }

        leftHtml += '</div></div></div>';

        /* --- RIGHT PANEL: metadata sidebar --- */
        var rightHtml = '<div class="w-full md:w-64 flex-shrink-0 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-mc-border p-5 overflow-y-auto mc-scroll bg-neutral-50/50 dark:bg-mc-dark/50">' +
            /* Close button */
            '<div class="flex justify-end mb-3">' +
                '<button id="close-detail-modal" class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                    '<i data-lucide="x" class="w-4 h-4"></i>' +
                '</button>' +
            '</div>' +
            /* Status / Column */
            '<div class="mb-5">' +
                '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-1.5">Status</span>' +
                '<select id="detail-column-select" class="mc-input mc-select text-[12px] py-1.5 w-full">';

        for (var si = 0; si < MC.COLUMNS.length; si++) {
            var col = MC.COLUMNS[si];
            rightHtml += '<option value="' + col.id + '"' + (task.column === col.id ? ' selected' : '') + '>' + col.label + '</option>';
        }

        rightHtml += '</select></div>' +
            /* Assignee */
            '<div class="mb-5">' +
                '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-1.5">Assignee</span>' +
                '<select id="detail-agent-select" class="mc-input mc-select text-[12px] py-1.5 w-full">' +
                    MC.buildAgentOptgroups(task.agentId, true) +
                '</select>' +
            '</div>' +
            /* Priority */
            '<div class="mb-5">' +
                '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-1.5">Priority</span>' +
                '<span class="text-[11px] font-mono px-2 py-1 rounded inline-block ' + p.css + '">' + p.label + '</span>' +
            '</div>' +
            /* Created */
            '<div class="mb-5">' +
                '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-1.5">Created</span>' +
                '<span class="font-mono text-[11px] text-neutral-500">' + new Date(task.createdAt).toLocaleDateString() + '</span>' +
            '</div>' +
            /* Updated */
            '<div class="mb-5">' +
                '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-1.5">Updated</span>' +
                '<span class="font-mono text-[11px] text-neutral-500">' + new Date(task.updatedAt).toLocaleDateString() + '</span>' +
            '</div>' +
            /* Actions */
            '<div class="pt-4 border-t border-neutral-200 dark:border-mc-border space-y-2">' +
                '<span class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block mb-2">Actions</span>' +
                '<button id="detail-edit" class="w-full font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors flex items-center justify-center gap-2">' +
                    '<i data-lucide="pencil" class="w-3.5 h-3.5"></i> Edit Task' +
                '</button>' +
                '<button id="detail-delete" class="w-full font-mono text-[12px] px-4 py-2 rounded-lg bg-status-critical/10 text-status-critical hover:bg-status-critical/20 transition-colors flex items-center justify-center gap-2">' +
                    '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete' +
                '</button>' +
            '</div>' +
        '</div>';

        /* --- Assemble modal --- */
        overlay.innerHTML = '<div class="task-detail-modal rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border shadow-2xl overflow-hidden flex flex-col md:flex-row" style="width:90vw;max-width:820px;max-height:85vh">' +
            leftHtml +
            rightHtml +
        '</div>';

        document.body.appendChild(overlay);
        lucide.createIcons();

        /* --- Event bindings --- */
        var dirty = false;
        function closeModal() { overlay.remove(); if (dirty) render(); }

        document.getElementById('close-detail-modal').addEventListener('click', closeModal);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });

        /* Inline status change */
        document.getElementById('detail-column-select').addEventListener('change', function () {
            MC.store.moveTask(task.id, this.value);
            task = MC.store.getTask(task.id);
            dirty = true;
        });

        /* Inline assignee change */
        document.getElementById('detail-agent-select').addEventListener('change', function () {
            var newAgentId = this.value || null;
            MC.store.updateTask(task.id, { agentId: newAgentId });
            task = MC.store.getTask(task.id);
            dirty = true;
        });

        /* Comment submit */
        document.getElementById('detail-comment-submit').addEventListener('click', function () {
            var input = document.getElementById('detail-comment-input');
            var text = input.value.trim();
            if (!text) { input.focus(); return; }
            MC.store.addTaskComment(task.id, text);
            task = MC.store.getTask(task.id);
            closeModal();
            showDetailPanel(task);
        });

        /* Edit */
        document.getElementById('detail-edit').addEventListener('click', function () {
            closeModal();
            showTaskModal(task);
        });

        /* Delete */
        document.getElementById('detail-delete').addEventListener('click', function () {
            MC.store.deleteTask(task.id);
            closeModal();
            render();
        });
    }

    function formatTimeAgo(timestamp) {
        var diff = Date.now() - new Date(timestamp).getTime();
        var mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return mins + 'm ago';
        var hours = Math.floor(mins / 60);
        if (hours < 24) return hours + 'h ago';
        var days = Math.floor(hours / 24);
        if (days < 30) return days + 'd ago';
        return new Date(timestamp).toLocaleDateString();
    }

    document.addEventListener('mc:ready', render);
})();
