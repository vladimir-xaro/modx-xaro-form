<?php

namespace Xaro\Form\Hooks;

use Xaro\Form\Hooks;
use \DiDom\Element;
use Xaro\Form\Form;

class RecaptchaV3Render {
  /** @var int $last_response_id */
  protected static $last_response_id = -1;

  protected static $calls = [];

  /** @var \Xaro\Form\Hooks $hook */
  public $hook;

  /** @var \Xaro\Form\Form $form */
  public $form;

  /** @var \modX $modx */
  public $modx;

  /** @var array $config */
  public $config;

  function __construct(Hooks &$hook, array $config = []) {
    $this->hook = &$hook;
    $this->form = $hook->form;
    $this->modx = $hook->modx;

    $this->config = array_merge([
      'is_on'       => $this->form->config['recaptcha_v3_is_on']        ?: $this->form->getOption('recaptcha_v3_is_on'),
      'secret'      => $this->form->config['recaptcha_v3_secret_key']   ?: $this->form->getOption('recaptcha_v3_secret_key'),
      'site'        => $this->form->config['recaptcha_v3_site_key']     ?: $this->form->getOption('recaptcha_v3_site_key'),
      'min_score'   => $this->form->config['recaptcha_v3_min_score']    ?: $this->form->getOption('recaptcha_v3_min_score'),
      'action'      => $this->form->config['recaptcha_v3_action']       ?: 'default',
      'response_id' => $this->form->config['recaptcha_v3_response_id']  ?: 'g-recaptcha-' . substr(md5(self::$last_response_id++), 0, 7),
    ], $config);
  }

  public function process() : bool {
    if (! $this->config['is_on']) {
      return true;
    }

    // Adds initialize grecaptcha.execute for all forms with recaptcha in XaroFormConfig.forms
    if (! Form::$is_init) {
      Form::setInitializeConfig([
        'recaptcha_on'    => true,
        'recaptcha_site'  => $this->config['site']
      ]);
      // $this->modx->regClientStartupScript("<script src=\"https://www.google.com/recaptcha/api.js?render={$this->config['site']}\"></script>");
      // $this->modx->regClientScript(<<<EOD
      //   <script type="text/javascript">
      //     grecaptcha.ready(() => {
      //       for (const form_key in window.XaroFormConfig.forms) {
      //         // console.log(Object.keys(window.XaroForm.instances).length);
      //         grecaptcha.execute('{$this->config['site']}', { action: window.XaroFormConfig.forms[form_key].recaptcha_action })
      //         .then(token => {
      //           document.getElementById(window.XaroFormConfig.forms[form_key].recaptcha_id).value = token;
      //         });
      //       }
      //     });
      //   </script>
      // EOD);
    }

    // $id = self::$last_response_id;
    // $this->modx->regClientStartupScript(<<<EOD
    //   <script>console.log('RecaptchaV3Render', $id, '{$this->config['response_id']}')</script>
    // EOD, true);

    $this->form->addJSConfig([
      'recaptcha_id'      => $this->config['response_id'],
      'recaptcha_action'  => $this->config['action'],
    ]);

    /*
    $input = "<input type=\"hidden\" name=\"g-recaptcha-response\" id=\"{$this->config['response_id']}\">";

    if ((stripos($this->form->content, '</form>') !== false)) {
      if (preg_match('/<input.*?name=(?:"|\')g-recaptcha-response(?:"|\').*?>/i', $this->form->content, $matches)) {
        $this->form->content = str_ireplace($matches[0], '', $this->form->content);
      }
      $this->form->content = str_ireplace('</form>', "\n\t$input\n</form>", $this->form->content);
    }
    */

    return true;
  }
}
