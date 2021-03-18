import { I_Field, I_FieldConstructorConfig, I_XaroForm, I_Error, InputElement } from "../types";
import $, { MicroDOM } from "@xaro/micro-dom";

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



export default class Field implements I_Field {
  form:         I_XaroForm;
  el:           HTMLElement;
  inputs:       MicroDOM<InputElement>;
  subInputs?:   MicroDOM<HTMLOptionElement>;
  errors:       { [code: string]: HTMLElement } = {};
  type:         string;
  name:         string;
  isMultiple:   boolean;
  isFile:       boolean;

  constructor(config: I_FieldConstructorConfig) {
    this.form       = config.form;
    this.el         = config.el;
    this.inputs     = config.inputs;
    this.name       = config.name;
    this.type       = config.type;
    this.isMultiple = this.name.includes('[]');
    this.isFile     = this.type === 'file';
  }

  get value(): FormDataEntryValue | FormDataEntryValue[] | null {
    const data = new FormData(this.form.config.el);

    return this.isMultiple ? data.getAll(this.name) : data.get(this.name);
  }

  public addError(code: string, msg: string) : void {
    if (! Object.keys(this.errors).includes(code)) {
      this.errors[code] = $().create<HTMLElement>({ content: msg }).addClass('x-form__field-error')[0];
      this.el.append(this.errors[code]);
    }
  }

  public removeError(code: string) : void {
    if (Object.keys(this.errors).includes(code)) {
      this.errors[code].remove();
      delete this.errors[code];
    }
  }

  public clearErrors() : void {
    for (const error_code in this.errors) {
      this.removeError(error_code);
    }
  }
}