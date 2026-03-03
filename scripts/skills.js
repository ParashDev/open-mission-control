/* ========== SKILLS LIBRARY PAGE ========== */
(function () {
    'use strict';

    var searchQuery = '';

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function countLines(str) {
        if (!str) return 0;
        return str.split('\n').length;
    }

    function render() {
        var skills = MC.store.getSkills();

        /* Filter */
        var filtered = skills.filter(function (s) {
            if (!searchQuery) return true;
            var q = searchQuery.toLowerCase();
            return s.name.toLowerCase().indexOf(q) !== -1 ||
                   s.description.toLowerCase().indexOf(q) !== -1 ||
                   (s.instructions && s.instructions.toLowerCase().indexOf(q) !== -1);
        });

        var html = '<div class="pt-4">' +
            /* Toolbar */
            '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 reveal">' +
                '<div class="flex items-center gap-3 w-full sm:w-auto">' +
                    '<div class="relative flex-1 sm:flex-none sm:w-64">' +
                        '<i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<input type="text" id="skill-search" class="mc-input pl-9" placeholder="Search skills..." value="' + escapeHtml(searchQuery) + '">' +
                    '</div>' +
                '</div>' +
                '<button id="add-skill-btn" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' +
                    '<i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Skill' +
                '</button>' +
            '</div>';

        /* Grid */
        html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 reveal">';

        if (filtered.length === 0) {
            html += '<div class="col-span-full text-center py-12 font-mono text-[13px] text-neutral-500">No skills found</div>';
        }

        for (var i = 0; i < filtered.length; i++) {
            var s = filtered[i];
            var agentCount = MC.store.getSkillAgentCount(s.id);
            var instrLines = countLines(s.instructions);

            html += '<div class="skill-card rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer" data-skill-id="' + s.id + '">' +
                '<div class="flex items-start gap-4">' +
                    /* Icon */
                    '<div class="w-10 h-10 rounded-xl bg-status-standby/10 flex items-center justify-center flex-shrink-0">' +
                        '<i data-lucide="' + (s.icon || 'sparkles') + '" class="w-5 h-5 text-status-standby"></i>' +
                    '</div>' +
                    /* Content */
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-2 mb-1.5">' +
                            '<h3 class="font-mono text-[13px] font-semibold truncate">' + escapeHtml(s.name) + '</h3>' +
                            (agentCount > 0
                                ? '<span class="flex-shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full bg-status-standby/10 text-status-standby">' + agentCount + ' agent' + (agentCount !== 1 ? 's' : '') + '</span>'
                                : '') +
                        '</div>' +
                        /* Trigger description */
                        '<p class="font-mono text-[11px] text-neutral-500 leading-relaxed line-clamp-2 mb-2">' + escapeHtml(s.description) + '</p>' +
                        /* Meta row */
                        '<div class="flex items-center gap-3">' +
                            (instrLines > 0
                                ? '<span class="font-mono text-[10px] text-neutral-400 flex items-center gap-1"><i data-lucide="file-code" class="w-3 h-3"></i>' + instrLines + ' lines</span>'
                                : '<span class="font-mono text-[10px] text-status-serious flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i>No instructions</span>') +
                        '</div>' +
                    '</div>' +
                    /* Actions */
                    '<div class="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">' +
                        '<button class="edit-skill-btn w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" data-skill-id="' + s.id + '" title="Edit">' +
                            '<i data-lucide="pencil" class="w-3.5 h-3.5 text-neutral-500"></i>' +
                        '</button>' +
                        '<button class="delete-skill-btn w-8 h-8 rounded-lg bg-status-critical/10 flex items-center justify-center hover:bg-status-critical/20 transition-colors" data-skill-id="' + s.id + '" title="Delete">' +
                            '<i data-lucide="trash-2" class="w-3.5 h-3.5 text-status-critical"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }

        html += '</div></div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Trigger reveals */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Bind events */
        document.getElementById('skill-search').addEventListener('input', function (e) {
            searchQuery = e.target.value;
            render();
        });
        document.getElementById('add-skill-btn').addEventListener('click', function () {
            showModal(null);
        });

        /* Card click → view detail */
        document.querySelectorAll('.skill-card').forEach(function (card) {
            card.addEventListener('click', function (e) {
                /* Don't trigger if clicking edit/delete buttons */
                if (e.target.closest('.edit-skill-btn') || e.target.closest('.delete-skill-btn')) return;
                var skill = MC.store.getSkill(this.dataset.skillId);
                if (skill) showDetail(skill);
            });
        });

        document.querySelectorAll('.edit-skill-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var skill = MC.store.getSkill(this.dataset.skillId);
                if (skill) showModal(skill);
            });
        });
        document.querySelectorAll('.delete-skill-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var skill = MC.store.getSkill(this.dataset.skillId);
                if (skill) showConfirm(skill);
            });
        });
    }

    /* ---------- Detail View ---------- */
    function showDetail(skill) {
        var overlay = document.createElement('div');
        overlay.className = 'mc-modal-overlay';

        var agentCount = MC.store.getSkillAgentCount(skill.id);
        var agents = MC.store.getAgents().filter(function (a) {
            return a.skills && a.skills.indexOf(skill.id) !== -1;
        });

        var agentListHtml = '';
        if (agents.length > 0) {
            agentListHtml = '<div class="mt-4 pt-4 border-t border-neutral-200 dark:border-mc-border">' +
                '<label class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-2 block">Assigned Agents</label>' +
                '<div class="flex flex-wrap gap-2">';
            for (var i = 0; i < agents.length; i++) {
                agentListHtml += '<span class="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-mc-hover text-neutral-600 dark:text-neutral-400">' + escapeHtml(agents[i].name) + '</span>';
            }
            agentListHtml += '</div></div>';
        }

        /* Render instructions as formatted blocks */
        var instrHtml = '';
        if (skill.instructions) {
            instrHtml = '<div class="mt-4">' +
                '<label class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-2 block">Instructions</label>' +
                '<pre class="font-mono text-[11px] text-neutral-300 leading-relaxed whitespace-pre-wrap bg-neutral-950 border border-mc-border rounded-xl p-4 max-h-80 overflow-y-auto mc-scroll">' + escapeHtml(skill.instructions) + '</pre>' +
            '</div>';
        } else {
            instrHtml = '<div class="mt-4 p-4 rounded-xl bg-status-serious/5 border border-status-serious/20">' +
                '<p class="font-mono text-[11px] text-status-serious">No instructions defined. This skill has no executable content — it\'s just a label. Edit it to add instructions.</p>' +
            '</div>';
        }

        overlay.innerHTML = '<div class="mc-modal p-6" style="max-width:640px">' +
            '<div class="flex items-start justify-between mb-4">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-10 h-10 rounded-xl bg-status-standby/10 flex items-center justify-center">' +
                        '<i data-lucide="' + (skill.icon || 'sparkles') + '" class="w-5 h-5 text-status-standby"></i>' +
                    '</div>' +
                    '<div>' +
                        '<h2 class="font-mono text-sm font-semibold">' + escapeHtml(skill.name) + '</h2>' +
                        (agentCount > 0
                            ? '<span class="font-mono text-[10px] text-status-standby">' + agentCount + ' agent' + (agentCount !== 1 ? 's' : '') + ' using this skill</span>'
                            : '<span class="font-mono text-[10px] text-neutral-500">Not assigned to any agents</span>') +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<button class="detail-edit-btn w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" title="Edit">' +
                        '<i data-lucide="pencil" class="w-3.5 h-3.5 text-neutral-500"></i>' +
                    '</button>' +
                    '<button class="modal-close w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                        '<i data-lucide="x" class="w-4 h-4"></i>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            /* Trigger description */
            '<div>' +
                '<label class="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5 block">Trigger Description</label>' +
                '<p class="font-mono text-[12px] text-neutral-400 leading-relaxed">' + escapeHtml(skill.description) + '</p>' +
            '</div>' +
            instrHtml +
            agentListHtml +
        '</div>';

        document.body.appendChild(overlay);
        lucide.createIcons();

        overlay.querySelectorAll('.modal-close').forEach(function (el) {
            el.addEventListener('click', function () { overlay.remove(); });
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.remove();
        });
        overlay.querySelector('.detail-edit-btn').addEventListener('click', function () {
            overlay.remove();
            showModal(skill);
        });
    }

    /* ---------- Add/Edit Modal ---------- */
    function showModal(skill) {
        var isEdit = !!skill;
        var overlay = document.createElement('div');
        overlay.className = 'mc-modal-overlay';
        overlay.id = 'skill-modal';

        var html = '<div class="mc-modal p-6" style="max-width:640px">' +
            '<div class="flex items-center justify-between mb-6">' +
                '<h2 class="font-mono text-sm font-semibold uppercase tracking-wider">' + (isEdit ? 'Edit Skill' : 'Add Skill') + '</h2>' +
                '<button class="modal-close w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                    '<i data-lucide="x" class="w-4 h-4"></i>' +
                '</button>' +
            '</div>' +
            '<div class="space-y-4">' +
                /* Name + Icon row */
                '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Name</label>' +
                        '<input type="text" id="modal-skill-name" class="mc-input" placeholder="e.g. code-review" value="' + (isEdit ? escapeHtml(skill.name) : '') + '">' +
                    '</div>' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Icon</label>' +
                        '<div class="flex flex-wrap gap-1.5" id="skill-icon-picker">';

        var icons = MC.SKILL_ICONS;
        for (var j = 0; j < icons.length; j++) {
            var ic = icons[j];
            var selected = isEdit && skill.icon === ic ? ' selected' : '';
            if (!isEdit && j === 0) selected = ' selected';
            html += '<div class="icon-picker-item' + selected + '" data-icon="' + ic + '" style="width:32px;height:32px">' +
                '<i data-lucide="' + ic + '" class="w-[14px] h-[14px]"></i>' +
            '</div>';
        }

        html += '</div></div></div>' +
                /* Description (trigger) */
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Trigger Description</label>' +
                    '<p class="font-mono text-[10px] text-neutral-400 mb-1.5">When should the agent activate this skill? Include keywords, contexts, and user phrases that should trigger it.</p>' +
                    '<textarea id="modal-skill-desc" class="mc-input resize-none font-mono text-[12px]" rows="3" placeholder="Use this skill when someone asks about...">' + (isEdit ? escapeHtml(skill.description) : '') + '</textarea>' +
                '</div>' +
                /* Instructions (body) */
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1 block">Instructions</label>' +
                    '<p class="font-mono text-[10px] text-neutral-400 mb-1.5">Step-by-step instructions the agent follows when this skill activates. Use markdown. Include process, output format, examples, and edge cases.</p>' +
                    '<textarea id="modal-skill-instr" class="mc-input resize-y font-mono text-[12px] leading-relaxed" rows="12" placeholder="# Skill Name\n\n## Process\n1. First step...\n2. Second step...\n\n## Output Format\n...\n\n## Examples\n...">' + (isEdit && skill.instructions ? escapeHtml(skill.instructions) : '') + '</textarea>' +
                '</div>' +
            '</div>' +
            '<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-mc-border">' +
                '<button class="modal-close font-mono text-[12px] px-4 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                '<button id="modal-skill-save" class="font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' + (isEdit ? 'Save Changes' : 'Add Skill') + '</button>' +
            '</div>' +
        '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        lucide.createIcons();

        /* Selected icon tracking */
        var selectedIcon = isEdit ? skill.icon : icons[0];

        overlay.querySelectorAll('.icon-picker-item').forEach(function (el) {
            el.addEventListener('click', function () {
                overlay.querySelectorAll('.icon-picker-item').forEach(function (e) { e.classList.remove('selected'); });
                this.classList.add('selected');
                selectedIcon = this.dataset.icon;
            });
        });

        overlay.querySelectorAll('.modal-close').forEach(function (el) {
            el.addEventListener('click', function () { overlay.remove(); });
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.remove();
        });

        document.getElementById('modal-skill-save').addEventListener('click', function () {
            var name = document.getElementById('modal-skill-name').value.trim();
            var description = document.getElementById('modal-skill-desc').value.trim();
            var instructions = document.getElementById('modal-skill-instr').value;
            if (!name) { document.getElementById('modal-skill-name').focus(); return; }

            if (isEdit) {
                MC.store.updateSkill(skill.id, { name: name, description: description, instructions: instructions, icon: selectedIcon });
            } else {
                MC.store.addSkill({ name: name, description: description, instructions: instructions, icon: selectedIcon });
            }
            overlay.remove();
            render();
        });
    }

    /* ---------- Confirm delete ---------- */
    function showConfirm(skill) {
        var agentCount = MC.store.getSkillAgentCount(skill.id);
        var overlay = document.createElement('div');
        overlay.className = 'mc-confirm-overlay';

        var warningHtml = agentCount > 0
            ? '<p class="font-mono text-[11px] text-status-serious mb-4 px-3 py-2 rounded-lg bg-status-serious/10">This skill is assigned to ' + agentCount + ' agent' + (agentCount !== 1 ? 's' : '') + '. It will be removed from all of them.</p>'
            : '';

        overlay.innerHTML = '<div class="mc-modal p-6 max-w-sm">' +
            '<div class="flex items-center gap-3 mb-4">' +
                '<div class="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">' +
                    '<i data-lucide="alert-triangle" class="w-5 h-5 text-status-critical"></i>' +
                '</div>' +
                '<div>' +
                    '<h3 class="font-mono text-sm font-semibold">Delete Skill</h3>' +
                    '<p class="font-mono text-[12px] text-neutral-500">This action cannot be undone.</p>' +
                '</div>' +
            '</div>' +
            warningHtml +
            '<p class="font-mono text-[13px] mb-6">Are you sure you want to delete <strong>' + escapeHtml(skill.name) + '</strong>?</p>' +
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
            MC.store.deleteSkill(skill.id);
            overlay.remove();
            render();
        });
    }

    document.addEventListener('mc:ready', render);
})();
