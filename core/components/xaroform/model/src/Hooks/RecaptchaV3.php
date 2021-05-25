<?php

namespace Xaro\Form\Hooks;

use Xaro\Form\Hooks;

class RecaptchaV3 {
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
      'field_key' => 'recaptcha_v3',
      'is_on'     => $this->form->config['recaptcha_v3_is_on']      ?: $this->form->getOption('recaptcha_v3_is_on'),
      'secret'    => $this->form->config['recaptcha_v3_secret_key'] ?: $this->form->getOption('recaptcha_v3_secret_key'),
      'site'      => $this->form->config['recaptcha_v3_site_key']   ?: $this->form->getOption('recaptcha_v3_site_key'),
      'min_score' => $this->form->config['recaptcha_v3_min_score']  ?: $this->form->getOption('recaptcha_v3_min_score'),
      'action'    => $this->form->config['recaptcha_v3_action']     ?: 'default',
    ], $config);
  }

  public function process() {
    if (! $this->config['is_on']) {
      return true;
    }

    if (! $this->config['secret']) {
      $this->modx->log(1, $this->modx->lexicon('xaroform_error_hook_recaptcha_v3_secret_key_missing'));
      return false;
    }

    if (! $this->config['site']) {
      $this->modx->log(1, $this->modx->lexicon('xaroform_error_hook_recaptcha_v3_site_key_missing'));
      return false;
    }

    $token  = $this->hook->request->input('g-recaptcha-response');
    $action = $this->hook->request->input('g-recaptcha-action');

    if (! $token) {
      $this->hook->addError($this->config['field_key'], 'token_missing', $this->modx->lexicon('xaroform_error_hook_recaptcha_v3_token_missing'));
      return false;
    }

    $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ([
      'secret'    => $this->config['secret'],
      'response'  => $token,
      'remoteip'  => $_SERVER['REMOTE_ADDR'],
      'action'    => $action
    ]));
    $response = curl_exec($ch);
    curl_close($ch);

    $response = json_decode($response, true);

    if (! $response['success']) {
      $this->hook->addError($this->config['field_key'], 'score', $this->modx->lexicon('xaroform_error_hook_recaptcha_v3_min_score'));
      return false;
    }

    return true;
  }
}