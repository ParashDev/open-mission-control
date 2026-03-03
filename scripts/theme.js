/* ========== THEME TOGGLE ========== */
(function () {
    'use strict';

    MC.theme = {
        init: function () {
            var settings = MC.store.getSettings();
            if (settings.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            var btn = document.getElementById('theme-toggle');
            if (btn) {
                btn.addEventListener('click', function () {
                    MC.theme.toggle();
                });
            }
        },

        toggle: function () {
            document.documentElement.classList.toggle('dark');
            var isDark = this.isDark();
            MC.store.updateSettings({ theme: isDark ? 'dark' : 'light' });
            lucide.createIcons();
        },

        isDark: function () {
            return document.documentElement.classList.contains('dark');
        }
    };

})();
