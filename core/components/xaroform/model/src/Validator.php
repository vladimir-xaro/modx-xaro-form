<?php

namespace Xaro\Form;

class Validator {
  /** @var \modX $modx */
  public $modx;

  /** @var Form $form */
  public $form;

  /** @var \modHelpers\Request $request */
  public $request;

  /** @var array $errors */
  public $errors = [];

  /**
   * Status of runs validate method
   * @var bool $validated
   */
  public $validated = false;

  function __construct(Form & $form) {
    $this->form =& $form;
    $this->modx = $form->modx;
    $this->request = $form->request;
  }

  /**
   * Returns validation rules for fields
   * @return array
   */
  public function parseRules() : array {
    $validateProperty = $this->form->config['validate'];

    $validateProperty = explode(',', $validateProperty);

    $fields = [];
    foreach ($validateProperty as $item) {
      $item = explode(':', $item);

      $fields[array_shift($item)] = $item;
    }

    $fieldValidators = [];

    foreach ($fields as $key => $item) {
      foreach ($item as $v) {
        $v = explode('=', $v);

        if (! method_exists($this, $v[0])) {
          continue;
        }

        $fieldValidators[$key][array_shift($v)] = trim($v[0], '^');
      }
    }

    // dd($fieldValidators);

    return $fieldValidators;
  }

  /**
   * Validates fields (and sets the validation status to true)
   * @return array
   */
  public function validate() : bool {
    $rules = $this->parseRules();

    foreach ($rules as $field => $fieldRules) {
      foreach ($fieldRules as $method => $value) {
        $this->$method($field, $value);
      }
    }

    $this->validated = true;

    return empty($this->errors);
  }

  /**
   * Checks for an errors (runs a validation method if the validation status is false)
   * @return bool
   */
  public function hasErrors() : bool {
    if (! $this->validated) {
      $this->validate();
    }

    return !empty($this->errors);
  }
  
  /**
   * Returns array of errors
   * @return array
   */
  public function getErrors() : array {
    return $this->errors;
  }

  /**
   * Adds error to field by key
   * @param string $key
   * @param string $msg
   * @return void
   */
  public function addError(string $key, string $code, array $placeholders = []) : void {
    $msg = $this->modx->lexicon('xaroform_error_input_' . $code);

    if (! empty($placeholders)) {
      $msg = str_replace($placeholders[0], $placeholders[1], $msg);
    }

    $this->errors[$key][] = $msg;
  }

  public function getErrorMsg(string $field, string $rule, string $value) : string {
    return "[$field] error => $rule - $value";
  }

  /**
   * Clears errors and check status
   * @return void
   */
  public function reset() : void {
    $this->errors = [];
    $this->validated = false;
  }


  // below - validators

  public function required(string $field) : bool {
    if (empty($this->request->input($field))) {
      $this->addError($field, 'required');
      return false;
    }

    return true;
  }

  public function minLength(string $field, string $value) : bool {
    if (mb_strlen($this->request->input($field)) < $value) {
      $this->addError($field, 'min_length', [ '$', $value ]);
      return false;
    }

    return true;
  }

  public function maxLength(string $field, string $value) : bool {
    if (mb_strlen($this->request->input($field)) > $value) {
      $this->addError($field, 'max_length', [ '$', $value ]);
      return false;
    }

    return true;
  }

  public function passwordConfirm(string $field, string $confirm_field) : bool {
    $confirm_input = $this->request->input($confirm_field);

    if ($this->request->input($field) !== $confirm_input) {
      $this->addError($field, 'password_confirm');
      return false;
    }

    return true;
  }

  // Numeric block START
  public function isNumber(string $field) : bool {
    $input = str_replace(',', '.', $this->request->input($field));

    if (!is_numeric($input)) {
      $this->addError($field, 'is_number');
      return false;
    }

    return true;
  }

  public function minValue(string $field, string $value) : bool {
    $input = floatval(str_replace(',', '.', $this->request->input($field)));
    $value = floatval($value);

    if ($input < $value) {
      $this->addError($field, 'min_value');
      return false;
    }

    return false;
  }

  public function maxValue(string $field, string $value) : bool {
    $input = floatval(str_replace(',', '.', $this->request->input($field)));
    $value = floatval($value);

    if ($input > $value) {
      $this->addError($field, 'max_value');
      return false;
    }

    return true;
  }

  // public function inRange(string $field, string $values) : bool {
  //   $success = false;
  //   $input = floatval(str_replace(',', '.', $this->request->input($field)));
  //   $values = sort(array_map(function($_v) {
  //     return floatval($_v);
  //   }, explode('|', $values)));

  //   if (count($values) !== 2) {
  //     return $this->getErrorMsg();
  //   }

  //   if ($input > $values[0] && $input <= $values[1]) {
  //     $success = true;
  //   }

  //   return $success;
  // }
  // Numeric block END

  public function email(string $field) : bool {
    if (!preg_match('/^[a-zA-Zа-яА-Яё\d][a-zA-Zа-яА-ЯёЁ\d\.\-_]*[a-zA-Zа-яА-ЯёЁ\d]\@[a-zA-Zа-яА-ЯёЁ\d]([a-zA-Zа-яА-ЯёЁ\d\-]|\.)+[a-zA-Zа-яА-ЯёЁ\d]{2,}$/', $this->request->input($field))) {
      $this->addError($field, 'email');
      return false;
    }

    return true;
  }
}