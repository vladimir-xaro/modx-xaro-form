<?php

namespace Xaro\Form\Hooks;

use Xaro\Form\Hooks;

class Email {
  /** @var \Xaro\Form\Hooks $hook */
  public $hook;

  /** @var \Xaro\Form\Form $form */
  public $form;

  /** @var \modX $modx */
  public $modx;

  /** @var array $config */
  public $config;

  function __construct(Hooks & $hook, array $config = []) {
    $this->hook =& $hook;
    $this->form = $hook->form;
    $this->modx = $hook->modx;
  }
}