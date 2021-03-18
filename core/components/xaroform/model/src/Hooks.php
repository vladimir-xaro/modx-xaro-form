<?php

namespace Xaro\Form;

class Hooks {
  /** @var \modX $modx */
  public $modx;

  /** @var Form $form */
  public $form;

  /** @var \modHelpers\Request $request */
  public $request;

  /** @var string[] $hooks */
  public $hooks = [];

  /** @var string[] $errors */
  public $errors = [];

  /** @var array $config */
  public $config;

  /** @var array $fields */
  public $fields = [];

  function __construct(Form & $form, array $config = []) {
    $this->form =& $form;
    $this->modx = $form->modx;
    $this->request = $form->request;

    $this->config = array_merge([
      'type' => 'post'
    ], $config);
  }

  public function loadMultiple(string $hooks = '') : bool {
    $hooks = $hooks === '' ? [] : explode(',', $hooks);
    
    if (empty($hooks)) {
      return true;
    }
    
    $ucType = ucfirst($this->config['type']);
    $continueOnError = $this->form->config["continueOn{$ucType}HookError"];
    
    foreach ($hooks as $hook) {
      if (empty($hook)) {
        continue;
      }
      if (!$this->load($hook) && !$continueOnError) {
        return false;
      }
    }

    return true;
  }

  public function load(string $hook = '') : bool {
    $this->hooks[] = $hook;

    $className = '\Xaro\Form\Hooks\\' . ucfirst($hook);
    if (class_exists($className)) {
      $class = new $className($this, [ 'name' => $hook ]);
      return $class->process();
    } elseif ($snippet = $this->modx->getObject('modSnippet', array('name' => $this->form->config['snippet_hooks_prefix'] . $hook))) {
      return $snippet->process([ 'hook' => $this ]);
    }

    return false;
  }

  public function addError(string $key, string $msg) : void{
    $this->errors[$key][] = $msg;
  }

  public function hasErrors() {
    return !empty($this->errors);
  }

  public function getErrors() {
    return $this->errors;
  }

  public function setValue(string $key, $value) {
    $this->fields[$key] = $value;
  }

  public function setValues(array $values) {
    foreach ($values as $key => $value) {
      $this->setValue($key, $value);
    }
  }
}