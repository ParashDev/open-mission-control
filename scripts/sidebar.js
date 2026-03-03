/* ========== SIDEBAR COMPONENT ========== */
(function () {
    'use strict';

    var NAV_ITEMS = [
        { page: 'index',    icon: 'layout-dashboard', label: 'Dashboard' },
        { page: 'agents',   icon: 'users',            label: 'Agents' },
        { page: 'skills',   icon: 'sparkles',         label: 'Skills' },
        { page: 'tasks',    icon: 'columns-3',        label: 'Tasks' },
        { page: 'activity', icon: 'radio',            label: 'Activity' },
        { page: 'chat',     icon: 'message-square',   label: 'Chat' },
        { page: 'memory',    icon: 'brain',            label: 'Memory' },
        { page: 'cron-jobs', icon: 'timer',            label: 'Cron Jobs' },
        { page: 'heartbeat', icon: 'heart-pulse',      label: 'Heartbeat' },
        { page: 'system',   icon: 'settings',         label: 'System' },
    ];

    function getCurrentPage() {
        var path = window.location.pathname;
        var file = path.split('/').pop().replace('.html', '') || 'index';
        return file;
    }

    MC.sidebar = {
        expanded: false,

        init: function () {
            var sidebar = document.createElement('aside');
            sidebar.id = 'mc-sidebar';
            sidebar.className = 'fixed top-0 left-0 h-full z-40 flex flex-col bg-white dark:bg-mc-card border-r border-neutral-200 dark:border-mc-border transition-all duration-200 overflow-hidden';
            sidebar.style.width = '64px';

            var current = getCurrentPage();

            /* Logo area */
            var logoHtml = '<div class="h-14 flex items-center justify-center border-b border-neutral-200 dark:border-mc-border flex-shrink-0">' +
                '<div class="w-8 h-8 rounded-lg bg-status-standby/10 flex items-center justify-center">' +
                    '<i data-lucide="radar" class="w-4 h-4 text-status-standby"></i>' +
                '</div>' +
            '</div>';

            /* Nav items */
            var navHtml = '<nav class="flex-1 py-3 flex flex-col gap-1 px-2 overflow-y-auto mc-scroll">';
            for (var i = 0; i < NAV_ITEMS.length; i++) {
                var item = NAV_ITEMS[i];
                var isActive = current === item.page;
                var href = item.page === 'index' ? 'index.html' : item.page + '.html';

                navHtml += '<a href="' + href + '" class="sidebar-link group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ' +
                    (isActive
                        ? 'bg-status-standby/10 text-status-standby'
                        : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-mc-hover hover:text-neutral-900 dark:hover:text-neutral-100') +
                    '" title="' + item.label + '">' +
                    '<i data-lucide="' + item.icon + '" class="w-[18px] h-[18px] flex-shrink-0"></i>' +
                    '<span class="sidebar-label text-[13px] font-medium whitespace-nowrap opacity-0 w-0 overflow-hidden transition-all duration-200">' + item.label + '</span>' +
                '</a>';
            }
            navHtml += '</nav>';

            /* Toggle button */
            var toggleHtml = '<div class="p-2 border-t border-neutral-200 dark:border-mc-border flex-shrink-0">' +
                '<button id="sidebar-toggle" class="w-full flex items-center justify-center py-2.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-mc-hover hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors" title="Toggle sidebar">' +
                    '<i data-lucide="panel-left-open" class="w-[18px] h-[18px]"></i>' +
                '</button>' +
            '</div>';

            sidebar.innerHTML = logoHtml + navHtml + toggleHtml;
            document.body.insertBefore(sidebar, document.body.firstChild);

            /* Mobile overlay */
            var overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.className = 'fixed inset-0 bg-black/50 z-30 hidden lg:hidden';
            document.body.insertBefore(overlay, sidebar.nextSibling);

            overlay.addEventListener('click', function () {
                MC.sidebar.collapse();
            });

            /* Mobile hamburger */
            var mobileBtn = document.getElementById('mobile-menu-btn');
            if (mobileBtn) {
                mobileBtn.addEventListener('click', function () {
                    MC.sidebar.toggle();
                });
            }

            document.getElementById('sidebar-toggle').addEventListener('click', function () {
                MC.sidebar.toggle();
            });

            /* Collapse on mobile/tablet by default */
            if (window.innerWidth < 1024) {
                sidebar.classList.add('-translate-x-full');
                sidebar.style.width = '220px';
                sidebar.querySelectorAll('.sidebar-label').forEach(function (el) {
                    el.style.opacity = '1';
                    el.style.width = 'auto';
                });
            }

            /* Handle resize: hide sidebar when shrinking below 1024 */
            window.addEventListener('resize', function () {
                if (window.innerWidth < 1024) {
                    if (!MC.sidebar.expanded) {
                        sidebar.classList.add('-translate-x-full');
                        overlay.classList.add('hidden');
                    }
                } else {
                    sidebar.classList.remove('-translate-x-full');
                    overlay.classList.add('hidden');
                    if (!MC.sidebar.expanded) {
                        sidebar.style.width = '64px';
                        sidebar.querySelectorAll('.sidebar-label').forEach(function (el) {
                            el.style.opacity = '0';
                            el.style.width = '0';
                        });
                    }
                }
            });
        },

        toggle: function () {
            if (window.innerWidth < 1024) {
                this.toggleMobile();
            } else {
                this.toggleDesktop();
            }
        },

        toggleDesktop: function () {
            var sidebar = document.getElementById('mc-sidebar');
            this.expanded = !this.expanded;

            if (this.expanded) {
                sidebar.style.width = '220px';
                sidebar.querySelectorAll('.sidebar-label').forEach(function (el) {
                    el.style.opacity = '1';
                    el.style.width = 'auto';
                });
                document.getElementById('mc-main').style.marginLeft = '220px';
            } else {
                this.collapse();
            }
        },

        toggleMobile: function () {
            var sidebar = document.getElementById('mc-sidebar');
            var overlay = document.getElementById('sidebar-overlay');
            var isHidden = sidebar.classList.contains('-translate-x-full');

            if (isHidden) {
                sidebar.classList.remove('-translate-x-full');
                sidebar.style.width = '220px';
                sidebar.querySelectorAll('.sidebar-label').forEach(function (el) {
                    el.style.opacity = '1';
                    el.style.width = 'auto';
                });
                overlay.classList.remove('hidden');
                this.expanded = true;
            } else {
                this.collapse();
            }
        },

        collapse: function () {
            var sidebar = document.getElementById('mc-sidebar');
            var overlay = document.getElementById('sidebar-overlay');
            this.expanded = false;

            if (window.innerWidth < 1024) {
                /* Mobile: slide fully off-screen, keep expanded width for next open */
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
            } else {
                /* Desktop: shrink to icon-only strip */
                sidebar.style.width = '64px';
                sidebar.querySelectorAll('.sidebar-label').forEach(function (el) {
                    el.style.opacity = '0';
                    el.style.width = '0';
                });
                var main = document.getElementById('mc-main');
                if (main) main.style.marginLeft = '';
            }
        },
    };

})();
