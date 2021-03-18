<?php

namespace Xaro\Form;

use DiDom\Document;
use DiDom\Element;
use xPDO;

class Form {
  const VERSION = '0.0.1';
  const BUILD = 'pl';

  const STORAGE_KEY = 'xaro/form';
  const STORAGE_PREFIX = 'form_';

  // TODO: remove tg constants later
  const TELEGRAM_BOT_TOKEN = '1583446965:AAEtFrraXYpBSc4kiHh-nSn_wk9cRPtfSx4';
  const TELEGRAM_BOT_CHATS = '251358949';

  /** @var array $forms */
  public static $forms;

  /** @var bool $isInit */
  public static $isInit;

  /** @var \modX $modx */
  public $modx;

  /** @var \pdoTools $parser */
  public $parser;

  /** @var array $config */
  public $config;

  /** @var array $user_config */
  public $user_config;

  /** @var Hooks $pre_hooks */
  public $pre_hooks;

  /** @var Hooks $pre_validate_hooks */
  public $pre_validate_hooks;

  /** @var Hooks $post_hooks */
  public $post_hooks;

  /** @var \modHelpers\Request $request */
  public $request;

  /** @var Validator $validator */
  public $validator;

  /** @var array $errors */
  public $errors = [];

  function __construct(\modX & $modx, array $config = []) {
    $this->modx =& $modx;
    $this->user_config = $config;

    $core_path = MODX_CORE_PATH . 'components/xaroform/';
    $assets_url = MODX_ASSETS_URL . 'components/xaroform/';
    $assets_filename = 'xaroform.' . self::VERSION . '-' . self::BUILD;

    $this->config = array_merge([
      'lexicons' => [ 'xaroform:default' ],
      // TODO: think about implementing the error lexicon of specific fields
      // 'field_lexicon' => [
      //   'name' => [
      //     'required' => 'Name is required',
      //     'min_length' => 'Name must be greater than 3 symbols', // or function
      //   ]
      // ],
      'storage' => $this->modx->getOption('xaroform_data_storage'),

      'form_storage_key' => $this->modx->getOption('xaroform_data_form_storage_key'),
      'chunk_storage_key' => 'xaro/chunk',

      'core_path' => $core_path,
      'model_path' => $core_path . 'model/',
      'processors_path' => $core_path . 'processors/',

      'action_url' => $assets_url . 'action.php?test=1',
      'assets_url' => $assets_url,

      'css_url' => $assets_url . 'css/' . $assets_filename . '.css',
      'js_url' => $assets_url . 'js/' . $assets_filename . '.js',

      'placeholder_prefix' => 'xf.',

      // Continue if any preHook return false;
      'continue_on_pre_hook_error'          => false,
      // Continue if any preHook return false;
      'continue_on_pre_validate_hook_error' => false,
      // Continue if any postHook return false;
      'continue_on_post_hook_error'         => true,
      'hooks_error_tpl'                     => 'XaroForm.hooks.error.tpl',
      'snippet_hooks_prefix' => '',

      'form_key'      => $this->generateFormKey($this->user_config),
      'action_key'    => 'xaro_action',
      'form_class'    => 'xaro-form',
      'form_selector' => 'form.xaro-form',

      /**
       * Steps:
       * show form
       * initialize -> pre_hooks -> render_chunk
       * after submit:
       * pre_validate_hooks -> validate -> post_hooks -> response
       * If any step returned an error, the next steps are skipped and a response with a success status is returned immediately - false
       */
      'pre_hooks'           => '',
      'pre_validate_hooks'  => '',
      'hooks'               => '',
      'storage'             => 'cache',
      'validate'            => '',
      'client_validate'     => '',
      'clientValidate'      => true,
      'form_tpl'            => 'XaroForm.example.tpl',

      // Hooks part
      'telegram_msg_tpl'    => 'XaroForm.telegram.msg.example.tpl',
      'telegram_parse_mode' => 'MarkdownV2',
      // 'telegram_bot_token'  => $this->modx->getOption('telegram_bot_token', null, ''),
      // 'telegram_bot_chats'  => explode(',', preg_replace('/\s/', '', $modx->getOption('telegram_bot_chats', null, ''))),
      'telegram_bot_token'  => self::TELEGRAM_BOT_TOKEN,
      'telegram_bot_chats'  => self::TELEGRAM_BOT_CHATS,
      'telegram_is_notify'  => $this->modx->getOption('telegram_is_notify', null, true),
    ], $config);

    $this->modx->addPackage('xaroform', $this->config['model_path']);

    // load lexicon
    if (is_array($this->config['lexicons'])) {
      foreach ($this->config['lexicons'] as $lexicon) {
        $this->modx->lexicon->load($lexicon);
      }
    } else {
      $this->modx->lexicon->load($this->config['lexicons']);
    }

  }

