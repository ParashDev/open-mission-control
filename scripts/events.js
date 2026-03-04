/* ========== EVENT BUS ========== */
window.MC = window.MC || {};

(function () {
    'use strict';

    var listeners = {};

    MC.events = {
        on: function (eventName, callback) {
            if (!listeners[eventName]) listeners[eventName] = [];
            listeners[eventName].push(callback);
        },

        off: function (eventName, callback) {
            if (!listeners[eventName]) return;
            listeners[eventName] = listeners[eventName].filter(function (fn) {
                return fn !== callback;
            });
        },

        emit: function (eventName, data) {
            if (!listeners[eventName]) return;
            var fns = listeners[eventName].slice();
            for (var i = 0; i < fns.length; i++) {
                try {
                    fns[i](data);
                } catch (err) {
                    console.error('[MC.events] Error in listener for "' + eventName + '":', err);
                }
            }
        },
    };
})();
