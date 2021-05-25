var XaroForm = (function () {
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

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from) {
        for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
            to[j] = from[i];
        return to;
    }

    class EventEmitter {
        /**
         * Create Emitter
         */
        constructor(on = {}) {
            /**
             * Event list
             */
            this.events = {};
            for (let key in on) {
                if (on[key]) {
                    this.subscribe(key, on[key]);
                }
            }
        }
        /**
         * Creates a key for the event and subscribes the passed callback to it.
         */
        subscribe(key, cb) {
            if (!this.has(key)) {
                this.events[key] = [];
            }
            let removes = [];
            if (Array.isArray(cb)) {
                for (const _cb of cb) {
                    removes.push(...this.subscribe(key, _cb));
                }
            }
            else {
                this.events[key].push(cb);
                removes.push(() => this.removeListener(key, cb));
            }
            return removes;
        }
        /**
         * Unsubscribes all callback functions from the event and removes the event
         * key.
         */
        unsubscribe(...keys) {
            for (const key of keys) {
                if (this.events[key]) {
                    delete this.events[key];
                }
            }
        }
        /**
         * Removes a specific event key callback function.
         */
        removeListener(key, cb) {
            // if (typeof this.events[key] === 'object') {
            if (Array.isArray(this.events[key])) {
                const idx = this.events[key].indexOf(cb);
                if (idx > -1) {
                    this.events[key].splice(idx, 1);
                }
            }
        }
        /**
         * Calls the callback function only once, and then removes it.
         */
        once(key, cb) {
            const remove = this.subscribe(key, () => {
                remove[0]();
                Array.isArray(cb) ? cb.forEach(_cb => _cb()) : cb();
            });
        }
        /**
         * Checks for an event by key.
         * (Doesn't check for callback functions)
         */
        has(key) {
            return !!this.events[key];
        }
        /**
         * Returns the number of callback functions for the event key or "false" if
         * there is no key
         */
        listenerCount(key) {
            if (!this.events.hasOwnProperty(key)) {
                return false;
            }
            return this.events[key].length;
        }
        /**
         * Calls all callback functions on events using the event key.
         */
        emit(key, ...args) {
            const event = this.events[key];
            if (event) {
                for (let cb of event) {
                    cb(...args);
                }
            }
        }
        /**
         * Just like "emit" calls all callback functions. However, the callback must
         * return a boolean value, which determines whether or not the next callback
         * will execute.
         * As a result, it returns the result of the last executed callback function.
         */
        validateEmit(key, ...args) {
            const event = this.events[key];
            if (!event) {
                return false;
            }
            for (const cb of event) {
                if (!cb(...args)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * Just like "emit" calls all callbacks, but unlike "emit" it passes the
         * result of the previous callback to the next one as an argument.
         * As aresult, it will return the result of the last callback.
         */
        seriesEmit(key, ...args) {
            const event = this.events[key];
            if (!event) {
                return;
            }
            let params;
            for (let i = 0; i < event.length; i++) {
                if (i === 0) {
                    params = event[i](...args);
                }
                else {
                    params = event[i](params);
                }
            }
            return params;
        }
    }

    function getEls(target, ...els) {
        const arr = [];
        for (const el of els) {
            if (typeof el === 'string') {
                const nodes = target.querySelectorAll(el);
                arr.push(...nodes);
            }
            else if (el instanceof Element) {
                arr.push(el);
            }
        }
        return arr;
    }
    function recursiveAppend(el, ...content) {
        for (const entity of content) {
            if (Array.isArray(entity)) {
                recursiveAppend(el, ...entity);
            }
            else {
                el.append(entity);
            }
        }
    }
    function nextTick(...cbs) {
        const arr = cbs;
        const current = cbs.shift();
        current && setTimeout(() => {
            current();
            if (arr.length) {
                nextTick(...arr);
            }
        }, 0);
        return this;
    }

    class MicroDOM extends Array {
        constructor(...args) {
            super(...args);
        }
        /**
         * Returns a new instance containing the elements with the passed selectors and elements (or from the document if the current instance is empty)
         */
        get(...args) {
            let newInstance = new MicroDOM();
            if (this.length) {
                for (const el of this) {
                    newInstance.push(...getEls(el, ...args));
                }
            }
            else {
                newInstance.push(...getEls(document, ...args));
            }
            return newInstance;
        }
        /**
         * Returns a new instance with new created elements according to the passed parameters
         */
        create(...entities) {
            let newInstance = new MicroDOM();
            for (const entity of entities) {
                if (typeof entity === 'string') {
                    newInstance.push(document.createElement(entity));
                }
                else if (entity instanceof Object) {
                    const el = document.createElement(entity.tagName || 'div');
                    if (entity.content) {
                        if (Array.isArray(entity.content)) {
                            recursiveAppend(el, ...entity.content);
                        }
                        else {
                            recursiveAppend(el, entity.content);
                        }
                    }
                    newInstance.push(el);
                }
            }
            return newInstance;
        }
        /**
         * Clears the contents of each element in the set and returns the instance itself
         */
        empty() {
            this.forEach(el => el.innerHTML = '');
            return this;
        }
        /**
         * Sets the textContent property for each collection item and returns an instance
         */
        text(text) {
            this.forEach(el => el.textContent = text || '');
            return this;
        }
        /**
         * Inserts a set of Node objects or DOMString objects after the last child of each array element
         */
        append(...append) {
            this.forEach(el => recursiveAppend(el, ...append));
            return this;
        }
        /**
         * Adds a class or classes to all array elements
         */
        addClass(...classes) {
            this.forEach(el => el.classList.add(...classes));
            return this;
        }
        /**
         * Removes a class or classes from all array elements
         */
        removeClass(...classes) {
            this.forEach(el => el.classList.remove(...classes));
            return this;
        }
        /**
         * Adds or removes a class for each element of the array, depending on its presence
         */
        toggleClass(classname) {
            this.forEach(el => el.classList.toggle(classname));
            return this;
        }
        /**
         * Determine if any of the agreed members are assigned to this class. Or, if you pass "true" as the second argument, then each element (default: reqtForAll = false)
         */
        hasClass(classname, reqtForAll = false) {
            if (reqtForAll) { // The presence of a class for each element of the set
                let number = 0;
                this.forEach(el => {
                    if (el.classList.contains(classname)) {
                        number++;
                    }
                });
                return number === this.length;
            }
            else { // the presence of a class for at least one element of the set
                for (const el of this) {
                    if (el.classList.contains(classname)) {
                        return true;
                    }
                }
                return false;
            }
        }
        /**
         * Calls the "addEventListener" method for each set item
         */
        addEventListener(type, listener, options) {
            this.forEach(el => el.addEventListener(type, listener, options));
            return this;
        }
        /**
         * Calls the "removeEventListener" method for each set item
         */
        removeEventListener(type, listener, options) {
            this.forEach(el => el.removeEventListener(type, listener, options));
            return this;
        }
        /**
         * Calls dispatchEvent with an event of the specified type for each item in the set
         */
        fireEvent(type) {
            this.forEach(el => el.dispatchEvent(new Event(type)));
            return this;
        }
        /**
         * Sets the style attribute property passed in the object by key
         */
        css(obj) {
            this.forEach(el => Object.keys(obj).forEach(key => el.style[key] = obj[key]));
            return this;
        }
        /**
         * Sets the attribute property passed in the object by key
         */
        attr(obj) {
            this.forEach(el => Object.keys(obj).forEach(key => el.setAttribute(key, obj[key])));
            return this;
        }
        /**
         * Recursively calls each passed function in a new setTimeout(() => {}, 0)
         */
        nextTick(...cbs) {
            nextTick(...cbs);
            return this;
        }
    }

    function _(...args) {
        if (args instanceof MicroDOM) {
            return args;
        }
        return new MicroDOM(...getEls(document, ...args));
    }

    var Validator = /** @class */ (function () {
        function Validator() {
        }
        Validator.required = function (field) {
            var e_1, _a;
            if (field.isMultiple) {
                return !!field.value.length;
            }
            else if (field.isFile) {
                try {
                    for (var _b = __values(field.inputs), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var input = _c.value;
                        if (input.value !== '') {
                            return true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return false;
            }
            return field.value !== null && field.value !== '';
            // return field.isMultiple ? !!(field.value as FormDataEntryValue[]).length : field.value !== '';
        };
        Validator.minLength = function (field, value) {
            return field.value.length >= +value;
        };
        Validator.maxLength = function (field, value) {
            return field.value.length <= +value;
        };
        Validator.email = function (field) {
            return !!field.value.match(/^[a-zA-Zа-яА-Яё\d][a-zA-Zа-яА-ЯёЁ\d\.\-_]*[a-zA-Zа-яА-ЯёЁ\d]\@[a-zA-Zа-яА-ЯёЁ\d]([a-zA-Zа-яА-ЯёЁ\d\-]|\.)+[a-zA-Zа-яА-ЯёЁ\d]{2,}$/);
        };
        Validator.passwordConfirm = function (field, confirm_key) {
            return field.value === field.form.fields[confirm_key].value;
        };
        return Validator;
    }());

    /**
     * Convert string with camelCase to snake_case
     * @param str string
     * @returns string
     * @example camelToSnake('isNumber') => 'is_number'
     */
    var camelToSnake = function (str) { return str.replace(/[A-Z]/g, function (char) { return '_' + char.toLowerCase(); }); };
    /**
     * Returns the intersection of two arrays.
     * @example intersection([ 1, 3, 5 ], [ 1, 5, 7 ]) => [ 1, 5 ]
     */
    var intersection = function (first, second) {
        return first.filter(function (x) { return second.includes(x); });
    };
    // console.log(intersectionMultiple(
    //   [ 1, 3, 5, 7, 9, 11, 13],
    //   [ 2, 3, 7, 11, 15],
    //   // [ 5, 7, 10, 11, 17 ],
    //   // [ 4, 6, 7, 11 ]
    // ));
    /**
     * Returns the difference between the second array and the first
     * @example difference([ 1, 3, 5 ], [ 1, 5, 9 ]) => [ 3 ];
     * @example difference([ 1, 5, 9 ], [ 1, 3, 5 ]) => [ 9 ];
     */
    var difference = function (target, compare) {
        return compare.filter(function (x) { return !target.includes(x); });
    };
    /**
     * Alias for Object.keys()
     * @param obj Object
     * @returns string[]
     */
    var keys = function (obj) { return Object.keys(obj); };

    var Field = /** @class */ (function () {
        function Field(config) {
            this.errors = {};
            this.form = config.form;
            this.el = config.el;
            this.inputs = config.inputs;
            this.name = config.name;
            this.type = config.type;
            this.isMultiple = this.name.includes('[]');
            this.isFile = this.type === 'file';
        }
        Object.defineProperty(Field.prototype, "value", {
            get: function () {
                var data = new FormData(this.form.config.el);
                return this.isMultiple ? data.getAll(this.name) : data.get(this.name);
            },
            enumerable: false,
            configurable: true
        });
        Field.prototype.addError = function (code, msg, el) {
            this.el.classList.add('x-form__field--error');
            if (!keys(this.errors).includes(code + '')) {
                if (!el) {
                    var $el = _().create({ content: msg }).addClass('x-form__field-error');
                    el = $el[0];
                }
                this.errors[code] = {
                    msg: msg,
                    el: el
                };
                this.el.append(this.errors[code].el);
                nextTick(function () { return el.classList.add('x-form__field-error--show'); });
            }
        };
        Field.prototype.removeError = function (code) {
            var _a;
            if (keys(this.errors).includes(code)) {
                (_a = this.errors[code].el) === null || _a === void 0 ? void 0 : _a.remove();
                delete this.errors[code];
            }
            if (!keys(this.errors).length) {
                this.el.classList.remove('x-form__field--error');
            }
        };
        Field.prototype.clearErrors = function () {
            for (var error_code in this.errors) {
                this.removeError(error_code);
            }
            this.el.classList.remove('x-form__field--error');
        };
        return Field;
    }());

    var XaroForm = /** @class */ (function () {
        function XaroForm(config) {
            var e_1, _a, e_2, _b;
            var _this = this;
            // fields elements with inputs
            this.fields = {};
            // form buttons element (submit/reset/etc)
            this.btns = {};
            // other errors object
            this.errors = {};
            // plugins for current instance
            this.plugins = {
                list: [],
                config: {}
            };
            this.emitter = new EventEmitter(config.on);
            this.config = config;
            try {
                // Fields
                for (var _c = __values(_(this.config.el).get('.x-form__field')), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var el = _d.value;
                    var inputs = _(el).get('.x-form__input');
                    if (!inputs.length) {
                        throw new Error("Field element has not contains input element/s");
                    }
                    var name_1 = inputs[0].name;
                    if (!name_1) {
                        throw new Error("Name of input element does not exists");
                    }
                    this.fields[name_1] = new Field({
                        form: this,
                        el: el,
                        inputs: inputs,
                        name: name_1,
                        type: inputs[0].type,
                    });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // Buttons (submit/reset/etc)
            var btn_i = 0;
            try {
                for (var _e = __values(_(this.config.el).get('.x-form__btn')), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var btn = _f.value;
                    var type = btn.getAttribute('type');
                    if (type) {
                        if (type in this.btns) {
                            this.btns[type].push(btn);
                        }
                        else {
                            this.btns[type] = [btn];
                        }
                    }
                    else {
                        this.btns['undefined_' + btn_i] = [btn];
                        btn_i++;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            this.lockBtns();
            // Common errors wrapper el
            var errorsEl = _(this.config.el).get('.x-form__errors');
            this.errorsEl = errorsEl.length ? errorsEl[0] : undefined;
            // Submit listener
            this.config.el.addEventListener('submit', function (e) {
                e.preventDefault();
                _this.submit();
                return false;
            });
            // plugins
            var pluginKeys = keys(XaroForm.plugins);
            if (this.config.plugins) {
                var plugins = [];
                for (var i = 0; i < this.config.plugins.length; i++) {
                    if (pluginKeys.includes(this.config.plugins[i])) {
                        plugins.push(this.config.plugins[i]);
                    }
                }
                this.plugins.list = plugins;
            }
            this.runPlugins('init', this);
            this.emitter.emit('init', this);
        }
        /**
         * Registers plugin for XaroForm
         * @param name string Plugin's name
         * @param plugin XaroFormPlugin Plugin's object
         */
        XaroForm.addPlugin = function (name, plugin) {
            XaroForm.plugins[name] = plugin;
        };
        /**
         * Removes plugin by name
         * @param name string Plugin's name
         */
        XaroForm.removePlugin = function (name) {
            delete XaroForm.plugins[name];
        };
        /**
         * Initialize all forms from config
         * @param config I_XaroFormInitializeConfig
         */
        XaroForm.initialize = function (config) {
            var e_3, _a;
            XaroForm.config = config.common;
            if (window.XaroFormPlugins) {
                for (var key in window.XaroFormPlugins) {
                    XaroForm.addPlugin(key, window.XaroFormPlugins[key]);
                }
            }
            for (var key in config.forms) {
                XaroForm.instances[key] = [];
                var forms = _(config.forms[key]['form_selector'] + "[data-form-key=\"" + key + "\"]");
                try {
                    for (var forms_1 = (e_3 = void 0, __values(forms)), forms_1_1 = forms_1.next(); !forms_1_1.done; forms_1_1 = forms_1.next()) {
                        var el = forms_1_1.value;
                        XaroForm.instances[key].push(new XaroForm(Object.assign({}, config.forms[key], {
                            el: el,
                            on: window.XaroFormEvents || {}
                        })));
                        XaroForm.numbers++;
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (forms_1_1 && !forms_1_1.done && (_a = forms_1.return)) _a.call(forms_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            // console.log(config, XaroForm.instances);
        };
        XaroForm.prototype.runPlugins = function (method) {
            var e_4, _a, _b;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            try {
                for (var _c = __values(this.plugins.list), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var key = _d.value;
                    if (method in XaroForm.plugins[key]) {
                        (_b = XaroForm.plugins[key])[method].apply(_b, __spreadArray([this], __read(args)));
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_4) throw e_4.error; }
            }
        };
        XaroForm.prototype.validate = function () {
            var e_5, _a;
            var rules = this.parseRules();
            // codes
            var codes = {};
            for (var field in rules) {
                try {
                    for (var _b = (e_5 = void 0, __values(rules[field])), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var rule = _c.value;
                        var result = Validator[rule.method](this.fields[field], rule.value);
                        if (!result) {
                            if (!codes[field]) {
                                codes[field] = {};
                            }
                            codes[field][rule.method] = rule.value;
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
            }
            // get text error
            var errors = {};
            for (var field in codes) {
                for (var code in codes[field]) {
                    var _code = camelToSnake(code);
                    var msg = this.config.lexicon && this.config.lexicon[_code]
                        ? this.config.lexicon.errors[_code]
                        : XaroForm.config.lexicon.errors[_code];
                    if (typeof errors[field] === 'undefined') {
                        errors[field] = {};
                    }
                    errors[field][_code] = msg.replace('$', codes[field][code] || '');
                }
            }
            return {
                success: !keys(errors).length,
                errors: errors,
            };
        };
        XaroForm.prototype.parseRules = function () {
            var e_6, _a, e_7, _b;
            var validateProperty = this.config.client_validate.split(',');
            var fields = {};
            try {
                for (var validateProperty_1 = __values(validateProperty), validateProperty_1_1 = validateProperty_1.next(); !validateProperty_1_1.done; validateProperty_1_1 = validateProperty_1.next()) {
                    var item = validateProperty_1_1.value;
                    var _item = item.split(':');
                    if (item.length) {
                        fields[_item.shift()] = _item;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (validateProperty_1_1 && !validateProperty_1_1.done && (_a = validateProperty_1.return)) _a.call(validateProperty_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
            var fieldValidators = {};
            for (var key in fields) {
                try {
                    for (var _c = (e_7 = void 0, __values(fields[key])), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var v = _d.value;
                        var _v = v.split('=');
                        // if (tmpValidatorMethods.indexOf(_v[0]) === -1) {
                        //   continue;
                        // }
                        if (typeof Validator[_v[0]] !== 'function') {
                            continue;
                        }
                        if (!Array.isArray(fieldValidators[key])) {
                            fieldValidators[key] = [];
                        }
                        fieldValidators[key].push({
                            method: _v.shift(),
                            value: _v.length ? _v[0].replace(/\^+|\^+/g, '') : undefined
                        });
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
            return fieldValidators;
        };
        XaroForm.prototype.submit = function () {
            var _this = this;
            this.lockBtns();
            this.runPlugins('beforeSubmit', this);
            this.emitter.emit('beforeSubmit', this);
            var validator = this.validate();
            // clear fields errors
            for (var field_key in this.fields) {
                this.fields[field_key].clearErrors();
            }
            // clear other errors
            this.clearErrors();
            if (!validator.success) {
                for (var field_key in validator.errors) {
                    for (var error_code in validator.errors[field_key]) {
                        this.fields[field_key].addError(error_code, validator.errors[field_key][error_code]);
                    }
                }
                this.unlockBtns();
                // this, success, errors, side (client/server)
                this.runPlugins('afterSubmit', this, validator.success, validator.errors, 'client');
                this.emitter.emit('afterSubmit', this, validator.success, validator.errors, 'client');
                return;
            }
            fetch(this.config['action_url'], {
                method: 'POST',
                // headers: {
                //   'Content-Type': this.config.el.getAttribute('enctype')
                // },
                body: new FormData(this.config.el)
            })
                .then(function (response) {
                // console.log(response.text());
                return response.json();
            })
                .then(function (data) {
                var e_8, _a, e_9, _b;
                if (!data.success) {
                    // arrays of keys
                    var fields = keys(_this.fields);
                    var dataFields = keys(data.errors);
                    try {
                        // other errors
                        for (var _c = __values(difference(fields, dataFields)), _d = _c.next(); !_d.done; _d = _c.next()) {
                            var key = _d.value;
                            for (var code in data.errors[key]) {
                                _this.addError(key, code, data.errors[key][code]);
                            }
                        }
                    }
                    catch (e_8_1) { e_8 = { error: e_8_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_8) throw e_8.error; }
                    }
                    try {
                        // fields errors
                        for (var _e = __values(intersection(dataFields, fields)), _f = _e.next(); !_f.done; _f = _e.next()) {
                            var key = _f.value;
                            for (var code in data.errors[key]) {
                                _this.fields[key].addError(code, data.errors[key][code]);
                            }
                        }
                    }
                    catch (e_9_1) { e_9 = { error: e_9_1 }; }
                    finally {
                        try {
                            if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                        }
                        finally { if (e_9) throw e_9.error; }
                    }
                }
                _this.runPlugins('afterSubmit', _this, data.success, data.errors, 'server');
                _this.emitter.emit('afterSubmit', _this, data.success, data.errors, 'server');
            });
        };
        XaroForm.prototype.addError = function (key, code, msg, el) {
            if (keys(this.errors).includes(key) && keys(this.errors[key]).includes(code)) {
                return;
            }
            this.errors[key] = this.errors[key] || {};
            if (this.errorsEl) {
                if (!el) {
                    var $el_1 = _().create({ content: msg }).addClass('x-form__error').attr({
                        'data-field-key': key,
                        'data-error-code': code,
                    });
                    this.errorsEl.append($el_1[0]);
                    nextTick(function () { return $el_1.addClass('x-form__error--show'); });
                    el = $el_1[0];
                }
            }
            this.errors[key][code] = {
                msg: msg,
                el: el
            };
        };
        XaroForm.prototype.removeError = function (key, code) {
            var _a;
            if (!keys(this.errors).includes(key) &&
                !keys(this.errors[key]).includes(code)) {
                return;
            }
            (_a = this.errors[key][code].el) === null || _a === void 0 ? void 0 : _a.remove();
            delete this.errors[key][code];
        };
        XaroForm.prototype.clearErrors = function () {
            // fields errors
            for (var key in this.fields) {
                this.fields[key].clearErrors();
            }
            // other errors
            for (var key in this.errors) {
                for (var code in this.errors[key]) {
                    this.removeError(key, code);
                }
            }
        };
        XaroForm.prototype.changeDisabledAttr = function (value) {
            var e_10, _a;
            for (var key in this.btns) {
                try {
                    for (var _b = (e_10 = void 0, __values(this.btns[key])), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var btn = _c.value;
                        btn.disabled = value;
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
            }
        };
        XaroForm.prototype.lockBtns = function () {
            this.changeDisabledAttr(true);
        };
        XaroForm.prototype.unlockBtns = function () {
            this.changeDisabledAttr(false);
        };
        XaroForm.EventEmitter = EventEmitter;
        XaroForm.MicroDOM = MicroDOM;
        // object with all registered plugins
        XaroForm.plugins = {};
        // all forms instances
        XaroForm.instances = {};
        // forms amount
        XaroForm.numbers = 0;
        // custom validators
        XaroForm.customValidators = {};
        return XaroForm;
    }());

    return XaroForm;

}());
//# sourceMappingURL=xaroform.0.0.1-pl.js.map
