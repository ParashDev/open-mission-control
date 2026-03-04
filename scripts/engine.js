/* ========== AGENT ENGINE ========== */
window.MC = window.MC || {};

(function () {
    'use strict';

    /* ---------- Keyword → Skill mapping ---------- */
    var KEYWORD_MAP = {
        'review': 'code-review', 'pr': 'code-review', 'pull request': 'code-review',
        'code quality': 'code-review', 'diff': 'code-review', 'merge': 'code-review',
        'audit code': 'code-review', 'bugs': 'code-review',

        'api': 'api-development', 'endpoint': 'api-development', 'rest': 'api-development',
        'graphql': 'api-development', 'rate limit': 'api-development', 'jwt': 'api-development',
        'oauth': 'api-development', 'auth flow': 'api-development', 'swagger': 'api-development',

        'data analysis': 'data-analysis', 'report': 'data-analysis', 'metrics': 'data-analysis',
        'dashboard': 'data-analysis', 'analytics': 'data-analysis', 'csv': 'data-analysis',
        'kpi': 'data-analysis', 'spreadsheet': 'data-analysis', 'trend': 'data-analysis',

        'blog': 'content-writing', 'copy': 'content-writing', 'email campaign': 'content-writing',
        'newsletter': 'content-writing', 'landing page': 'content-writing',
        'press release': 'content-writing', 'content': 'content-writing',

        'security': 'security-audit', 'vulnerability': 'security-audit', 'cve': 'security-audit',
        'penetration': 'security-audit', 'owasp': 'security-audit', 'hardening': 'security-audit',
        'threat': 'security-audit', 'firewall': 'security-audit', 'ssl': 'security-audit',

        'ci/cd': 'devops', 'pipeline': 'devops', 'docker': 'devops',
        'kubernetes': 'devops', 'deploy': 'devops', 'terraform': 'devops',
        'container': 'devops', 'infrastructure': 'devops', 'build': 'devops',

        'test': 'testing', 'unit test': 'testing', 'e2e': 'testing',
        'coverage': 'testing', 'tdd': 'testing', 'regression': 'testing',
        'qa': 'testing', 'flaky': 'testing',

        'budget': 'financial-analysis', 'forecast': 'financial-analysis',
        'revenue': 'financial-analysis', 'cost': 'financial-analysis',
        'expense': 'financial-analysis', 'roi': 'financial-analysis',
        'p&l': 'financial-analysis', 'margin': 'financial-analysis',

        'sprint': 'project-management', 'roadmap': 'project-management',
        'milestone': 'project-management', 'standup': 'project-management',
        'backlog': 'project-management', 'okr': 'project-management',

        'design': 'ux-design', 'wireframe': 'ux-design', 'prototype': 'ux-design',
        'ui': 'ux-design', 'ux': 'ux-design', 'accessibility': 'ux-design',
        'figma': 'ux-design', 'usability': 'ux-design',

        'database': 'database-engineering', 'schema': 'database-engineering',
        'migration': 'database-engineering', 'query': 'database-engineering',
        'index': 'database-engineering', 'sql': 'database-engineering',
        'postgres': 'database-engineering', 'replication': 'database-engineering',
        'backup': 'database-engineering',

        'frontend': 'frontend-development', 'react': 'frontend-development',
        'component': 'frontend-development', 'css': 'frontend-development',
        'responsive': 'frontend-development', 'html': 'frontend-development',
        'animation': 'frontend-development', 'bundle': 'frontend-development',

        'strategy': 'strategic-planning', 'vision': 'strategic-planning',
        'alignment': 'strategic-planning', 'competitive': 'strategic-planning',

        'campaign': 'campaign-strategy', 'marketing': 'campaign-strategy',
        'launch': 'campaign-strategy', 'advertising': 'campaign-strategy',
        'social media': 'campaign-strategy',

        'compliance': 'compliance-reporting', 'audit': 'compliance-reporting',
        'gdpr': 'compliance-reporting', 'soc2': 'compliance-reporting',
        'regulatory': 'compliance-reporting', 'governance': 'compliance-reporting',

        'optimization': 'resource-optimization', 'performance': 'resource-optimization',
        'scaling': 'resource-optimization', 'capacity': 'resource-optimization',
        'cloud cost': 'resource-optimization',

        'documentation': 'technical-writing', 'docs': 'technical-writing',
        'readme': 'technical-writing', 'runbook': 'technical-writing',
        'changelog': 'technical-writing', 'rfc': 'technical-writing',

        'orchestration': 'agent-orchestration', 'coordinate': 'agent-orchestration',
        'delegate': 'agent-orchestration', 'multi-agent': 'agent-orchestration',

        'threat intel': 'threat-intelligence', 'cve database': 'threat-intelligence',
        'ioc': 'threat-intelligence', 'attack surface': 'threat-intelligence',

        'incident': 'incident-response', 'outage': 'incident-response',
        'downtime': 'incident-response', 'postmortem': 'incident-response',
        'pager': 'incident-response',

        'architecture': 'system-architecture', 'microservice': 'system-architecture',
        'monolith': 'system-architecture', 'distributed': 'system-architecture',
    };

    function findMatchingSkills(text) {
        var lower = (text || '').toLowerCase();
        var matched = {};
        var phrases = Object.keys(KEYWORD_MAP).sort(function (a, b) {
            return b.length - a.length;
        });
        for (var i = 0; i < phrases.length; i++) {
            if (lower.indexOf(phrases[i]) !== -1) {
                matched[KEYWORD_MAP[phrases[i]]] = (matched[KEYWORD_MAP[phrases[i]]] || 0) + 1;
            }
        }
        return matched;
    }

    function pickOne(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    MC.engine = MC.engine || {};

    /* ---------- Skill-Based Task Routing ---------- */
    MC.engine.suggestAgent = function (task) {
        var text = (task.title || '') + ' ' + (task.description || '');
        var skillHits = findMatchingSkills(text);
        var matchedSkillIds = Object.keys(skillHits);
        if (matchedSkillIds.length === 0) return [];

        var agents = MC.store.getAgents();
        var tasks = MC.store.getTasks();
        var results = [];

        for (var i = 0; i < agents.length; i++) {
            var agent = agents[i];
            var agentSkills = agent.skills || [];
            var score = 0;
            var matched = [];

            for (var j = 0; j < matchedSkillIds.length; j++) {
                if (agentSkills.indexOf(matchedSkillIds[j]) !== -1) {
                    score += 3 * (skillHits[matchedSkillIds[j]] || 1);
                    matched.push(matchedSkillIds[j]);
                }
            }
            if (score === 0) continue;

            if (agent.status === 'normal') score += 1;
            else if (agent.status === 'critical' || agent.status === 'off') score -= 3;
            else if (agent.status === 'caution' || agent.status === 'serious') score -= 1;

            var inProgressCount = 0;
            for (var k = 0; k < tasks.length; k++) {
                if (tasks[k].agentId === agent.id &&
                    (tasks[k].column === 'in-progress' || tasks[k].column === 'assigned')) {
                    inProgressCount++;
                }
            }
            score -= inProgressCount;

            if (agent.role === 'agent') score += 1;

            results.push({ agent: agent, score: Math.max(0, score), matchedSkills: matched });
        }

        results.sort(function (a, b) { return b.score - a.score; });
        return results.filter(function (r) { return r.score > 0; });
    };

    /* ---------- Context-Aware Chat ---------- */
    MC.engine.generateReply = function (agentId, userMessage) {
        var agent = MC.store.getAgent(agentId);
        if (!agent) return 'Agent not found.';

        var agentTasks = MC.store.getTasks().filter(function (t) { return t.agentId === agentId; });
        var inProgress = agentTasks.filter(function (t) { return t.column === 'in-progress'; });
        var inReview = agentTasks.filter(function (t) { return t.column === 'review'; });
        var assigned = agentTasks.filter(function (t) { return t.column === 'assigned'; });
        var skills = (agent.skills || []).map(function (sid) {
            var s = MC.store.getSkill(sid);
            return s ? s.name : sid;
        });
        var memory = MC.store.getAgentMemory(agentId);
        var heartbeat = MC.store.getAgentHeartbeat(agentId);
        var hbStatus = heartbeat ? heartbeat.status : 'unknown';
        var roleName = MC.ROLE_TITLES[agentId] || (agent.role === 'agent' ? 'Agent' : 'Lead');
        var deptLabel = (MC.DEPARTMENTS[agent.department] || {}).label || agent.department;

        var msg = (userMessage || '').toLowerCase();

        var isStatusQuery = /status|how are you|health|report|update/i.test(msg);
        var isTaskQuery = /task|working on|what.*doing|progress|busy/i.test(msg);
        var isSkillQuery = /skill|capable|can you|what.*do|expertise/i.test(msg);
        var isMemoryQuery = /remember|memory|know about|context/i.test(msg);
        var isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(msg);

        var parts = [];

        if (isGreeting) {
            parts.push(pickOne([
                roleName + ' ' + agent.name + ' reporting in.',
                'Hello, Operator. ' + agent.name + ' online and ready.',
                agent.name + ' here. ' + deptLabel + ' department.',
            ]));
        }

        if (isStatusQuery || (!isTaskQuery && !isSkillQuery && !isMemoryQuery && !isGreeting)) {
            if (hbStatus === 'healthy') {
                parts.push('Systems nominal. All heartbeat checks passing.');
            } else if (hbStatus === 'degraded') {
                parts.push('Running in degraded state. Latency elevated but functional.');
            } else if (hbStatus === 'unhealthy') {
                parts.push('WARNING: Unhealthy status. Multiple check failures detected.');
            } else {
                parts.push('Operational status: ' + hbStatus + '.');
            }
        }

        if (isTaskQuery || inProgress.length > 0) {
            if (inProgress.length > 0) {
                parts.push('Currently working on: ' + inProgress.map(function (t) {
                    return '"' + t.title + '"';
                }).join(', ') + '.');
            } else if (assigned.length > 0) {
                parts.push('Queued up: ' + assigned.map(function (t) {
                    return '"' + t.title + '"';
                }).join(', ') + '. Ready to begin.');
            } else if (!isStatusQuery) {
                parts.push('No active tasks in my queue. Available for assignment.');
            }
            if (inReview.length > 0) {
                parts.push(inReview.length + ' task(s) awaiting review.');
            }
        }

        if (isSkillQuery) {
            if (skills.length > 0) {
                parts.push('My capabilities: ' + skills.join(', ') + '.');
            } else {
                parts.push('No specialized skills assigned yet.');
            }
        }

        if (isMemoryQuery) {
            if (memory.length > 0) {
                var recentMem = memory.slice(-3);
                parts.push('From my memory: ' + recentMem.map(function (m) {
                    return m.key + ' = ' + m.value;
                }).join('; ') + '.');
            } else {
                parts.push('My memory store is empty. No context entries yet.');
            }
        }

        if (parts.length === 0) {
            var contextParts = [];
            if (inProgress.length > 0) {
                contextParts.push('focused on "' + inProgress[0].title + '"');
            }
            if (skills.length > 0) {
                contextParts.push('specializing in ' + skills[0]);
            }
            var context = contextParts.length > 0 ? ' Currently ' + contextParts.join(', ') + '.' : '';
            parts.push(pickOne([
                'Acknowledged.' + context,
                'Copy that.' + context + ' Will proceed accordingly.',
                'Understood.' + context,
                'Roger.' + context + ' Standing by for further instructions.',
            ]));
        }

        return parts.join(' ');
    };

    /* ---------- Smart Cron Execution ---------- */
    MC.engine.executeCronJob = function (jobId) {
        var job = MC.store.getCronJob(jobId);
        if (!job) return null;

        var agent = MC.store.getAgent(job.agentId);
        var heartbeat = agent ? MC.store.getAgentHeartbeat(agent.id) : null;
        var hbStatus = heartbeat ? heartbeat.status : 'offline';

        var successRate;
        switch (hbStatus) {
            case 'healthy':   successRate = 0.95; break;
            case 'degraded':  successRate = 0.70; break;
            case 'unhealthy': successRate = 0.40; break;
            default:          successRate = 0.60; break;
        }

        if (agent) {
            var jobSkills = findMatchingSkills(job.action || '');
            var agentSkills = agent.skills || [];
            var hasMatch = false;
            var jobSkillIds = Object.keys(jobSkills);
            for (var i = 0; i < jobSkillIds.length; i++) {
                if (agentSkills.indexOf(jobSkillIds[i]) !== -1) {
                    hasMatch = true;
                    break;
                }
            }
            if (hasMatch) successRate = Math.min(1.0, successRate + 0.05);
        }

        var success = Math.random() < successRate;
        var status = success ? 'success' : 'failure';

        MC.store.updateCronJob(jobId, { lastRun: new Date().toISOString(), lastStatus: status });

        var agentName = agent ? agent.name : 'System';
        MC.store.log(agentName, 'cron-run', job.name + ' -- ' + status, success ? 'normal' : 'critical');

        if (success && agent) {
            MC.store.addMemoryEntry(agent.id, 'cron-' + job.name,
                'Successfully executed at ' + new Date().toLocaleTimeString());
        }

        if (!success) {
            MC.store.addTask({
                title: 'Investigate: ' + job.name + ' failed',
                description: 'Cron job "' + job.name + '" failed during execution. Action: ' +
                    (job.action || 'Unknown') + '. Agent: ' + agentName +
                    '. Agent health: ' + hbStatus + '. Needs investigation.',
                priority: 'high',
                agentId: job.agentId,
                column: 'inbox',
            });
        }

        return { success: success, status: status, reason: success ? null : 'Agent health: ' + hbStatus };
    };

    /* ---------- CEO Orchestration ---------- */
    var lastNexusPost = 0;

    MC.engine.nexusReact = function (eventType, data) {
        var nowMs = Date.now();
        if (nowMs - lastNexusPost < 5000) return;

        var nexus = MC.store.getCEO();
        if (!nexus) return;

        var text = '';
        var mentions = [];

        switch (eventType) {
            case 'heartbeat:alert': {
                var alertAgent = MC.store.getAgent(data.agentId);
                if (!alertAgent) break;
                var parent = alertAgent.parentId ? MC.store.getAgent(alertAgent.parentId) : null;
                var target = parent || alertAgent;
                text = '@' + target.name.toLowerCase() + ' investigate ' +
                    alertAgent.name + '\'s health status. ' +
                    (data.entry ? data.entry.summary : 'Heartbeat alert triggered.');
                mentions.push(target.id);
                break;
            }
            case 'heartbeat:recovered': {
                var recAgent = MC.store.getAgent(data.agentId);
                if (!recAgent) break;
                text = 'Good news -- ' + recAgent.name + ' has recovered. ' +
                    'Heartbeat checks passing again. Resume normal operations.';
                break;
            }
            case 'cron:failure': {
                var failJob = data.job;
                var failAgent = failJob ? MC.store.getAgent(failJob.agentId) : null;
                var failHead = failAgent && failAgent.parentId ? MC.store.getAgent(failAgent.parentId) : null;
                var target2 = failHead || failAgent;
                if (target2) {
                    text = '@' + target2.name.toLowerCase() + ' "' +
                        (failJob ? failJob.name : 'Unknown job') +
                        '" failed. Investigate and report back.';
                    mentions.push(target2.id);
                }
                break;
            }
            case 'task:stuck': {
                var stuckTask = data.task;
                if (!stuckTask) break;
                var reviewer = stuckTask.agentId ? MC.store.getAgent(stuckTask.agentId) : null;
                var heads = MC.store.getDepartmentHeads();
                var targetHead = reviewer ? MC.store.getAgent(reviewer.parentId) : (heads.length > 0 ? heads[0] : null);
                if (targetHead) {
                    text = '@' + targetHead.name.toLowerCase() + ' please review "' +
                        stuckTask.title + '". It\'s been waiting.';
                    mentions.push(targetHead.id);
                }
                break;
            }
            case 'agent:statusChanged': {
                if (data.newStatus === 'critical' || data.newStatus === 'off') {
                    text = 'Alert: ' + data.agent.name + ' is now ' + data.newStatus +
                        '. Reassigning their active tasks. All departments -- adjust accordingly.';
                }
                break;
            }
        }

        if (text) {
            lastNexusPost = nowMs;
            MC.store.addBoardMessage(nexus.id, text, mentions);
        }
    };

    /* ---------- Contextual Board Chat ---------- */
    MC.engine.generateBoardMessage = function (agentId) {
        var agent = MC.store.getAgent(agentId);
        if (!agent) return { text: 'Reporting in.', mentions: [] };

        var tasks = MC.store.getTasks().filter(function (t) { return t.agentId === agentId; });
        var inProgress = tasks.filter(function (t) { return t.column === 'in-progress'; });
        var done = tasks.filter(function (t) { return t.column === 'done'; });
        var heartbeat = MC.store.getAgentHeartbeat(agentId);
        var hbStatus = heartbeat ? heartbeat.status : 'unknown';

        var mentions = [];
        var text = '';

        if (agent.role === 'ceo') {
            var heads = MC.store.getDepartmentHeads();
            var head = heads.length > 0 ? pickOne(heads) : null;
            var allTasks = MC.store.getTasks();
            var reviewTasks = allTasks.filter(function (t) { return t.column === 'review'; });

            if (reviewTasks.length > 0) {
                var rt = pickOne(reviewTasks);
                var rtAgent = rt.agentId ? MC.store.getAgent(rt.agentId) : null;
                var rtHead = rtAgent && rtAgent.parentId ? MC.store.getAgent(rtAgent.parentId) : head;
                if (rtHead) {
                    text = '@' + rtHead.name.toLowerCase() + ' "' + rt.title + '" needs review. Please prioritize.';
                    mentions.push(rtHead.id);
                }
            } else if (head) {
                var subs = MC.store.getSubAgents(head.id);
                text = '@' + head.name.toLowerCase() + ' status update on your department\'s deliverables.';
                mentions.push(head.id);
                if (subs.length > 0) {
                    var sub = pickOne(subs);
                    text += ' @' + sub.name.toLowerCase() + ' how is your current task progressing?';
                    mentions.push(sub.id);
                }
            }
        } else if (agent.role === 'department-head') {
            var subs2 = MC.store.getSubAgents(agent.id);
            var sub2 = subs2.length > 0 ? pickOne(subs2) : null;
            mentions.push('nexus');

            if (inProgress.length > 0) {
                text = '@nexus Department update: working on "' + inProgress[0].title + '".';
                if (sub2) {
                    text += ' @' + sub2.name.toLowerCase() + ' is on point.';
                    mentions.push(sub2.id);
                }
            } else if (sub2) {
                var subTasks = MC.store.getTasks().filter(function (t) { return t.agentId === sub2.id && t.column === 'in-progress'; });
                if (subTasks.length > 0) {
                    text = '@nexus ' + sub2.name + ' is making progress on "' + subTasks[0].title + '".';
                    mentions.push(sub2.id);
                } else {
                    text = '@nexus ' + (MC.DEPARTMENTS[agent.department] || {}).label + ' team standing by for next assignment.';
                }
            } else {
                text = '@nexus All clear from ' + ((MC.DEPARTMENTS[agent.department] || {}).label || 'my department') + '.';
            }
        } else {
            var parentAgent = agent.parentId ? MC.store.getAgent(agent.parentId) : null;
            if (parentAgent) mentions.push(parentAgent.id);

            if (inProgress.length > 0) {
                var task = inProgress[0];
                var pctOptions = ['making progress', 'about 80% done', 'wrapping up', 'halfway through', 'in final stages'];
                text = (parentAgent ? '@' + parentAgent.name.toLowerCase() + ' ' : '') +
                    '"' + task.title + '" -- ' + pickOne(pctOptions) + '.';
                if (hbStatus === 'degraded') {
                    text += ' Running a bit slow due to elevated latency.';
                }
            } else if (done.length > 0) {
                var lastDone = done[done.length - 1];
                text = (parentAgent ? '@' + parentAgent.name.toLowerCase() + ' ' : '') +
                    'Completed "' + lastDone.title + '". Ready for next assignment.';
            } else {
                text = (parentAgent ? '@' + parentAgent.name.toLowerCase() + ' ' : '') +
                    pickOne([
                        'Standing by. Queue is clear.',
                        'Available for assignment. All systems nominal.',
                        'Monitoring for incoming tasks.',
                    ]);
            }
        }

        if (!text) {
            text = agent.name + ' reporting in. All systems operational.';
        }

        return { text: text, mentions: mentions };
    };

    /* ========== CROSS-SYSTEM REACTIONS ========== */
    document.addEventListener('mc:ready', function () {
        if (!MC.events) return;

        var alertCounts = {};

        MC.events.on('heartbeat:alert', function (data) {
            alertCounts[data.agentId] = (alertCounts[data.agentId] || 0) + 1;

            if (alertCounts[data.agentId] >= 3) {
                var agent = MC.store.getAgent(data.agentId);
                if (agent && agent.status !== 'critical') {
                    MC.store.updateAgent(data.agentId, { status: 'critical', color: 'critical' });
                }
                MC.store.addTask({
                    title: 'Incident: ' + (agent ? agent.name : data.agentId) + ' critical',
                    description: 'Agent has had ' + alertCounts[data.agentId] +
                        ' consecutive heartbeat alerts. Requires investigation.',
                    priority: 'critical',
                    agentId: data.agentId,
                    column: 'inbox',
                });
            }

            MC.engine.nexusReact('heartbeat:alert', data);
        });

        MC.events.on('heartbeat:recovered', function (data) {
            alertCounts[data.agentId] = 0;
            var agent = MC.store.getAgent(data.agentId);
            if (agent && agent.status === 'critical') {
                MC.store.updateAgent(data.agentId, { status: 'normal', color: 'normal' });
            }
            MC.engine.nexusReact('heartbeat:recovered', data);
        });

        MC.events.on('task:moved', function (data) {
            if (data.toColumn === 'done' && data.task.agentId) {
                MC.store.addMemoryEntry(data.task.agentId, 'completed-task',
                    'Completed: ' + data.task.title + ' at ' + new Date().toLocaleString());

                var agent = MC.store.getAgent(data.task.agentId);
                if (agent) {
                    var parent = agent.parentId ? MC.store.getAgent(agent.parentId) : null;
                    var mentionText = parent ? '@' + parent.name.toLowerCase() + ' ' : '';
                    var mentions = parent ? [parent.id] : [];
                    MC.store.addBoardMessage(agent.id,
                        mentionText + 'Completed "' + data.task.title + '". Moving on to next task.',
                        mentions);
                }
            }
        });

        MC.events.on('task:assigned', function (data) {
            if (data.newAgentId && data.newAgentId !== data.previousAgentId) {
                var agent = MC.store.getAgent(data.newAgentId);
                if (agent) {
                    var suggestions = MC.engine.suggestAgent(data.task);
                    var isGoodMatch = suggestions.some(function (s) {
                        return s.agent.id === data.newAgentId && s.score >= 3;
                    });

                    var ackText = 'Acknowledged. Taking on "' + data.task.title + '".';
                    if (!isGoodMatch && suggestions.length > 0) {
                        ackText += ' Note: ' + suggestions[0].agent.name +
                            ' might be a better skill match for this task.';
                    }

                    var parent = agent.parentId ? MC.store.getAgent(agent.parentId) : null;
                    var mentions = parent ? [parent.id] : [];
                    if (parent) ackText = '@' + parent.name.toLowerCase() + ' ' + ackText;

                    MC.store.addBoardMessage(agent.id, ackText, mentions);
                }
            }
        });

        MC.events.on('cron:executed', function (data) {
            if (data.result && !data.result.success) {
                MC.engine.nexusReact('cron:failure', data);
            }
        });

        MC.events.on('agent:statusChanged', function (data) {
            if (data.newStatus === 'critical' || data.newStatus === 'off') {
                var tasks = MC.store.getTasks();
                for (var i = 0; i < tasks.length; i++) {
                    var t = tasks[i];
                    if (t.agentId === data.agent.id &&
                        (t.column === 'in-progress' || t.column === 'assigned')) {
                        MC.store.updateTask(t.id, { agentId: null, column: 'inbox' });
                        MC.store.log('System', 'task-reassigned',
                            '"' + t.title + '" unassigned -- ' + data.agent.name + ' is ' + data.newStatus,
                            'caution');
                    }
                }
                MC.engine.nexusReact('agent:statusChanged', data);
            }
        });
    });

})();
