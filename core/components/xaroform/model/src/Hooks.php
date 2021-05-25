<?php

namespace Xaro\Form;

class Hooks {
  public const TYPE_CLASS     = 0;
  public const TYPE_SNIPPET   = 1;
  // public const TYPE_FUNCTION  = 2;

  public const TYPES = [
    'pre',
    'pre_validate',
    'post',
  ];

  public static $hooks_aliases = [
    'RecaptchaV3Render' => [ 'recaptcha3render', 'recaptchav3render' ],
    'RecaptchaV3'       => [ 'recaptcha3', 'recaptchav3' ],
    'Telegram'          => [ 'telegram', 'tg' ],
    'Email'             => [ 'e-mail', 'email', 'mail' ],
    'Csrf'              => [ 'csrf' ]
  ];

  /** @var \modX $modx */
  public $modx;

  /** @var Form $form */
  public $form;

  /** @var \modHelpers\Request $request */
  public $request;

  /** @var array $hooks */
  public $hooks = [];

  /** @var array $errors */
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
      'type' => '',
      'hooks' => [],
    ], $config);

    $this->hooks = $this->config['hooks'];
  }

  public static function getConfig(Form & $form, bool $force = false) {
    $loaded = $form->load(
      $form->config['form_key'],
      Form::STORAGE_KEY . '/hooks'
    );

    if (!$force && $loaded) {
      return $loaded;
    }

    $result = [];

    foreach (static::TYPES as $type) {
      $hooks = $form->config[$type . '_hooks'];
      $hooks = $hooks === '' ? [] : explode(',', $hooks);
      
      $uniq_type_hooks = [];
      foreach ($hooks as $hook) {
        if (empty($hook)) {
          continue;
        }

        // iterate aliases
        foreach (static::$hooks_aliases as $real_name => $aliases) {
          if (in_array(strtolower($hook), $aliases)) {
            $class_name = $real_name;
            break;
          }
        }

        $snippet_name = $form->config['snippet_hooks_prefix'] . $hook;
        if ($form->modx->getObject('modSnippet', [ 'name' => $snippet_name ])) {
          // checks hook repeat
          if (in_array($snippet_name, $uniq_type_hooks)) {
            continue;
          }
          $uniq_type_hooks[] = $snippet_name;

          // hook config
          $hook_config = [
            'type' => static::TYPE_SNIPPET,
            'name' => $snippet_name,
          ];
        } else if ($class_name) {
          $class_name = $form->config['hooks_namespace'] . '\\' . $class_name;

          // checks hook repeat
          if (in_array($class_name, $uniq_type_hooks)) {
            continue;
          }
          $uniq_type_hooks[] = $class_name;

          if (! class_exists($class_name)) {
            continue;
          }

          $hook_config = [
            'type'    => static::TYPE_CLASS,
            'name'    => $class_name,
          ];
        } else {
          continue;
        }

        $result[$type][] = $hook_config;
        unset($hook_config);
      }
    }

    $form->save(
      $form->config['form_key'],
      $result,
      Form::STORAGE_KEY . '/hooks'
    );

    // echo '<pre>';
    // print_r($result);
    // echo '</pre>';

    return $result;
  }

  public function runMultiple() {
    $continueOnError = $this->form->config["continue_on_{$this->config['type']}HookError"];
    foreach ($this->hooks as $hook) {
      if (!$this->run($hook) && !$continueOnError) {
        return false;
      }
    }
    return true;
  }
  public function run(array $hook) {
    if ($hook['type'] === self::TYPE_CLASS) {
      $class = new $hook['name']($this, [ 'name' => $hook['name'] ]);
      return $class->process();
    } else if ($hook['type'] === self::TYPE_SNIPPET) {
      $snippet = $this->modx->getObject('modSnippet', [ 'name' => $hook['name'] ]);
      return $snippet->process([ 'hook' => $this ]);
    }
  }

  // public function loadMultiple(string $hooks = '') : bool {
  //   $hooks = $hooks === '' ? [] : explode(',', $hooks);
    
  //   if (empty($hooks)) {
  //     return true;
  //   }
    
  //   $continueOnError = $this->form->config["continue_on_{$this->config['type']}_hook_error"];
  //   echo '<pre>';
  //   foreach ($hooks as $hook) {
  //     if (empty($hook)) {
  //       continue;
  //     }
  //     if (!$this->load($hook) && !$continueOnError) {
  //       return false;
  //     }
  //   }
  //   echo '</pre>';

  //   return true;
  // }

  // public function load(string $hook = '') : bool {
  //   var_dump($hook);
  //   $this->hooks[] = $hook;

  //   $className = '\Xaro\Form\Hooks\\' . ucfirst($hook);
  //   if (class_exists($className)) {
  //     $class = new $className($this, [ 'name' => $hook ]);
  //     return $class->process();
  //   } elseif ($snippet = $this->modx->getObject('modSnippet', array('name' => $this->form->config['snippet_hooks_prefix'] . $hook))) {
  //     return $snippet->process([ 'hook' => $this ]);
  //   }

  //   return false;
  // }

  public function addError(string $key, string $code, string $msg) : void {
    $this->errors[$key][$code] = $msg;
  }

  public function addManagerError(string $msg) : void {
    $this->modx->log(1, $msg);
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

  public static function addAlias(string $key, $value) {
    self::$hooks_aliases[$key][] = $value;
  }
}