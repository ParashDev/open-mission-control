/* ========== CHAT PAGE ========== */
(function () {
    'use strict';

    var selectedAgentId = null;

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

        var html = '<div class="pt-4 h-[calc(100vh-96px)] flex flex-col md:flex-row gap-4">';

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
                var msgCount = MC.store.getChat(a.id).length;
                html += '<button class="chat-agent-btn w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-mc-hover transition-colors text-left' +
                    (isSelected ? ' bg-status-standby/5' : '') + '" data-agent-id="' + a.id + '">' +
                    getAgentIconHtml(a) +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-1.5">' +
                            '<span class="font-mono text-[13px] font-medium' + (isSelected ? ' text-status-standby' : '') + '">' + escapeHtml(a.name) + '</span>' +
                            MC.getRoleBadgeHtml(a) +
                        '</div>' +
                        '<div class="font-mono text-[10px] text-neutral-500">' + a.model + '</div>' +
                    '</div>' +
                    '<div class="flex flex-col items-end gap-1">' +
                        '<span class="w-2 h-2 rounded-full bg-status-' + a.status + '"></span>' +
                        (msgCount > 0 ? '<span class="font-mono text-[10px] text-neutral-400">' + msgCount + '</span>' : '') +
                    '</div>' +
                '</button>';
            }
        }

        html += '</div></div></div>';

        /* Chat panel */
        html += '<div class="flex-1 flex flex-col min-h-0 reveal">';

        if (selectedAgentId) {
            var agent = MC.store.getAgent(selectedAgentId);
            var messages = MC.store.getChat(selectedAgentId);

            html += '<div class="flex items-center gap-3 mb-3">' +
                '<i data-lucide="message-square" class="w-3.5 h-3.5 text-neutral-400"></i>' +
                '<span class="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Chat with ' + (agent ? escapeHtml(agent.name) : '') + '</span>' +
            '</div>';

            html += '<div class="flex-1 rounded-2xl bg-white dark:bg-mc-card border border-neutral-200 dark:border-mc-border flex flex-col min-h-0">' +
                '<div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 mc-scroll">';

            for (var mi = 0; mi < messages.length; mi++) {
                var msg = messages[mi];
                html += renderMessage(msg, agent);
            }

            if (messages.length === 0) {
                html += '<div class="flex items-center justify-center h-full">' +
                    '<p class="font-mono text-[13px] text-neutral-500">No messages yet. Start a conversation.</p>' +
                '</div>';
            }

            html += '</div>' +
                '<div class="p-3 border-t border-neutral-200 dark:border-mc-border">' +
                    '<div class="flex gap-2">' +
                        '<input type="text" id="chat-input" placeholder="Message ' + (agent ? escapeHtml(agent.name) : 'agent') + '..." class="flex-1 mc-input">' +
                        '<button id="chat-send" class="px-3 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors">' +
                            '<i data-lucide="send" class="w-4 h-4"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        } else {
            html += '<div class="flex-1 flex items-center justify-center">' +
                '<p class="font-mono text-[13px] text-neutral-500">Select an agent to start chatting.</p>' +
            '</div>';
        }

        html += '</div></div>';

        document.getElementById('page-content').innerHTML = html;
        lucide.createIcons();

        /* Reveal */
        document.querySelectorAll('.reveal').forEach(function (el) {
            setTimeout(function () { el.classList.add('visible'); }, 50);
        });

        /* Scroll to bottom */
        var chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        /* Bind events */
        document.querySelectorAll('.chat-agent-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                selectedAgentId = this.dataset.agentId;
                render();
            });
        });

        var input = document.getElementById('chat-input');
        var sendBtn = document.getElementById('chat-send');
        if (input && sendBtn) {
            sendBtn.addEventListener('click', function () { sendMessage(); });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') sendMessage();
            });
        }
    }

    function renderMessage(msg, agent) {
        var isUser = msg.from === 'user';
        var isSystem = msg.from === 'system';

        var bubbleColor = isUser
            ? 'bg-status-standby/10'
            : isSystem
                ? 'bg-neutral-100 dark:bg-mc-border/50 text-neutral-500'
                : 'bg-neutral-100 dark:bg-mc-hover';

        var labelHtml = (!isUser && !isSystem && agent)
            ? '<span class="font-mono text-[10px] text-neutral-400 mb-0.5 block">' + escapeHtml(agent.name) + '</span>'
            : (isSystem ? '<span class="font-mono text-[10px] text-neutral-400 mb-0.5 block">System</span>' : '');

        return '<div class="flex ' + (isUser ? 'justify-end' : 'justify-start') + '">' +
            '<div class="max-w-[85%]">' +
                labelHtml +
                '<div class="' + bubbleColor + ' px-3 py-2 rounded-lg">' +
                    '<p class="font-mono text-[12px] leading-relaxed">' + escapeHtml(msg.text) + '</p>' +
                '</div>' +
                '<span class="font-mono text-[9px] text-neutral-400 mt-0.5 block">' +
                    (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '') +
                '</span>' +
            '</div>' +
        '</div>';
    }

    function sendMessage() {
        var input = document.getElementById('chat-input');
        var text = input.value.trim();
        if (!text || !selectedAgentId) return;

        /* Save user message */
        MC.store.addChatMessage(selectedAgentId, 'user', text);
        input.value = '';

        /* Re-render to show message */
        renderChatOnly();

        /* Show typing indicator */
        var chatContainer = document.getElementById('chat-messages');
        var typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex justify-start activity-enter';
        var agent = MC.store.getAgent(selectedAgentId);
        typingDiv.innerHTML = '<div class="max-w-[85%]">' +
            '<span class="font-mono text-[10px] text-neutral-400 mb-0.5 block">' + escapeHtml(agent ? agent.name : '') + '</span>' +
            '<div class="bg-neutral-100 dark:bg-mc-hover px-3 py-2.5 rounded-lg flex gap-1">' +
                '<span class="typing-dot w-1.5 h-1.5 rounded-full bg-neutral-400"></span>' +
                '<span class="typing-dot w-1.5 h-1.5 rounded-full bg-neutral-400"></span>' +
                '<span class="typing-dot w-1.5 h-1.5 rounded-full bg-neutral-400"></span>' +
            '</div>' +
        '</div>';
        chatContainer.appendChild(typingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        /* Simulated response */
        setTimeout(function () {
            var indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();

            var reply = MC.responses[Math.floor(Math.random() * MC.responses.length)];
            MC.store.addChatMessage(selectedAgentId, selectedAgentId, reply);
            renderChatOnly();
        }, 1200 + Math.random() * 1500);
    }

    function renderChatOnly() {
        var chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) { render(); return; }

        var agent = MC.store.getAgent(selectedAgentId);
        var messages = MC.store.getChat(selectedAgentId);
        var html = '';

        for (var i = 0; i < messages.length; i++) {
            html += renderMessage(messages[i], agent);
        }

        chatContainer.innerHTML = html;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    document.addEventListener('mc:ready', render);
})();
