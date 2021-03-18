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

    // const inputTypes: string[] = [
    //   // 'button',
    //   // 'checkbox',
    //   'color',
    //   'date',
    //   'datetime-local',
    //   'email',
    //   'file',
    //   'hidden',
    //   'image',
    //   'month',
    //   'number',
    //   'password',
    //   // 'radio',
    //   'range',
    //   // 'reset',
    //   'search',
    //   // 'submit',
    //   'tel',
    //   'text',
    //   'time',
    //   'url',
    //   'week',
    // ];
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
        Field.prototype.addError = function (code, msg) {
            if (!Object.keys(this.errors).includes(code)) {
                this.errors[code] = _().create({ content: msg }).addClass('x-form__field-error')[0];
                this.el.append(this.errors[code]);
            }
        };
        Field.prototype.removeError = function (code) {
            if (Object.keys(this.errors).includes(code)) {
                this.errors[code].remove();
                delete this.errors[code];
            }
        };
        Field.prototype.clearErrors = function () {
            for (var error_code in this.errors) {
                this.removeError(error_code);
            }
        };
        return Field;
    }());

    var camelToSnake = function (str) { return str.replace(/[A-Z]/g, function (char) { return '_' + char.toLowerCase(); }); };

    // const tmpValidatorMethods = [
    //   'required',
    //   'minLength',
    //   'maxLength',
    //   'password_confirm',
    //   'isNumber',
    //   'minValue',
    //   'maxValue',
    //   'email',
    // ];
    var XaroForm = /** @class */ (function () {
        function XaroForm(config) {
            var e_1, _a;
            var _this = this;
            // fields elements with inputs
            this.fields = {};
            this.errors = {};
            this.emitter = new EventEmitter(config.on);
            this.config = config;
            try {
                for (var _b = __values(_(this.config.el).get('.x-form__field')), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var el = _c.value;
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
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            // console.log(this);
            // initialize fields object property
            // for (const input of $(this.config.el).get<HTMLInputElement>('.x-form__input')) {
            //   const name: string | null = input.getAttribute('name');
            //   if (name === null) {
            //     continue;
            //   }
            //   let field: HTMLElement = input;
            //   while (field.tagName !== 'FORM' && !field.classList.contains('x-form__field')) {
            //     field = field.parentElement!;
            //   }
            //   if (field.tagName === 'FORM') {
            //     continue;
            //   }
            //   // set field el data-field-name attr by input name attr
            //   field.setAttribute('data-field-name', name);
            //   // create errors container el and append to field el
            //   const errors = document.createElement('div');
            //   errors.classList.add('x-form__field-errors');
            //   field.append(errors);
            //   this.fields[name] = {
            //     field,
            //     input,
            //     errors
            //   };
            // }
            this.config.el.addEventListener('submit', function (e) {
                e.preventDefault();
                _this.submit();
                return false;
            });
        }
        XaroForm.initialize = function (config) {
            var e_2, _a;
            XaroForm.config = config.common;
            for (var key in config.forms) {
                XaroForm.instances[key] = [];
                var forms = _(config.forms[key]['form_selector'] + "[data-form-action=\"" + key + "\"]");
                try {
                    for (var forms_1 = (e_2 = void 0, __values(forms)), forms_1_1 = forms_1.next(); !forms_1_1.done; forms_1_1 = forms_1.next()) {
                        var el = forms_1_1.value;
                        XaroForm.instances[key].push(new XaroForm(Object.assign({}, config.forms[key], { el: el })));
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (forms_1_1 && !forms_1_1.done && (_a = forms_1.return)) _a.call(forms_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            // console.log(config, XaroForm.instances);
        };
        XaroForm.prototype.validate = function () {
            var e_3, _a;
            var rules = this.parseRules();
            // codes
            var codes = {};
            for (var field in rules) {
                try {
                    for (var _b = (e_3 = void 0, __values(rules[field])), _c = _b.next(); !_c.done; _c = _b.next()) {
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
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_3) throw e_3.error; }
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
                success: !Object.keys(errors).length,
                errors: errors,
            };
        };
        XaroForm.prototype.parseRules = function () {
            var e_4, _a, e_5, _b;
            // name:required:minLength=^3^,email:required:email
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
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (validateProperty_1_1 && !validateProperty_1_1.done && (_a = validateProperty_1.return)) _a.call(validateProperty_1);
                }
                finally { if (e_4) throw e_4.error; }
            }
            var fieldValidators = {};
            for (var key in fields) {
                try {
                    for (var _c = (e_5 = void 0, __values(fields[key])), _d = _c.next(); !_d.done; _d = _c.next()) {
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
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
            }
            return fieldValidators;
        };
        XaroForm.prototype.submit = function () {
            var validator = this.validate();
            console.log(validator);
            if (!validator.success) {
                // without clearing errors
                // for (const field_key in validator.errors) {
                //   for (const error_code in validator.errors[field_key]) {
                //     console.log(field_key, error_code);
                //     this.fields[field_key].addError(error_code, validator.errors[field_key][error_code]);
                //   }
                // }
                // for (const field_key in this.fields) {
                //   const field = this.fields[field_key];
                //   const fieldValidator = validator.errors[field_key];
                //   if (! fieldValidator) {
                //     field.clearErrors();
                //     continue;
                //   }
                //   for (const error_code in field.errors) {
                //     if (! Object.keys(fieldValidator).includes(error_code)) {
                //       field.removeError(error_code);
                //     }
                //   }
                // }
                // with crear fields errors
                for (var field_key in this.fields) {
                    this.fields[field_key].clearErrors();
                }
                for (var field_key in validator.errors) {
                    for (var error_code in validator.errors[field_key]) {
                        this.fields[field_key].addError(error_code, validator.errors[field_key][error_code]);
                    }
                }
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
                .then(function (data) { return console.log(data); });
        };
        // all forms instances
        XaroForm.instances = {};
        return XaroForm;
    }());

    window.Validator = Validator;

    return XaroForm;

}());
//# sourceMappingURL=xaroform.0.0.1-pl.js.map
