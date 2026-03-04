/* ========== BOARD CHAT COMPONENT ========== */
window.MC = window.MC || {};

(function () {
    'use strict';

    var isOpen = false;
    var simulationTimer = null;
    var hasUnread = false;

    /* ---------- Message templates by role ---------- */
    var CEO_TEMPLATES = [
        'Team, let\'s prioritize {task}. Need this resolved by EOD.',
        '@{head}, provide a status update on your department\'s deliverables.',
        'Good progress across the board. @{head}, flag any blockers immediately.',
        'Reallocating resources \u2014 @{head} coordinate with @{agent} on the handoff.',
        'Board review in 2 hours. @{head}, prep your department summaries.',
    ];

    var HEAD_TEMPLATES = [
        '@{agent}, handle the {action}. Reporting to @nexus when complete.',
        'Department update: {task} is on track. @{agent} wrapping up final checks.',
        '@nexus, my team is clear on priorities. @{agent} taking point on next sprint item.',
        'Reassigning {action} to @{agent}. Need faster turnaround on this.',
        '@{agent}, code review needed before we push to staging.',
    ];

    var AGENT_TEMPLATES = [
        'Completed {task}. @{head}, ready for your review.',
        'Running into an edge case on {action}. Investigating \u2014 will update in 30 min.',
        'Tests passing \u2014 47/47 green. @{head}, safe to merge.',
        'Deployed patch to staging. @{head}, requesting sign-off for production.',
        '{task} at 80%. Should be wrapped up within the hour.',
        'Found a dependency conflict. Resolving now, no impact on timeline.',
    ];

    var ACTIONS = [
        'API refactor', 'auth flow update', 'database migration', 'cache optimization',
        'security patch', 'CI/CD pipeline fix', 'budget reconciliation', 'campaign rollout',
        'infrastructure scaling', 'vulnerability remediation', 'log analysis', 'load testing',
    ];

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function timeAgo(isoStr) {
        if (!isoStr) return '';
        var diff = Date.now() - new Date(isoStr).getTime();
        if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
    }

    function highlightMentions(text) {
        return text.replace(/@(\w+)/g, '<span class="bc-mention">@$1</span>');
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getAgentIconHtml(agent) {
        if (!agent) return '<div class="w-7 h-7 rounded-lg bg-status-standby/10 flex items-center justify-center flex-shrink-0"><i data-lucide="user" class="w-3.5 h-3.5 text-status-standby"></i></div>';
        var colorMap = {
            standby: 'bg-status-standby/10 text-status-standby',
            normal: 'bg-status-normal/10 text-status-normal',
            serious: 'bg-status-serious/10 text-status-serious',
            caution: 'bg-status-caution/10 text-status-caution',
            critical: 'bg-status-critical/10 text-status-critical',
            off: 'bg-neutral-500/10 text-neutral-500',
        };
        var cls = colorMap[agent.color] || colorMap.standby;
        return '<div class="w-7 h-7 rounded-lg ' + cls + ' flex items-center justify-center flex-shrink-0">' +
            '<i data-lucide="' + (agent.icon || 'zap') + '" class="w-3.5 h-3.5"></i>' +
        '</div>';
    }

    /* ---------- Render messages ---------- */
    function renderMessages() {
        var container = document.getElementById('bc-messages');
        if (!container) return;

        var messages = MC.store.getBoardChat();
        var html = '';

        for (var i = 0; i < messages.length; i++) {
            var msg = messages[i];
            var isUser = msg.from === 'user';
            var agent = isUser ? null : MC.store.getAgent(msg.from);
            var name = isUser ? 'You' : (agent ? agent.name : msg.from);
            var roleBadge = agent ? MC.getRoleBadgeHtml(agent) : '';
            var msgClass = isUser ? 'bc-message bc-message-user' : 'bc-message';

            html += '<div class="' + msgClass + '">' +
                '<div class="flex items-start gap-2.5">' +
                    (isUser
                        ? '<div class="w-7 h-7 rounded-lg bg-status-standby/10 flex items-center justify-center flex-shrink-0"><i data-lucide="user" class="w-3.5 h-3.5 text-status-standby"></i></div>'
                        : getAgentIconHtml(agent)) +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-2 mb-0.5">' +
                            '<span class="font-mono text-[11px] font-semibold">' + escapeHtml(name) + '</span>' +
                            roleBadge +
                            '<span class="font-mono text-[9px] text-neutral-400 tabular-nums">' + timeAgo(msg.timestamp) + '</span>' +
                        '</div>' +
                        '<p class="font-mono text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300">' + highlightMentions(escapeHtml(msg.text)) + '</p>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }

        if (messages.length === 0) {
            html = '<div class="flex items-center justify-center h-full">' +
                '<p class="font-mono text-[12px] text-neutral-500">No board messages yet.</p>' +
            '</div>';
        }

        container.innerHTML = html;
        lucide.createIcons();
        container.scrollTop = container.scrollHeight;
    }

    /* ---------- Panel render ---------- */
    function renderPanel() {
        var panel = document.getElementById('board-chat-panel');
        if (!panel) return;

        panel.innerHTML =
            '<div class="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-mc-border flex-shrink-0">' +
                '<div class="flex items-center gap-2">' +
                    '<i data-lucide="message-circle" class="w-4 h-4 text-status-standby"></i>' +
                    '<span class="font-mono text-[11px] uppercase tracking-wider font-semibold">Board Chat</span>' +
                    '<span id="bc-count" class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-mc-border text-neutral-500">' + MC.store.getBoardChat().length + '</span>' +
                '</div>' +
                '<button id="bc-close" class="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                    '<i data-lucide="x" class="w-4 h-4"></i>' +
                '</button>' +
            '</div>' +
            '<div id="bc-messages" class="flex-1 overflow-y-auto p-3 space-y-1 mc-scroll"></div>' +
            '<div class="px-3 py-3 border-t border-neutral-200 dark:border-mc-border flex-shrink-0">' +
                '<div class="flex gap-2">' +
                    '<input type="text" id="bc-input" class="flex-1 mc-input text-[12px]" placeholder="Message the board. Tag agents with @name.">' +
                    '<button id="bc-send" class="px-3 py-2 rounded-lg bg-status-standby/10 text-status-standby hover:bg-status-standby/20 transition-colors flex-shrink-0">' +
                        '<i data-lucide="send" class="w-3.5 h-3.5"></i>' +
                    '</button>' +
                '</div>' +
            '</div>';

        lucide.createIcons();
        renderMessages();

        /* Bind panel events */
        document.getElementById('bc-close').addEventListener('click', function () {
            MC.boardChat.close();
        });

        var input = document.getElementById('bc-input');
        var sendBtn = document.getElementById('bc-send');

        sendBtn.addEventListener('click', function () { sendUserMessage(); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') sendUserMessage();
        });
    }

    /* ---------- Send user message ---------- */
    function sendUserMessage() {
        var input = document.getElementById('bc-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;

        /* Parse @mentions */
        var mentions = [];
        var mentionRegex = /@(\w+)/g;
        var match;
        while ((match = mentionRegex.exec(text)) !== null) {
            var agents = MC.store.getAgents();
            for (var i = 0; i < agents.length; i++) {
                if (agents[i].name.toLowerCase() === match[1].toLowerCase() ||
                    agents[i].id.toLowerCase() === match[1].toLowerCase()) {
                    mentions.push(agents[i].id);
                    break;
                }
            }
        }

        MC.store.addBoardMessage('user', text, mentions);
        input.value = '';
        renderMessages();
        updateCount();

        /* Auto-reply from mentioned agent or random lead */
        setTimeout(function () {
            var responder = null;
            if (mentions.length > 0) {
                responder = MC.store.getAgent(mentions[0]);
            }
            if (!responder) {
                var heads = MC.store.getDepartmentHeads();
                var onlineHeads = heads.filter(function (h) { return h.status !== 'off'; });
                if (onlineHeads.length > 0) responder = pickRandom(onlineHeads);
            }
            if (responder) {
                var reply = generateMessage(responder);
                MC.store.addBoardMessage(responder.id, reply.text, reply.mentions);
                renderMessages();
                updateCount();
            }
        }, 2000 + Math.random() * 2000);
    }

    /* ---------- Generate contextual message ---------- */
    function generateMessage(agent) {
        if (MC.engine && MC.engine.generateBoardMessage) {
            return MC.engine.generateBoardMessage(agent.id);
        }

        /* Fallback: original template logic */
        var templates;
        if (agent.role === 'ceo') {
            templates = CEO_TEMPLATES;
        } else if (agent.role === 'department-head') {
            templates = HEAD_TEMPLATES;
        } else {
            templates = AGENT_TEMPLATES;
        }

        var template = pickRandom(templates);
        var tasks = MC.store.getTasks();
        var activeTasks = tasks.filter(function (t) { return t.column !== 'done' && t.column !== 'inbox'; });
        var taskTitle = activeTasks.length > 0 ? pickRandom(activeTasks).title : 'current sprint items';
        var action = pickRandom(ACTIONS);

        var mentions = [];
        var text = template;

        if (agent.role === 'ceo') {
            var heads = MC.store.getDepartmentHeads();
            var head = heads.length > 0 ? pickRandom(heads) : null;
            var subAgent = head ? pickRandom(MC.store.getSubAgents(head.id) || [head]) : null;
            text = text.replace('{head}', head ? head.name.toLowerCase() : 'team');
            text = text.replace('{agent}', subAgent ? subAgent.name.toLowerCase() : 'team');
            if (head) mentions.push(head.id);
            if (subAgent && subAgent.id !== (head ? head.id : '')) mentions.push(subAgent.id);
        } else if (agent.role === 'department-head') {
            var subs = MC.store.getSubAgents(agent.id);
            var sub = subs.length > 0 ? pickRandom(subs) : null;
            text = text.replace('{agent}', sub ? sub.name.toLowerCase() : 'team');
            if (sub) mentions.push(sub.id);
            mentions.push('nexus');
        } else {
            var parent = agent.parentId ? MC.store.getAgent(agent.parentId) : null;
            text = text.replace('{head}', parent ? parent.name.toLowerCase() : 'lead');
            if (parent) mentions.push(parent.id);
        }

        text = text.replace('{task}', taskTitle);
        text = text.replace('{action}', action);

        return { text: text, mentions: mentions };
    }

    /* ---------- Auto-simulation ---------- */
    function startSimulation() {
        if (simulationTimer) return;
        scheduleNext();
    }

    function scheduleNext() {
        var delay = 8000 + Math.random() * 4000; /* 8-12s */
        simulationTimer = setTimeout(function () {
            var agents = MC.store.getAgents();
            var onlineAgents = agents.filter(function (a) { return a.status !== 'off'; });
            if (onlineAgents.length > 0) {
                var agent = pickRandom(onlineAgents);
                var msg = generateMessage(agent);
                MC.store.addBoardMessage(agent.id, msg.text, msg.mentions);

                if (isOpen) {
                    renderMessages();
                    updateCount();
                } else {
                    hasUnread = true;
                    updateToggleBtn();
                }
            }
            scheduleNext();
        }, delay);
    }

    function stopSimulation() {
        if (simulationTimer) {
            clearTimeout(simulationTimer);
            simulationTimer = null;
        }
    }

    function updateCount() {
        var countEl = document.getElementById('bc-count');
        if (countEl) countEl.textContent = MC.store.getBoardChat().length;
    }

    function updateToggleBtn() {
        var dot = document.getElementById('bc-unread-dot');
        if (dot) {
            dot.style.display = hasUnread ? 'block' : 'none';
        }
    }

    /* ---------- Public API ---------- */
    MC.boardChat = {
        open: function () {
            var panel = document.getElementById('board-chat-panel');
            if (!panel) return;
            isOpen = true;
            hasUnread = false;
            updateToggleBtn();
            renderPanel();
            panel.classList.add('open');
        },
        close: function () {
            var panel = document.getElementById('board-chat-panel');
            if (!panel) return;
            isOpen = false;
            panel.classList.remove('open');
        },
        toggle: function () {
            if (isOpen) {
                MC.boardChat.close();
            } else {
                MC.boardChat.open();
            }
        },
        isOpen: function () {
            return isOpen;
        },
        start: function () {
            startSimulation();
        },
        stop: function () {
            stopSimulation();
        },
    };

    /* Start simulation when page loads */
    document.addEventListener('mc:ready', function () {
        startSimulation();
    });

    window.addEventListener('beforeunload', function () {
        stopSimulation();
    });
})();
