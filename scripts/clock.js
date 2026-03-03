/* ========== LIVE CLOCK ========== */
(function () {
    'use strict';

    MC.clock = {
        init: function () {
            this.utcEl = document.getElementById('utc-clock');
            this.metEl = document.getElementById('elapsed-clock');
            if (!this.utcEl || !this.metEl) return;
            this.update();
            setInterval(this.update.bind(this), 1000);
        },

        update: function () {
            var now = new Date();
            if (this.utcEl) {
                this.utcEl.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
            }

            var settings = MC.store.getSettings();
            var elapsed = Date.now() - (settings.missionStart || Date.now());
            var h = Math.floor(elapsed / 3600000);
            var m = Math.floor((elapsed % 3600000) / 60000);
            var s = Math.floor((elapsed % 60000) / 1000);
            if (this.metEl) {
                this.metEl.textContent = 'T+' + this.pad(h) + ':' + this.pad(m) + ':' + this.pad(s);
            }
        },

        pad: function (n) {
            return String(n).padStart(2, '0');
        }
    };

})();