  /**
   * Initialize form and return chunk
   * @return string
   */
  public function initialize() : string {
    $this->save(
      $this->config['form_key'],
      $this->user_config,
      $this->config['form_storage_key'],
    );

    if (!self::$isInit) {
      $commonJsConfig = json_encode([
        'lexicon' => [
          'errors' => $this->modx->lexicon->fetch('xaroform_error_input_', true)
        ],
      ]);
      $this->modx->regClientCSS($this->config['css_url']);
      $this->modx->regClientScript($this->config['js_url']);
      $this->modx->regClientStartupHTMLBlock("<script type=\"text/javascript\">window.XaroFormConfig = { common: $commonJsConfig, forms: {} };</script>");
      self::$isInit = true;
    }

    $jsConfig = json_encode([
      'action_url'      => $this->config['action_url'],
      'form_selector'   => $this->config['form_selector'],
      'action_key'      => $this->config['action_key'],
      'form_key'        => $this->config['form_key'],
      'client_validate' => $this->config['client_validate'],
    ]);

    $this->modx->regClientStartupHTMLBlock("<script type=\"text/javascript\">window.XaroFormConfig.forms['{$this->config['form_key']}'] = {$jsConfig};</script>");
    $this->modx->regClientHTMLBlock("<script type=\"text/javascript\">XaroForm.initialize(window.XaroFormConfig);</script>");

    // Load and run preHooks
    if (!$this->runHooks('pre') && !$this->config['continue_on_pre_hook_error']) {
      if (! $this->parser) {
        $this->loadParser();
      }

      return $this->parser->getChunk($this->config['hooks_error_tpl'], [
        'errors' => $this->pre_hooks->getErrors()
      ]);
    }

    $this->modx->setPlaceholders($this->pre_hooks->fields, $this->config['placeholder_prefix']);

    return $this->getChunk();
  }

  /**
   * Sets request property (\modHelpers\Request)
   * @return void
   */
  public function loadRequest() : void {
    // $this->request = new Request($this);
    $this->request =& request();
  }

  /**
   * Loads validator class object
   * @return void
   */
  public function loadValidator() : void {
    $this->validator = new Validator($this);
  }

  /**
   * Loads pre-/post- Hooks class object by passing type argument
   * @param string $type 'pre' or 'post'
   * @return void
   */
  public function loadHooks(string $type) : void {
    $property_name = $type . '_hooks';
    $this->$property_name = new Hooks($this, [ 'type' => $type ]);
  }

  /**
   * @return bool
   */
  public function runHooks(string $type) : bool {
    $this->loadHooks($type);

    $property_name = $type . '_hooks';
    
    // return $this->$property_name->loadMultiple($this->config[$property_name]);
    return $this->$property_name->loadMultiple($this->config[$property_name === 'post_hooks' ? 'hooks' : $property_name]);
  }

  /**
   * Loads config and merges him with object config
   * @return void
   */
  public function loadConfig() : void {
    $key = $this->request->input($this->config['action_key']);

    if (is_null($key)) {
      $this->addError($this->config['action_key'], 'form_key_missing');
      $this->response([
        'success' => false,
        'errors'  => $this->getErrors(),
      ]);
    }

    $loaded = $this->load(
      $key,
      $this->config['form_storage_key']
    );

    if (! $loaded) {
      $this->addError($this->config['action_key'], 'form_key_invalid');
      $this->response([
        'success' => false,
        'errors'  => $this->getErrors(),
      ]);
    }

    $this->config = array_merge($this->config, $loaded);
  }

