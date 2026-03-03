/* ========== SYSTEM SETTINGS PAGE ========== */
(function () {
    'use strict';

    var sysData = { cpu: 42, ram: 58, disk: 34, net: 12.4 };

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function buildModelListHtml() {
        var models = MC.getAllModels();
        var html = '';
        for (var i = 0; i < models.length; i++) {
            var m = models[i];
            var displayName = MC.getModelDisplayName(m);
            var isBuiltIn = MC.isBuiltInModel(m);
            var color = MC.getModelColor(m);
            html += '<div class="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors">' +
                '<div class="flex items-center gap-2 min-w-0">' +
                    '<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:' + color + '"></span>' +
                    '<div class="min-w-0">' +
                        '<span class="font-mono text-[12px] block truncate">' + escapeHtml(displayName) + '</span>' +
                        (displayName !== m ? '<span class="font-mono text-[10px] text-neutral-400 block truncate">' + escapeHtml(m) + '</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2 flex-shrink-0">' +
                    (isBuiltIn
                        ? '<span class="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-mc-hover text-neutral-400">Built-in</span>'
                        : '<span class="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-status-standby/10 text-status-standby">Custom</span>' +
                          '<button class="remove-model-btn w-6 h-6 rounded-md flex items-center justify-center hover:bg-status-critical/10 transition-colors" data-model="' + escapeHtml(m) + '" title="Remove">' +
                              '<i data-lucide="x" class="w-3 h-3 text-status-critical"></i>' +
                          '</button>'
                    ) +
                '</div>' +
            '</div>';
        }
        return html;
    }

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

    function render() {
        var settings = MC.store.getSettings();
        var agents = MC.store.getAgents();
        var tasks = MC.store.getTasks();
        var activities = MC.store.getActivities();

        var html = '<div class="pt-4 space-y-4">';

        /* System Status */
        html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">' +
            '<section class="reveal">' +
                '<div class="flex items-center gap-2 mb-3">' +
                    '<i data-lucide="activity" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">System Status</span>' +
                '</div>' +
                '<div id="sys-gauges" class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">' +
                    '<div class="space-y-4">' +
                        sysBar('CPU', sysData.cpu, '%') +
                        sysBar('RAM', sysData.ram, '%') +
                        sysBar('DISK', sysData.disk, '%') +
                        sysBar('NET', sysData.net, ' MB/s') +
                    '</div>' +
                '</div>' +
            '</section>';

        /* Gateway Config */
        html += '<section class="reveal">' +
                '<div class="flex items-center gap-2 mb-3">' +
                    '<i data-lucide="globe" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Gateway Configuration</span>' +
                '</div>' +
                '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border space-y-4">' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">Gateway URL</label>' +
                        '<div class="flex gap-2">' +
                            '<input type="text" id="gateway-url" class="mc-input flex-1" value="' + escapeHtml(settings.gatewayUrl || '') + '">' +
                            '<button id="save-gateway" class="px-3 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors font-mono text-[12px]">Save</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex items-center justify-between">' +
                        '<span class="font-mono text-[11px] text-neutral-500">Connection Status</span>' +
                        '<div class="flex items-center gap-1.5">' +
                            '<span class="w-1.5 h-1.5 rounded-full bg-status-normal"></span>' +
                            '<span class="font-mono text-[11px] text-status-normal">Connected</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</section>' +
        '</div>';

        /* AI Provider + Mission Timer & Data Management — two-column row */
        html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">' +

            /* Left: AI Provider */
            '<section class="reveal">' +
                '<div class="flex items-center gap-2 mb-3">' +
                    '<i data-lucide="cpu" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">AI Provider</span>' +
                '</div>' +
                '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border space-y-5">' +
                    '<div>' +
                        '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1.5 block">OpenRouter API Key</label>' +
                        '<div class="flex gap-2">' +
                            '<div class="relative flex-1">' +
                                '<input type="password" id="openrouter-key" class="mc-input w-full pr-10" placeholder="sk-or-..." value="' + escapeHtml(settings.openRouterApiKey || '') + '">' +
                                '<button id="toggle-key-vis" class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-mc-hover transition-colors" title="Show/Hide">' +
                                    '<i data-lucide="eye-off" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                                '</button>' +
                            '</div>' +
                            '<button id="save-api-key" class="px-3 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors font-mono text-[12px]">Save</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="border-t border-neutral-200 dark:border-mc-border"></div>' +
                    '<div>' +
                        '<div class="flex items-center justify-between mb-2">' +
                            '<label class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Model Library</label>' +
                            '<button id="show-add-model" class="flex items-center gap-1 font-mono text-[11px] text-status-standby hover:text-status-standby/80 transition-colors">' +
                                '<i data-lucide="plus" class="w-3 h-3"></i> Add' +
                            '</button>' +
                        '</div>' +
                        '<div id="model-library-list" class="space-y-1 max-h-52 overflow-y-auto">' +
                            buildModelListHtml() +
                        '</div>' +
                        '<div id="add-model-form" class="hidden mt-3 p-3 rounded-xl bg-neutral-50 dark:bg-mc-dark border border-neutral-200 dark:border-mc-border space-y-2">' +
                            '<input type="text" id="new-model-name" class="mc-input w-full" placeholder="Display name, e.g. Gemini 3 Flash">' +
                            '<input type="text" id="new-model-id" class="mc-input w-full" placeholder="Model ID, e.g. google/gemini-3-flash-preview">' +
                            '<div class="flex justify-end gap-2 pt-1">' +
                                '<button id="cancel-add-model" class="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors font-mono text-[11px] text-neutral-500">Cancel</button>' +
                                '<button id="add-model-btn" class="px-3 py-1.5 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors font-mono text-[11px]">Add</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</section>' +

            /* Right: Mission Timer + Data Management stacked */
            '<div class="space-y-4">' +

                '<section class="reveal">' +
                    '<div class="flex items-center gap-2 mb-3">' +
                        '<i data-lucide="clock" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Mission Timer</span>' +
                    '</div>' +
                    '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">' +
                        '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">' +
                            '<div>' +
                                '<div class="font-mono text-[11px] text-neutral-500 mb-1">Mission Start</div>' +
                                '<div class="font-mono text-[14px] tabular-nums">' + new Date(settings.missionStart).toLocaleString() + '</div>' +
                            '</div>' +
                            '<div class="flex gap-2">' +
                                '<button id="reset-mission" class="font-mono text-[12px] px-4 py-2 rounded-lg bg-status-caution/10 text-status-caution hover:bg-status-caution/20 transition-colors flex items-center gap-1.5">' +
                                    '<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Reset Timer' +
                                '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</section>' +

                '<section class="reveal">' +
                    '<div class="flex items-center gap-2 mb-3">' +
                        '<i data-lucide="database" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                        '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Data Management</span>' +
                    '</div>' +
                    '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">' +
                        '<div class="grid grid-cols-2 gap-3 mb-4">' +
                            '<div class="p-3 rounded-lg bg-neutral-50 dark:bg-mc-dark border border-neutral-200 dark:border-mc-border">' +
                                '<div class="font-mono text-[10px] text-neutral-500 uppercase mb-1">Agents</div>' +
                                '<div class="font-mono text-lg font-bold">' + agents.length + '</div>' +
                            '</div>' +
                            '<div class="p-3 rounded-lg bg-neutral-50 dark:bg-mc-dark border border-neutral-200 dark:border-mc-border">' +
                                '<div class="font-mono text-[10px] text-neutral-500 uppercase mb-1">Tasks</div>' +
                                '<div class="font-mono text-lg font-bold">' + tasks.length + '</div>' +
                            '</div>' +
                            '<div class="p-3 rounded-lg bg-neutral-50 dark:bg-mc-dark border border-neutral-200 dark:border-mc-border">' +
                                '<div class="font-mono text-[10px] text-neutral-500 uppercase mb-1">Activities</div>' +
                                '<div class="font-mono text-lg font-bold">' + activities.length + '</div>' +
                            '</div>' +
                            '<div class="p-3 rounded-lg bg-neutral-50 dark:bg-mc-dark border border-neutral-200 dark:border-mc-border">' +
                                '<div class="font-mono text-[10px] text-neutral-500 uppercase mb-1">Storage</div>' +
                                '<div class="font-mono text-lg font-bold">' + getStorageSize() + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex flex-wrap gap-3">' +
                            '<button id="export-data" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' +
                                '<i data-lucide="download" class="w-3.5 h-3.5"></i> Export JSON' +
                            '</button>' +
                            '<label class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-normal/10 text-status-normal hover:bg-status-normal/20 transition-colors cursor-pointer">' +
                                '<i data-lucide="upload" class="w-3.5 h-3.5"></i> Import JSON' +
                                '<input type="file" id="import-data" accept=".json" class="hidden">' +
                            '</label>' +
                            '<button id="reset-data" class="flex items-center gap-1.5 font-mono text-[12px] px-4 py-2 rounded-lg bg-status-critical/10 text-status-critical hover:bg-status-critical/20 transition-colors">' +
                                '<i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> Reset All Data' +
                            '</button>' +
                        '</div>' +
                    '</div>' +
                '</section>' +

            '</div>' +
        '</div>';

        /* About */
        html += '<section class="reveal">' +
            '<div class="flex items-center gap-2 mb-3">' +
                '<i data-lucide="info" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">About</span>' +
            '</div>' +
            '<div class="p-4 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border">' +
                '<div class="space-y-2">' +
                    '<div class="flex items-center justify-between">' +
                        '<span class="font-mono text-[11px] text-neutral-500">Application</span>' +
                        '<span class="font-mono text-[12px]">Open Mission Control</span>' +
                    '</div>' +
                    '<div class="flex items-center justify-between">' +
                        '<span class="font-mono text-[11px] text-neutral-500">Version</span>' +
                        '<span class="font-mono text-[12px]">1.0.0</span>' +
                    '</div>' +
                    '<div class="flex items-center justify-between">' +
                        '<span class="font-mono text-[11px] text-neutral-500">Storage</span>' +
                        '<span class="font-mono text-[12px]">localStorage</span>' +
                    '</div>' +
                    '<div class="flex items-center justify-between">' +
                        '<span class="font-mono text-[11px] text-neutral-500">License</span>' +
                        '<span class="font-mono text-[12px]">Open Source</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</section>';

        html += '</div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Reveal */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Bind events */
        document.getElementById('save-gateway').addEventListener('click', function () {
            var url = document.getElementById('gateway-url').value.trim();
            MC.store.updateSettings({ gatewayUrl: url });
            MC.store.log('System', 'config', 'Gateway URL updated', 'standby');
        });

        /* AI Provider events */
        document.getElementById('save-api-key').addEventListener('click', function () {
            var key = document.getElementById('openrouter-key').value.trim();
            MC.store.updateSettings({ openRouterApiKey: key });
            MC.store.log('System', 'config', 'OpenRouter API key updated', 'standby');
        });

        document.getElementById('toggle-key-vis').addEventListener('click', function () {
            var input = document.getElementById('openrouter-key');
            var icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye-off');
            }
            lucide.createIcons();
        });

        document.getElementById('show-add-model').addEventListener('click', function () {
            document.getElementById('add-model-form').classList.remove('hidden');
            this.classList.add('hidden');
            document.getElementById('new-model-name').focus();
        });

        document.getElementById('cancel-add-model').addEventListener('click', function () {
            document.getElementById('add-model-form').classList.add('hidden');
            document.getElementById('show-add-model').classList.remove('hidden');
            document.getElementById('new-model-name').value = '';
            document.getElementById('new-model-id').value = '';
        });

        document.getElementById('add-model-btn').addEventListener('click', function () {
            var nameInput = document.getElementById('new-model-name');
            var idInput = document.getElementById('new-model-id');
            var modelName = nameInput.value.trim();
            var modelId = idInput.value.trim();
            if (!modelId) { idInput.focus(); return; }
            if (!modelName) { nameInput.focus(); return; }
            var all = MC.getAllModels();
            if (all.indexOf(modelId) !== -1) { idInput.value = ''; idInput.focus(); return; }
            var settings = MC.store.getSettings();
            var custom = settings.customModels || [];
            custom.push({ name: modelName, id: modelId });
            MC.store.updateSettings({ customModels: custom });
            MC.store.log('System', 'config', 'Custom model added: ' + modelName, 'standby');
            nameInput.value = '';
            idInput.value = '';
            document.getElementById('add-model-form').classList.add('hidden');
            document.getElementById('show-add-model').classList.remove('hidden');
            refreshModelList();
        });

        bindModelRemoveButtons();

        function refreshModelList() {
            var list = document.getElementById('model-library-list');
            if (list) {
                list.innerHTML = buildModelListHtml();
                lucide.createIcons();
                bindModelRemoveButtons();
            }
        }

        function bindModelRemoveButtons() {
            document.querySelectorAll('.remove-model-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var modelId = this.dataset.model;
                    var settings = MC.store.getSettings();
                    var custom = (settings.customModels || []).filter(function (m) {
                        var id = typeof m === 'object' ? m.id : m;
                        return id !== modelId;
                    });
                    MC.store.updateSettings({ customModels: custom });
                    MC.store.log('System', 'config', 'Custom model removed: ' + modelId, 'caution');
                    refreshModelList();
                });
            });
        }

        document.getElementById('reset-mission').addEventListener('click', function () {
            MC.store.updateSettings({ missionStart: Date.now() });
            MC.store.log('System', 'config', 'Mission timer reset', 'caution');
            render();
        });

        document.getElementById('export-data').addEventListener('click', function () {
            var data = MC.store.exportAll();
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = 'mission-control-backup-' + new Date().toISOString().slice(0, 10) + '.json';
            link.click();
            URL.revokeObjectURL(url);
            MC.store.log('System', 'export', 'Data exported', 'standby');
        });

        document.getElementById('import-data').addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (evt) {
                try {
                    var data = JSON.parse(evt.target.result);
                    MC.store.importAll(data);
                    MC.store.log('System', 'import', 'Data imported from file', 'normal');
                    render();
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        });

        document.getElementById('reset-data').addEventListener('click', function () {
            showResetConfirm();
        });
    }

    function getStorageSize() {
        var total = 0;
        for (var key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('mc-')) {
                total += localStorage[key].length * 2; // UTF-16
            }
        }
        if (total > 1024 * 1024) return (total / (1024 * 1024)).toFixed(1) + ' MB';
        if (total > 1024) return (total / 1024).toFixed(1) + ' KB';
        return total + ' B';
    }

    function showResetConfirm() {
        var overlay = document.createElement('div');
        overlay.className = 'mc-confirm-overlay';

        overlay.innerHTML = '<div class="mc-modal p-6 max-w-sm">' +
            '<div class="flex items-center gap-3 mb-4">' +
                '<div class="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">' +
                    '<i data-lucide="alert-triangle" class="w-5 h-5 text-status-critical"></i>' +
                '</div>' +
                '<div>' +
                    '<h3 class="font-mono text-sm font-semibold">Reset All Data</h3>' +
                    '<p class="font-mono text-[12px] text-neutral-500">This will delete everything.</p>' +
                '</div>' +
            '</div>' +
            '<p class="font-mono text-[13px] mb-6">All agents, tasks, chats, memory, and settings will be reset to defaults. This cannot be undone.</p>' +
            '<div class="flex justify-end gap-3">' +
                '<button class="confirm-cancel font-mono text-[12px] px-4 py-2 rounded-lg bg-neutral-100 dark:bg-mc-hover hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">Cancel</button>' +
                '<button class="confirm-reset font-mono text-[12px] px-4 py-2 rounded-lg bg-status-critical/10 text-status-critical hover:bg-status-critical/20 transition-colors">Reset Everything</button>' +
            '</div>' +
        '</div>';

        document.body.appendChild(overlay);
        lucide.createIcons();

        overlay.querySelector('.confirm-cancel').addEventListener('click', function () { overlay.remove(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('.confirm-reset').addEventListener('click', function () {
            MC.store.resetAll();
            overlay.remove();
            MC.header.updateAgentCount();
            render();
        });
    }

    /* Simulate system gauges */
    setInterval(function () {
        sysData.cpu = Math.round(Math.max(10, Math.min(95, sysData.cpu + (Math.random() - 0.5) * 15)));
        sysData.ram = Math.round(Math.max(30, Math.min(90, sysData.ram + (Math.random() - 0.5) * 8)));
        sysData.disk = Math.round(Math.max(30, Math.min(80, sysData.disk + (Math.random() - 0.3) * 2)));
        sysData.net = Math.max(1, Math.min(50, sysData.net + (Math.random() - 0.5) * 10));
        sysData.net = Math.round(sysData.net * 10) / 10;

        var gauges = document.getElementById('sys-gauges');
        if (gauges) {
            gauges.innerHTML = '<div class="space-y-4">' +
                sysBar('CPU', sysData.cpu, '%') +
                sysBar('RAM', sysData.ram, '%') +
                sysBar('DISK', sysData.disk, '%') +
                sysBar('NET', sysData.net, ' MB/s') +
            '</div>';
        }
    }, 3000);

    document.addEventListener('mc:ready', render);
})();
