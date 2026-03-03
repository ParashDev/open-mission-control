/* ========== HEADER COMPONENT ========== */
(function () {
    'use strict';

    MC.header = {
        init: function (pageTitle) {
            var header = document.createElement('header');
            header.id = 'mc-header';
            header.className = 'fixed top-0 right-0 z-50 h-14 bg-white/80 dark:bg-mc-dark/80 backdrop-blur-xl border-b border-neutral-200 dark:border-mc-border transition-all duration-200';
            header.style.left = '64px';

            header.innerHTML =
                '<div class="h-full px-4 md:px-6 flex items-center justify-between">' +
                    /* Left: mobile menu + page title */
                    '<div class="flex items-center gap-3">' +
                        '<button id="mobile-menu-btn" class="lg:hidden w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors">' +
                            '<i data-lucide="menu" class="w-4 h-4 text-neutral-500"></i>' +
                        '</button>' +
                        '<h1 class="font-mono text-sm font-semibold tracking-wider uppercase">' + (pageTitle || 'Dashboard') + '</h1>' +
                    '</div>' +

                    /* Center: clocks */
                    '<div class="hidden md:flex items-center gap-4 font-mono text-xs">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="text-neutral-500">LOCAL</span>' +
                            '<span id="utc-clock" class="text-neutral-900 dark:text-white tabular-nums">--:--:--</span>' +
                        '</div>' +
                        '<div class="w-px h-4 bg-neutral-300 dark:bg-neutral-700"></div>' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="text-neutral-500">MET</span>' +
                            '<span id="elapsed-clock" class="text-status-standby tabular-nums">T+--:--:--</span>' +
                        '</div>' +
                    '</div>' +

                    /* Right: status + agent count + theme toggle */
                    '<div class="flex items-center gap-3">' +
                        '<div class="hidden sm:flex items-center gap-2">' +
                            '<span class="relative flex h-2 w-2">' +
                                '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-normal opacity-75"></span>' +
                                '<span class="relative inline-flex rounded-full h-2 w-2 bg-status-normal"></span>' +
                            '</span>' +
                            '<span class="font-mono text-[10px] text-neutral-500 uppercase">Connected</span>' +
                        '</div>' +
                        '<div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-mc-hover">' +
                            '<i data-lucide="bot" class="w-3.5 h-3.5 text-status-standby"></i>' +
                            '<span class="font-mono text-[11px]" id="agent-count">' + MC.store.getAgents().length + '</span>' +
                        '</div>' +
                        '<button id="theme-toggle" class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-mc-hover flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-mc-border transition-colors" aria-label="Toggle theme">' +
                            '<i data-lucide="sun" class="w-4 h-4 hidden dark:block text-neutral-400"></i>' +
                            '<i data-lucide="moon" class="w-4 h-4 dark:hidden text-neutral-500"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>';

            var main = document.getElementById('mc-main');
            document.body.insertBefore(header, main);

            /* Wire mobile menu button after header is in DOM */
            document.getElementById('mobile-menu-btn').addEventListener('click', function () {
                MC.sidebar.toggle();
            });
        },

        updateAgentCount: function () {
            var el = document.getElementById('agent-count');
            if (el) el.textContent = MC.store.getAgents().length;
        },
    };

})();
