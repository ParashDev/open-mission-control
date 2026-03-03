/* ========== AGENTS CRUD PAGE ========== */
(function () {
    'use strict';

    function getModels() { return MC.getAllModels(); }
    var STATUSES = ['normal', 'standby', 'caution', 'critical', 'off'];
    var COLORS = ['standby', 'normal', 'serious', 'caution', 'critical', 'off'];
    var ROLES = ['ceo', 'department-head', 'agent'];
    var DEPT_ORDER = ['executive', 'engineering', 'finance', 'marketing', 'operations', 'cybersecurity'];

    var searchQuery = '';
    var filterStatus = 'all';
    var filterDepartment = 'all';
    var collapsedDepts = { finance: true, marketing: true, cybersecurity: true };

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getAgentIconHtml(agent, size) {
        var s = size || 18;
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
            '<i data-lucide="' + (agent.icon || 'zap') + '" class="w-[' + s + 'px] h-[' + s + 'px]"></i>' +
        '</div>';
    }

    function render() {
        var agents = MC.store.getAgents();
        var tasks = MC.store.getTasks();

        /* Filter */
        var filtered = agents.filter(function (a) {
            if (filterStatus !== 'all' && a.status !== filterStatus) return false;
            if (filterDepartment !== 'all' && a.department !== filterDepartment) return false;
            if (searchQuery && a.name.toLowerCase().indexOf(searchQuery.toLowerCase()) === -1 &&
                a.model.toLowerCase().indexOf(searchQuery.toLowerCase()) === -1) return false;
            return true;
        });

        /* Group by department */
        var grouped = {};
        for (var di = 0; di < DEPT_ORDER.length; di++) {
            grouped[DEPT_ORDER[di]] = [];
        }
        for (var fi = 0; fi < filtered.length; fi++) {
            var dept = filtered[fi].department || 'engineering';
            if (!grouped[dept]) grouped[dept] = [];
            grouped[dept].push(filtered[fi]);
        }

        var html = '<div class="pt-4">' +
            /* Toolbar */
            '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 reveal">' +
                '<div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">' +
                    '<div class="relative flex-1 sm:flex-none sm:w-52">' +
                        '<i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<input type="text" id="agent-search" class="mc-input pl-9" placeholder="Search agents..." value="' + escapeHtml(searchQuery) + '">' +
                    '</div>' +
                    '<select id="agent-filter" class="mc-input mc-select w-28 text-[12px]">' +
                        '<option value="all"' + (filterStatus === 'all' ? ' selected' : '') + '>All Status</option>';

        for (var si = 0; si < STATUSES.length; si++) {
            html += '<option value="' + STATUSES[si] + '"' + (filterStatus === STATUSES[si] ? ' selected' : '') + '>' +
                STATUSES[si].charAt(0).toUpperCase() + STATUSES[si].slice(1) + '</option>';
        }

        html += '</select>' +
                    '<select id="agent-dept-filter" class="mc-input mc-select w-36 text-[12px]">' +
                        '<option value="all"' + (filterDepartment === 'all' ? ' selected' : '') + '>All Depts</option>';

        for (var dfi = 0; dfi < DEPT_ORDER.length; dfi++) {
            var deptInfo = MC.DEPARTMENTS[DEPT_ORDER[dfi]];
            html += '<option value="' + DEPT_ORDER[dfi] + '"' + (filterDepartment === DEPT_ORDER[dfi] ? ' selected' : '') + '>' +
                deptInfo.label + '</option>';
        }

        html += '</select></div>' +
                '<button id="add-agent-btn" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' +
                    '<i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Agent' +
                '</button>' +
            '</div>';

        /* Table */
        html += '<div class="rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border overflow-hidden reveal">' +
            '<div class="overflow-x-auto">' +
            '<table class="w-full">' +
            '<thead>' +
                '<tr class="border-b border-neutral-200 dark:border-mc-border">' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3">Agent</th>' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3 hidden lg:table-cell">Role</th>' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3 hidden md:table-cell">Model</th>' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3">Status</th>' +
                    '<th class="text-left font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3 hidden sm:table-cell">Tasks</th>' +
                    '<th class="text-right font-mono text-[10px] uppercase tracking-wider text-neutral-500 px-4 py-3">Actions</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>';

        var totalShown = 0;
        for (var gi = 0; gi < DEPT_ORDER.length; gi++) {
            var deptKey = DEPT_ORDER[gi];
            var deptAgents = grouped[deptKey];
            if (!deptAgents || deptAgents.length === 0) continue;

            var dInfo = MC.DEPARTMENTS[deptKey] || { label: deptKey, icon: 'folder' };

            /* Department header row */
            var isCollapsed = !!collapsedDepts[deptKey];
            var chevron = isCollapsed ? 'chevron-right' : 'chevron-down';
            html += '<tr class="dept-header-row dept-toggle cursor-pointer select-none" data-dept="' + deptKey + '">' +
                '<td colspan="6">' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="dept-chevron"><i data-lucide="' + chevron + '" class="w-3.5 h-3.5 text-neutral-400"></i></span>' +
                        '<i data-lucide="' + dInfo.icon + '" class="w-4 h-4"></i>' +
                        '<span class="text-[13px]">' + dInfo.label + '</span>' +
                        '<span class="text-[10px] font-normal text-neutral-400 tracking-normal lowercase">(' + deptAgents.length + ')</span>' +
                    '</div>' +
                '</td>' +
            '</tr>';

            for (var i = 0; i < deptAgents.length; i++) {
                var a = deptAgents[i];
                var agentTasks = tasks.filter(function (t) { return t.agentId === a.id && t.column !== 'done'; }).length;
                var parentAgent = a.parentId ? MC.store.getAgent(a.parentId) : null;
                var roleBadge = MC.getRoleBadgeHtml(a);

                /* Build skill badges (desktop only, max 3) */
                var skillBadgesHtml = '';
                if (a.skills && a.skills.length > 0) {
                    var maxBadges = 3;
                    var shown = Math.min(a.skills.length, maxBadges);
                    skillBadgesHtml = '<div class="hidden lg:flex items-center gap-1 mt-1">';
                    for (var sbi = 0; sbi < shown; sbi++) {
                        var sk = MC.store.getSkill(a.skills[sbi]);
                        if (sk) {
                            skillBadgesHtml += '<span class="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-mc-hover text-neutral-400">' + escapeHtml(sk.name) + '</span>';
                        }
                    }
                    if (a.skills.length > maxBadges) {
                        skillBadgesHtml += '<span class="font-mono text-[9px] text-neutral-400">+' + (a.skills.length - maxBadges) + '</span>';
                    }
                    skillBadgesHtml += '</div>';
                }

                html += '<tr class="dept-agent-row border-b border-neutral-100 dark:border-mc-border/50 hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors" data-dept="' + deptKey + '"' + (isCollapsed ? ' style="display:none"' : '') + '>' +
                    '<td class="px-4 py-3">' +
                        '<div class="flex items-center gap-3">' +
                            getAgentIconHtml(a) +
                            '<div>' +
                                '<div class="flex items-center gap-2">' +
                                    '<span class="font-mono text-[13px] font-medium">' + escapeHtml(a.name) + '</span>' +
                                    '<span class="lg:hidden">' + roleBadge + '</span>' +
                                '</div>' +
                                '<div class="font-mono text-[10px] text-neutral-500 md:hidden">' + MC.getModelDisplayName(a.model) + '</div>' +
                                (parentAgent ? '<div class="font-mono text-[9px] text-neutral-400 hidden sm:block">Reports to ' + escapeHtml(parentAgent.name) + '</div>' : '') +
                                skillBadgesHtml +
                            '</div>' +
                        '</div>' +
                    '</td>' +
                    '<td class="px-4 py-3 hidden lg:table-cell">' + roleBadge + '</td>' +
                    '<td class="px-4 py-3 hidden md:table-cell"><span class="font-mono text-[12px] text-neutral-500">' + MC.getModelDisplayName(a.model) + '</span></td>' +
                    '<td class="px-4 py-3">' +
                        '<select class="agent-status-select mc-input mc-select text-[11px] py-1 px-2 w-28" data-agent-id="' + a.id + '">';
                for (var sj = 0; sj < STATUSES.length; sj++) {
                    html += '<option value="' + STATUSES[sj] + '"' + (a.status === STATUSES[sj] ? ' selected' : '') + '>' +
                        STATUSES[sj].charAt(0).toUpperCase() + STATUSES[sj].slice(1) + '</option>';
                }
                html += '</select></td>' +
                    '<td class="px-4 py-3 hidden sm:table-cell"><span class="font-mono text-[12px]">' + agentTasks + '</span></td>' +
                    '<td class="px-4 py-3 text-right">' +
                        '<div class="flex items-center justify-end gap-2">' +
                            '<button class="edit-agent-btn w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" data-agent-id="' + a.id + '" title="Edit">' +
                                '<i data-lucide="pencil" class="w-3.5 h-3.5 text-neutral-500"></i>' +
                            '</button>' +
                            '<button class="delete-agent-btn w-8 h-8 rounded-lg bg-status-critical/10 flex items-center justify-center hover:bg-status-critical/20 transition-colors" data-agent-id="' + a.id + '" title="Delete">' +
                                '<i data-lucide="trash-2" class="w-3.5 h-3.5 text-status-critical"></i>' +
                            '</button>' +
                        '</div>' +
                    '</td>' +
                '</tr>';
                totalShown++;
            }
        }

        if (totalShown === 0) {
            html += '<tr><td colspan="6" class="px-4 py-8 text-center font-mono text-[13px] text-neutral-500">No agents found</td></tr>';
        }

        html += '</tbody></table></div></div></div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Trigger reveals */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Bind events */
        document.getElementById('agent-search').addEventListener('input', function (e) {
            searchQuery = e.target.value;
            render();
        });
        document.getElementById('agent-filter').addEventListener('change', function (e) {
            filterStatus = e.target.value;
            render();
        });
        document.getElementById('agent-dept-filter').addEventListener('change', function (e) {
            filterDepartment = e.target.value;
            render();
        });
        document.getElementById('add-agent-btn').addEventListener('click', function () {
            showModal(null);
        });

        document.querySelectorAll('.dept-toggle').forEach(function (row) {
            row.addEventListener('click', function () {
                var dept = this.dataset.dept;
                collapsedDepts[dept] = !collapsedDepts[dept];
                var collapsed = collapsedDepts[dept];

                /* Toggle agent rows */
                document.querySelectorAll('.dept-agent-row[data-dept="' + dept + '"]').forEach(function (r) {
                    r.style.display = collapsed ? 'none' : '';
                });

                /* Swap chevron icon — replace the svg/i with a fresh <i> and re-init */
                var chevronContainer = this.querySelector('.dept-chevron');
                if (chevronContainer) {
                    chevronContainer.innerHTML = '<i data-lucide="' + (collapsed ? 'chevron-right' : 'chevron-down') + '" class="w-3.5 h-3.5 text-neutral-400"></i>';
                    lucide.createIcons({ nodes: chevronContainer.querySelectorAll('[data-lucide]') });
                }
            });
        });

        document.querySelectorAll('.agent-status-select').forEach(function (sel) {
            sel.addEventListener('change', function () {
                MC.store.updateAgent(this.dataset.agentId, { status: this.value });
                render();
            });
        });

        document.querySelectorAll('.edit-agent-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var agent = MC.store.getAgent(this.dataset.agentId);
                if (agent) showModal(agent);
            });
        });

        document.querySelectorAll('.delete-agent-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var agent = MC.store.getAgent(this.dataset.agentId);
                if (agent) showConfirm(agent);
            });
        });
    }

    /* ---------- Modal ---------- */
    function showModal(agent) {
        var isEdit = !!agent;
        var overlay = document.createElement('div');
        overlay.className = 'mc-modal-overlay';
        overlay.id = 'agent-modal';

        var html = '<div class="mc-modal p-6">' +
            '<div class="flex items-center justify-between mb-6">' +
                '<h2 class="font-mono text-sm font-semibold uppercase tracking-wider">' + (isEdit ? 'Edit Agent' : 'Add Agent') + '</h2>' +
                '<button class="modal-close w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                    '<i data-lucide="x" class="w-4 h-4"></i>' +
                '</button>' +
            '</div>' +
            '<div class="space-y-4">' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Name</label>' +
                    '<input type="text" id="modal-name" class="mc-input" placeholder="Agent name" value="' + (isEdit ? escapeHtml(agent.name) : '') + '">' +
                '</div>' +
                '<div class="grid grid-cols-2 gap-3">' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Role</label>' +
                        '<select id="modal-role" class="mc-input mc-select">';

        for (var ri = 0; ri < ROLES.length; ri++) {
            var roleInfo = MC.ROLES[ROLES[ri]];
            html += '<option value="' + ROLES[ri] + '"' + (isEdit && agent.role === ROLES[ri] ? ' selected' : (!isEdit && ROLES[ri] === 'agent' ? ' selected' : '')) + '>' + roleInfo.label + '</option>';
        }

        html += '</select></div>' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Department</label>' +
                        '<select id="modal-department" class="mc-input mc-select">';

        for (var ddi = 0; ddi < DEPT_ORDER.length; ddi++) {
            var ddInfo = MC.DEPARTMENTS[DEPT_ORDER[ddi]];
            html += '<option value="' + DEPT_ORDER[ddi] + '"' + (isEdit && agent.department === DEPT_ORDER[ddi] ? ' selected' : (!isEdit && DEPT_ORDER[ddi] === 'engineering' ? ' selected' : '')) + '>' + ddInfo.label + '</option>';
        }

        html += '</select></div></div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Reports To</label>' +
                    '<select id="modal-parent" class="mc-input mc-select">' +
                        '<option value="">None (top-level)</option>';

        /* Show CEO + department heads as possible parents */
        var allAgents = MC.store.getAgents();
        for (var pi = 0; pi < allAgents.length; pi++) {
            var pa = allAgents[pi];
            if (pa.role === 'ceo' || pa.role === 'department-head') {
                if (isEdit && pa.id === agent.id) continue;
                var parentSel = (isEdit && agent.parentId === pa.id) ? ' selected' : '';
                var pTitle = MC.ROLE_TITLES[pa.id] ? ' (' + MC.ROLE_TITLES[pa.id] + ')' : '';
                html += '<option value="' + pa.id + '"' + parentSel + '>' + pa.name + pTitle + '</option>';
            }
        }

        html += '</select></div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Model</label>' +
                    '<select id="modal-model" class="mc-input mc-select">';

        var models = getModels();
        for (var i = 0; i < models.length; i++) {
            var mDisplay = MC.getModelDisplayName(models[i]);
            html += '<option value="' + models[i] + '"' + (isEdit && agent.model === models[i] ? ' selected' : '') + '>' + mDisplay + '</option>';
        }

        html += '</select></div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Skills</label>' +
                    '<div class="relative" id="skill-dropdown-wrap">' +
                        '<button type="button" id="skill-dropdown-toggle" class="mc-input mc-select text-left w-full flex items-center justify-between">' +
                            '<span id="skill-dropdown-label" class="truncate text-[12px]">Select skills...</span>' +
                            '<i data-lucide="chevron-down" class="w-3.5 h-3.5 text-neutral-400 flex-shrink-0"></i>' +
                        '</button>' +
                        '<div id="skill-dropdown-panel" class="hidden absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border shadow-lg max-h-52 overflow-hidden flex flex-col">' +
                            '<div class="p-2 border-b border-neutral-200 dark:border-mc-border">' +
                                '<input type="text" id="skill-dropdown-search" class="mc-input text-[12px] py-1.5" placeholder="Search skills...">' +
                            '</div>' +
                            '<div id="skill-dropdown-list" class="overflow-y-auto mc-scroll p-1">';

        var allSkills = MC.store.getSkills();
        var agentSkills = isEdit && agent.skills ? agent.skills : [];
        for (var ski = 0; ski < allSkills.length; ski++) {
            var sk = allSkills[ski];
            var isSelected = agentSkills.indexOf(sk.id) !== -1;
            html += '<label class="skill-dropdown-item flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-mc-hover transition-colors" data-skill-id="' + sk.id + '" data-name="' + escapeHtml(sk.name).toLowerCase() + '">' +
                '<input type="checkbox" class="skill-cb accent-[#2DCCFF] w-3.5 h-3.5 flex-shrink-0" data-skill-id="' + sk.id + '"' + (isSelected ? ' checked' : '') + '>' +
                '<i data-lucide="' + (sk.icon || 'sparkles') + '" class="w-3.5 h-3.5 text-neutral-400 flex-shrink-0"></i>' +
                '<span class="font-mono text-[12px] truncate">' + escapeHtml(sk.name) + '</span>' +
            '</label>';
        }

        html += '</div></div></div>' +
                    '<div id="skill-selected-tags" class="flex flex-wrap gap-1.5 mt-2"></div>' +
                '</div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Icon</label>' +
                    '<div class="flex flex-wrap gap-2" id="icon-picker">';

        for (var j = 0; j < MC.AGENT_ICONS.length; j++) {
            var ic = MC.AGENT_ICONS[j];
            var selected = isEdit && agent.icon === ic ? ' selected' : '';
            if (!isEdit && j === 0) selected = ' selected';
            html += '<div class="icon-picker-item' + selected + '" data-icon="' + ic + '">' +
                '<i data-lucide="' + ic + '" class="w-[18px] h-[18px]"></i>' +
            '</div>';
        }

        html += '</div></div>' +
                '<div>' +
                    '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Color</label>' +
                    '<div class="flex flex-wrap gap-2" id="color-picker">';

        for (var k = 0; k < COLORS.length; k++) {
            var col = COLORS[k];
            var colSelected = isEdit && agent.color === col ? ' selected' : '';
            if (!isEdit && k === 0) colSelected = ' selected';
            html += '<div class="color-picker-item' + colSelected + '" data-color="' + col + '" style="background:' + MC.STATUS_COLORS[col] + '"></div>';
        }

        html += '</div></div>' +
            '</div>' +
            '<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-mc-border">' +
                '<button class="modal-close font-mono text-[12px] px-4 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                '<button id="modal-save" class="font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' + (isEdit ? 'Save Changes' : 'Add Agent') + '</button>' +
            '</div>' +
        '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        lucide.createIcons();

        /* Selected state tracking */
        var selectedIcon = isEdit ? agent.icon : MC.AGENT_ICONS[0];
        var selectedColor = isEdit ? agent.color : COLORS[0];
        var selectedSkills = isEdit && agent.skills ? agent.skills.slice() : [];

        /* Skill dropdown logic */
        var skillToggle = overlay.querySelector('#skill-dropdown-toggle');
        var skillPanel = overlay.querySelector('#skill-dropdown-panel');
        var skillSearch = overlay.querySelector('#skill-dropdown-search');

        function updateSkillLabel() {
            var label = overlay.querySelector('#skill-dropdown-label');
            if (selectedSkills.length === 0) {
                label.textContent = 'Select skills...';
                label.classList.add('text-neutral-400');
            } else {
                label.textContent = selectedSkills.length + ' skill' + (selectedSkills.length !== 1 ? 's' : '') + ' selected';
                label.classList.remove('text-neutral-400');
            }
            /* Render selected tags */
            var tagsContainer = overlay.querySelector('#skill-selected-tags');
            var tagsHtml = '';
            for (var ti = 0; ti < selectedSkills.length; ti++) {
                var tSkill = MC.store.getSkill(selectedSkills[ti]);
                if (tSkill) {
                    tagsHtml += '<span class="font-mono text-[10px] px-2 py-1 rounded-lg bg-status-standby/10 text-status-standby flex items-center gap-1">' +
                        '<i data-lucide="' + (tSkill.icon || 'sparkles') + '" class="w-3 h-3"></i>' +
                        escapeHtml(tSkill.name) +
                        '<button type="button" class="skill-tag-remove ml-0.5 hover:text-white" data-skill-id="' + tSkill.id + '">&times;</button>' +
                    '</span>';
                }
            }
            tagsContainer.innerHTML = tagsHtml;
            lucide.createIcons({ nodes: tagsContainer.querySelectorAll('[data-lucide]') });
            /* Bind remove buttons */
            tagsContainer.querySelectorAll('.skill-tag-remove').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var sid = this.dataset.skillId;
                    var idx = selectedSkills.indexOf(sid);
                    if (idx !== -1) selectedSkills.splice(idx, 1);
                    var cb = overlay.querySelector('.skill-cb[data-skill-id="' + sid + '"]');
                    if (cb) cb.checked = false;
                    updateSkillLabel();
                });
            });
        }

        skillToggle.addEventListener('click', function () {
            skillPanel.classList.toggle('hidden');
            if (!skillPanel.classList.contains('hidden')) {
                skillSearch.focus();
            }
        });

        skillSearch.addEventListener('input', function () {
            var q = this.value.toLowerCase();
            overlay.querySelectorAll('.skill-dropdown-item').forEach(function (item) {
                var name = item.dataset.name;
                item.style.display = name.indexOf(q) !== -1 ? '' : 'none';
            });
        });

        overlay.querySelectorAll('.skill-cb').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var sid = this.dataset.skillId;
                if (this.checked) {
                    if (selectedSkills.indexOf(sid) === -1) selectedSkills.push(sid);
                } else {
                    var idx = selectedSkills.indexOf(sid);
                    if (idx !== -1) selectedSkills.splice(idx, 1);
                }
                updateSkillLabel();
            });
        });

        /* Close dropdown when clicking outside */
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) { overlay.remove(); return; }
            var wrap = overlay.querySelector('#skill-dropdown-wrap');
            if (wrap && !wrap.contains(e.target)) {
                skillPanel.classList.add('hidden');
            }
        });

        updateSkillLabel();

        overlay.querySelectorAll('.icon-picker-item').forEach(function (el) {
            el.addEventListener('click', function () {
                overlay.querySelectorAll('.icon-picker-item').forEach(function (e) { e.classList.remove('selected'); });
                this.classList.add('selected');
                selectedIcon = this.dataset.icon;
            });
        });

        overlay.querySelectorAll('.color-picker-item').forEach(function (el) {
            el.addEventListener('click', function () {
                overlay.querySelectorAll('.color-picker-item').forEach(function (e) { e.classList.remove('selected'); });
                this.classList.add('selected');
                selectedColor = this.dataset.color;
            });
        });

        overlay.querySelectorAll('.modal-close').forEach(function (el) {
            el.addEventListener('click', function () { overlay.remove(); });
        });

        document.getElementById('modal-save').addEventListener('click', function () {
            var name = document.getElementById('modal-name').value.trim();
            var model = document.getElementById('modal-model').value;
            var role = document.getElementById('modal-role').value;
            var department = document.getElementById('modal-department').value;
            var parentId = document.getElementById('modal-parent').value || null;
            if (!name) { document.getElementById('modal-name').focus(); return; }

            if (isEdit) {
                MC.store.updateAgent(agent.id, { name: name, model: model, icon: selectedIcon, color: selectedColor, role: role, department: department, parentId: parentId, skills: selectedSkills });
            } else {
                MC.store.addAgent({ name: name, model: model, icon: selectedIcon, color: selectedColor, role: role, department: department, parentId: parentId, skills: selectedSkills });
            }
            overlay.remove();
            MC.header.updateAgentCount();
            render();
        });
    }

    /* ---------- Confirm delete ---------- */
    function showConfirm(agent) {
        var overlay = document.createElement('div');
        overlay.className = 'mc-confirm-overlay';

        overlay.innerHTML = '<div class="mc-modal p-6 max-w-sm">' +
            '<div class="flex items-center gap-3 mb-4">' +
                '<div class="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">' +
                    '<i data-lucide="alert-triangle" class="w-5 h-5 text-status-critical"></i>' +
                '</div>' +
                '<div>' +
                    '<h3 class="font-mono text-sm font-semibold">Delete Agent</h3>' +
                    '<p class="font-mono text-[12px] text-neutral-500">This action cannot be undone.</p>' +
                '</div>' +
            '</div>' +
            '<p class="font-mono text-[13px] mb-6">Are you sure you want to delete <strong>' + escapeHtml(agent.name) + '</strong>?</p>' +
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
            MC.store.deleteAgent(agent.id);
            overlay.remove();
            MC.header.updateAgentCount();
            render();
        });
    }

    document.addEventListener('mc:ready', render);
})();
