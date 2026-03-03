/* ========== SHARED BOOTSTRAP ========== */
(function () {
    'use strict';

    /* Wait for DOM + Lucide to be ready */
    document.addEventListener('DOMContentLoaded', function () {
        var pageTitle = document.body.dataset.pageTitle || 'Dashboard';

        /* Init sidebar */
        MC.sidebar.init();

        /* Init header */
        MC.header.init(pageTitle);

        /* Init theme */
        MC.theme.init();

        /* Init clock */
        MC.clock.init();

        /* Init Lucide icons */
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        /* Scroll-reveal animation */
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05 });

        document.querySelectorAll('.reveal').forEach(function (el) {
            observer.observe(el);
        });

        /* Fire custom event so page scripts can initialize */
        document.dispatchEvent(new CustomEvent('mc:ready'));
    });

})();
