var RecaptchaV3 = (function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    var RecaptchaV3 = {
        g: window.grecaptcha,
        _name: 'RecaptchaV3',
        _ready: false,
        _class: undefined,
        _loaded: false,
        _queue: [],
        _runQueue: function () {
            var e_1, _a;
            try {
                for (var _b = __values(this._queue), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var form = _c.value;
                    this._generateTokens(form);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        },
        _onReady: function (cb) {
            var _this = this;
            this.g.ready(function () {
                _this._ready = true;
                cb();
            });
        },
        _execute: function (form) {
            var _this = this;
            this.g.execute(this._class.config['recaptcha_site'], { action: form.config.recaptcha_action })
                .then(function (token) {
                form.plugins.config[_this._name].input.value = token;
                form.unlockBtns();
            });
        },
        _generateTokens: function (form) {
            var _this = this;
            if (this._ready) {
                this._execute(form);
            }
            else {
                this._onReady(function () { return _this._execute(form); });
            }
        },
        init: function (form) {
            var _this = this;
            if (!this._class) {
                this._class = form.constructor;
            }
            if (this._class.numbers === 0) {
                if (!this.g) {
                    var lib = document.createElement('script');
                    lib.src = 'https://www.google.com/recaptcha/api.js?render=' + this._class.config['recaptcha_site'];
                    document.head.append(lib);
                    lib.onload = function () {
                        _this.g = window.grecaptcha;
                        _this._loaded = true;
                        _this._runQueue();
                        _this._queue = [];
                    };
                }
                else {
                    this.g = window.grecaptcha;
                    this._loaded = true;
                }
            }
            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'g-recaptcha-response');
            input.setAttribute('id', 'g-recaptcha-' + this._class.numbers);
            form.plugins.config[this._name] = {
                input: input,
            };
            form.config.el.append(input);
            if (this._loaded) {
                this._generateTokens(form);
            }
            else {
                this._queue.push(form);
            }
        },
        afterSubmit: function (form, success, errors, side) {
            if (side === 'client') {
                return;
            }
            this._generateTokens(form);
        }
    };

    return RecaptchaV3;

}());
//# sourceMappingURL=RecaptchaV3.js.map
