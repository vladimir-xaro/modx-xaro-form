<?php

namespace Xaro\Form\Hooks;

use Xaro\Form\Hooks;

class Csrf {
  /** @var \Xaro\Form\Hooks $hook */
  public $hook;

  /** @var array $config */
  public $config;

  function __construct(Hooks & $hook, array $config = []) {
    $this->hook =& $hook;
    $this->config = array_merge([
      'field_key' => 'csrf',
    ], $config);
  }

  public function process() {
    $isValid = $this->hook->request->checkCsrfToken('post');

    if (! $isValid) {
      $this->hook->addError($this->config['field_key'], 'invalid', 'CSRF token is invalid');
    }

    return $isValid;
  }
}