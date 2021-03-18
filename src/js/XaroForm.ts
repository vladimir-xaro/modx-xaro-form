import EventEmitter from '@xaro/event-emitter';
import $, { MicroDOM } from '@xaro/micro-dom';
import { I_XaroForm, I_XaroFormInitializeConfig, I_XaroFormConstructorConfig, I_XaroFormConfig, I_Field, InputElement  } from 'src/types';
import Validator from './Validator';
import Field from './Field';
import { camelToSnake, snakeToCamel } from './helpers';

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

export default class XaroForm implements I_XaroForm {
  // all forms instances
  public static instances: { [key: string]: XaroForm[] } = {};
  
  // common forms config
  public static config: {
    lexicon: { [key: string]: string };
    [key: string]: any;
  };

  // event emitter
  public emitter: EventEmitter;

  // current form config
  public config:  I_XaroFormConfig;

  // fields elements with inputs
  public fields: { [key: string]: I_Field } = {};

  public errors: {
    [key: string]: {
      [key: string]: HTMLElement
    }
  } = {};

  public static initialize(config: I_XaroFormInitializeConfig) {
    XaroForm.config = config.common;

    for (const key in config.forms) {
      XaroForm.instances[key] = [];
      const forms: MicroDOM<HTMLFormElement> = $(`${config.forms[key]['form_selector']}[data-form-action="${key}"]`);
      for (const el of forms) {
        XaroForm.instances[key].push(new XaroForm(Object.assign({}, config.forms[key], { el })));
      }
    }

    
    
    // console.log(config, XaroForm.instances);
  }

  constructor(config: I_XaroFormConstructorConfig) {
    this.emitter = new EventEmitter(config.on);
    this.config = config;

    for (const el of $(this.config.el).get<HTMLElement>('.x-form__field')) {
      const inputs: MicroDOM<InputElement> = $(el).get<InputElement>('.x-form__input');

      if (! inputs.length) {
        throw new Error("Field element has not contains input element/s");
      }

      const name: string = inputs[0].name;

      if (! name) {
        throw new Error("Name of input element does not exists");
      }

      this.fields[name] = new Field({
        form: this,
        el,
        inputs,
        name,
        type: inputs[0].type,
      });
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

    this.config.el.addEventListener('submit', e => {
      e.preventDefault();

      this.submit();

      return false;
    });
  }


  public validate() {
    const rules = this.parseRules();

    // codes
    let codes: { [key: string]: { [method: string]: (string | number | boolean | undefined) } } = {};
    for (const field in rules) {
      for (const rule of rules[field]) {
        const result = Validator[rule.method](this.fields[field], rule.value);
        if (! result) {
          if (! codes[field]) {
            codes[field] = {};
          }
          codes[field][rule.method] = rule.value;
        }
      }
    }

    // get text error
    let errors: { [key: string]: { [code: string]: string } } = {};
    for (const field in codes) {
      for (const code in codes[field]) {
        const _code = camelToSnake(code);
        const msg = this.config.lexicon && this.config.lexicon[_code]
          ? this.config.lexicon.errors[_code]
          : XaroForm.config.lexicon.errors[_code];

        if (typeof errors[field] === 'undefined') {
          errors[field] = {};
        }

        errors[field][_code] = msg.replace('$', codes[field][code] as string || '');
      }
    }

    return {
      success: !Object.keys(errors).length,
      errors,
    };
  }

  protected parseRules() {
    // name:required:minLength=^3^,email:required:email
    const validateProperty: string[] = this.config.client_validate.split(',');

    let fields: { [key: string]: string[] } = {};
    for (const item of validateProperty) {
      let _item: string[] = item.split(':');
      if (item.length) {
        fields[_item.shift()!] = _item;
      }
    }

    let fieldValidators: {
      [key: string]: {
        method: string,
        value?: string | number | boolean
      }[]
    } = {};
    for (const key in fields) {
      for (const v of fields[key]) {
        const _v: string[] = v.split('=');

        // if (tmpValidatorMethods.indexOf(_v[0]) === -1) {
        //   continue;
        // }

        if (typeof Validator[_v[0]] !== 'function') {
          continue;
        }

        if (! Array.isArray(fieldValidators[key])) {
          fieldValidators[key] = [];
        }

        fieldValidators[key].push({
          method: _v.shift()!,
          value:  _v.length ? _v[0].replace(/\^+|\^+/g, '') : undefined
        })
      }
    }

    return fieldValidators;
  }

  submit() {
    const validator = this.validate();
    console.log(validator);

    if (! validator.success) {
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
      for (const field_key in this.fields) {
        this.fields[field_key].clearErrors();
      }
      for (const field_key in validator.errors) {
        for (const error_code in validator.errors[field_key]) {
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
      .then(response => {
        // console.log(response.text());
        return response.json();
      })
      .then(data => console.log(data));
  }
}