  /**
   * For assets connector call
   */
  public function process() : void {
    $this->loadRequest();
    $this->loadConfig();

    // Load and run pre_validate_hooks
    if (!$this->runHooks('pre_validate') && !$this->config['continue_on_pre_validate_hook_error']) {
      $this->response([
        'success' => false,
        'errors'  => $this->pre_validate_hooks->getErrors()
      ]);
    }

    $this->loadValidator();
    if (! $this->validator->validate()) {
      $this->response([
        'success' => false,
        'errors'  => $this->validator->getErrors()
      ]);
    }

    if (! $this->runHooks('post') && !$this->config['continue_on_post_hook_error']) {
      $this->response([
        'success' => false,
        'errors'  => $this->post_hooks->getErrors()
      ]);
    }

    $this->response([
      'success' => true,
      'errors'  => []
    ]);
  }

  /**
   * Generate form config md5 hash
   * @return string
   */
  public function generateFormKey(array & $config) : string {
    return md5(http_build_query($config));
  }

  /**
   * Returns chunk with form
   * @return string
   */
  public function getChunk() : string {
    if (! $this->parser) {
      $this->loadParser();
    }

    $chunk = $this->parser->getChunk($this->config['form_tpl']);

    $dom = new Document();
    $dom->loadHtml($chunk, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

    // remove existing xaro_action inputs
    foreach ($dom->find("[name=\"{$this->config['action_key']}\"]") as $x) {
      $x->remove();
    }

    $form = $dom->first('form');

    $element = new Element('input', null, [
      'type'  => 'hidden',
      'name'  => $this->config['action_key'],
      'value' => $this->config['form_key']
    ]);
    $form->prependChild($element);

    $form->setAttribute('action', $this->config['action_url']);
    $form->setAttribute('data-form-action', $this->config['form_key']);
    $classes = implode(' ', $form->classes()->getAll());
    $form->setAttribute('class', $this->config['form_class'] . ' ' . $classes);

    return $dom->html();
  }

  /**
   * Save data to storage (cache or session, by default: cache)
   * @param string      $key          Data id
   * @param mixed       $data         Data value
   * @param string      $storage_key  Storage id
   * @param string|null $storage      Storage type
   * @return bool
   */
  protected function save(string $key, $data, string $storage_key, $storage = null) : bool {
    if (is_null($storage) || $storage === 'cache') {
      cache([
        $key => $data,
      ], [
        xPDO::OPT_CACHE_KEY => $storage_key
      ]);
      return true;
    } else if ($storage === 'session') {
      // TODO: make session storage and return true
      return false;
    }

    return false;
  }

  /**
   * Load any data from storage (cache or session, by default: cache)
   * @param string      $key          Data id
   * @param string      $storage_key  Storage id
   * @param string|null $storage      Storage type
   * @return mixed
   */
  protected function load(string $key, string $storage_key, $storage = null) {
    if (is_null($storage) || $storage === 'cache') {
      return cache($key, [
        xPDO::OPT_CACHE_KEY => $storage_key
      ]);
    }
    
    if ($storage === 'session') {
      // TODO: make session storage and return data
      return false;
    }

    return false;
  }

  /**
   * Loads parser
   * @return void
   */
  public function loadParser() : void {
    $this->parser = $this->modx->getService('pdoTools');
  }

  /**
   * Sets header for ajax response
   * @param array $data
   * @return void
   */
  public function response($data) : void {
    $data['adds'] = $this->request->all();
    // dd($this->request->all());
    response()->json($data);
    exit;
  }

  /**
   * Adds error message by key
   * @param string $key
   * @param string $msg
   * @return void
   */
  public function addError(string $key, string $code) : void {
    $this->errors[$key][] = $this->modx->lexicon('xaroform_error_' . $code);
  }

  /**
   * Checks for an error of this class object
   * @return bool
   */
  public function hasErrors() : bool {
    return !empty($this->errors);
  }

  /**
   * Return errors of this class object
   * @return array
   */
  public function getErrors() : array {
    return $this->errors;
  }

  public static function dd(string $func, string $file, string $line, string $msg) {
    dd("[Error] $func in file $file on line $line: $msg");
  }
}