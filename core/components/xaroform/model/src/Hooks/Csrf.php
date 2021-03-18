<?php

namespace Xaro\Form\Hooks;

use Xaro\Form\Hooks;

class Csrf {
  /** @var \Xaro\Form\Hooks $hook */
  public $hook;

  /** @var array $config */
  public $config;

  function __construct(Hooks & $hook, $config) {
    $this->hook =& $hook;
    $this->config = $config;
  }

  public function process() {
    $isValid = $this->hook->request->checkCsrfToken('post');

    if (! $isValid) {
      $this->hook->addError($this->config['name'], 'CSRF token is invalid');
    }

    return $isValid;
  }
}