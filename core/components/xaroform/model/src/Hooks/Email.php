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

    $this->config = array_merge([
      'to'        => $this->form->config['email_to'],
      'from'      => $this->form->config['email_from'],
      'subject'   => $this->form->config['email_subject'],
      'content'   => $this->form->config['email_content'],
      'tpl'       => $this->form->config['email_tpl'] ?: 'XaroForm.email.example.tpl',      // ignore if content is set
      'is_notify' => $this->form->config['email_is_notify'],
    ], $config);
  }

  public function process() {
    $config = [];

    if (! empty($this->config['content'])) {
      $config['content'] = $this->config['content'];
    } else if (! empty($this->config['tpl'])) {
      if (! $this->form->parser) {
        $this->form->loadParser();
      }
      $config['content'] = $this->form->parser->getChunk($this->config['tpl'], $this->hook->request->all());
    } else {
      $this->modx->log(1, __METHOD__ . ' error email sending. tpl or content property not set', 'HTML');
      return false;
    }

    $config['to'] = explode(',', $this->config['to']);
    $config['from'] = $this->config['from'] ?: $config['to'];
    $config['subject'] = $this->config['subject'];

    // dd($config);

    if (! email(explode(',', $this->config['to']), $config)) {
      $this->modx->log(1, 'Email was not sent');
      return false;
    }

    return true;
  }
}