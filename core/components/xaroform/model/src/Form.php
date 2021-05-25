<?php

namespace Xaro\Form;

use xPDO;

class Form {
  const VERSION = '0.0.1';
  const BUILD = 'pl';

  const STORAGE_KEY = 'xaro/form';
  const STORAGE_PREFIX = 'form_';

  /** @var array $forms */
  public static $forms;

  /** @var bool $is_init */
  public static $is_init;

  public static $common_js_config = [];

  /** @var \modX $modx */
  public $modx;

  /** @var \pdoTools $parser */
  public $parser;

  /** @var array $config */
  public $config;

  /** @var array $user_config */
  public $user_config;

  /** @var array $custom_js_config */
  public $custom_js_config = [];

  /** @var array $hooks List with settings for all hooks */
  public $hooks = [];

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

  /** @var string $content */
  public $content;

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

      'storage' => $this->getOption('data_storage'),

      // custom js config append to XaroFormConfig for initialize on client side
      'custom_js_config' => [],

      'form_storage_key' => $this->getOption('data_form_storage_key'),
      'chunk_storage_key' => 'xaro/chunk',

      'core_path' => $core_path,
      'model_path' => $core_path . 'model/',
      'processors_path' => $core_path . 'processors/',

      'action_url' => $assets_url . 'action.php?test=1',
      'assets_url' => $assets_url,

      'css_url' => $assets_url . 'css/' . $assets_filename . '.css',
      'js_url' => $assets_url . 'js/' . $assets_filename . '.js',
      
      // Adds XaroForm.initialize(window.XaroFormConfig); after js script
      'auto_init' => true,

      'placeholder_prefix' => 'xf.',

      // Continue if any preHook return false;
      'continue_on_pre_hook_error'          => false,
      // Continue if any preHook return false;
      'continue_on_pre_validate_hook_error' => false,
      // Continue if any postHook return false;
      'continue_on_post_hook_error'         => true,
      'hooks_error_tpl'                     => 'XaroForm.hooks.error.tpl',
      'snippet_hooks_prefix' => '',
      'hooks_namespace' => '\Xaro\Form\Hooks',

      'form_key'      => '',
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
      'custom_validate'     => '',
      'client_validate'     => '',
      // TODO: think about enable/disable client validation but change config key name
      // 'clientValidate'      => true, 
      'form_tpl'            => 'XaroForm.example.tpl',

      'plugins' => [],

      // Hooks part
      'telegram_msg_tpl'    => 'XaroForm.telegram.msg.example.tpl',
      'telegram_parse_mode' => 'MarkdownV2',
      // 'telegram_bot_token'  => $this->modx->getOption('telegram_bot_token', null, ''),
      // 'telegram_bot_chats'  => explode(',', preg_replace('/\s/', '', $modx->getOption('telegram_bot_chats', null, ''))),
      'telegram_bot_token'  => '',
      'telegram_bot_chats'  => '',
      'telegram_is_notify'  => $this->getOption('telegram_is_notify', null, true),
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
   * Adapter for $modx->getOption()
   * @param string $key — The option key.
   * @param mixed $default — An optional default value to return if no value is found.
   * @param array $options — A set of options to override those from xPDO.
   * @param bool $skipEmpty
   * @return mixed
   */
  public function getOption(string $key, $default = null, $options = null, $skipEmpty = false) {
    return $this->modx->getOption('xaroform_' . $key, $options, $default, $skipEmpty);
  }

  /**
   * Initialize form and return chunk
   * @return string
   */
  public function initialize() : string {
    $this->config['form_key'] = $this->generateFormKey($this->user_config);

    // TODO: optmize run time
    // Save form settings in storage (cache/session) - currently only cache is available
    $this->save(
      $this->config['form_key'],
      $this->user_config,
      $this->config['form_storage_key'],
    );

    // Loads hooks settings
    $this->hooks = Hooks::getConfig($this, true);

    // Loads and sets chunk content
    /** @var \modChunk $chunk */
    $chunk = $this->modx->getObject('modChunk', array(
      'name' => $this->config['form_tpl']
    ));
    $this->content = $chunk->getContent();

    // Runs pre hooks
    if (!$this->runHooks('pre') && !$this->config['continue_on_pre_hook_error']) {
      if (! $this->parser) {
        $this->loadParser();
      }

      // Returns pre_hooks tpl error
      return $this->parser->getChunk($this->config['hooks_error_tpl'], [
        'errors' => $this->pre_hooks->getErrors(),
      ]);
    }

    // Sets placeholders from pre_hooks
    $this->modx->setPlaceholders($this->pre_hooks->fields, $this->config['placeholder_prefix']);

    // Loads js/css, sets common js config in XaroFormConfig.common
    if (!self::$is_init) {
      $common_js_config = json_encode(array_merge([
        'lexicon' => [
          'errors' => $this->modx->lexicon->fetch('xaroform_error_input_', true)
        ],
      ], self::$common_js_config));
      $this->modx->regClientCSS($this->config['css_url']);
      $this->modx->regClientScript($this->config['js_url']);
      $this->modx->regClientStartupHTMLBlock("<script type=\"text/javascript\">window.XaroFormConfig = { common: $common_js_config, forms: {} };</script>");
      self::$is_init = true;
    }

    $plugins = [];
    if (gettype($this->config['plugins']) === 'array') {
      $plugins = $this->config['plugins'];
    } else {
      $plugins = explode(',', $this->config['plugins']);
    }
    // Sets custom js form config in XaroFormConfig.forms[%this-form%]
    $custom_js_config = $this->config['custom_js_config'];
    $custom_js_config = gettype($custom_js_config) === 'array' ? $custom_js_config : json_decode($custom_js_config, true);
    $custom_js_config = json_encode(array_merge([
      'action_url'      => $this->config['action_url'],
      'form_selector'   => $this->config['form_selector'],
      'action_key'      => $this->config['action_key'],
      'form_key'        => $this->config['form_key'],
      'client_validate' => $this->config['client_validate'],
      'plugins'         => $plugins,
    ], $custom_js_config, $this->custom_js_config));
    $this->modx->regClientStartupHTMLBlock("<script type=\"text/javascript\">window.XaroFormConfig.forms['{$this->config['form_key']}'] = {$custom_js_config};</script>");
    if ($this->config['auto_init']) {
      $this->modx->regClientHTMLBlock("<script type=\"text/javascript\">XaroForm.initialize(window.XaroFormConfig);</script>");
    }

    
    if (! $this->parser) {
      $this->loadParser();
    }

    $this->content = $this->parser->fenom($this->content);

    $this->prepareForm();

    return $this->content;
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
   * @return bool
   */
  public function runHooks(string $type) : bool {
    $property_name = $type . '_hooks';
    
    if (! $this->$property_name) {
      $this->$property_name = new Hooks($this, [
        'type'  => $type,
        'hooks' => $this->hooks[$type]
      ]);
    }

    return $this->$property_name->runMultiple();
  }

  /**
   * Loads config and merges him with object config
   * @return void
   */
  public function loadConfig() : void {
    $key = $this->request->input($this->config['action_key']);

    if (is_null($key)) {
      $this->addError($this->config['action_key'], 'form_key_missing', 'missing');
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
      $this->addError($this->config['action_key'], 'form_key_invalid', 'invalid');
      $this->response([
        'success' => false,
        'errors'  => $this->getErrors(),
      ]);
    }

    $this->config = array_merge($this->config, $loaded);
    $this->config['form_key'] = $key;
  }

  /**
   * For assets connector call
   */
  public function process() : void {
    $this->loadRequest();
    $this->loadConfig();

    $this->hooks = Hooks::getConfig($this, true);

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

  protected function prepareForm() : void {
    // $from_mem = memory_get_usage();
    // $from_time = microtime(true);

    // method attr
    $pattern = '/<form(.*?)method=(?:"|\')(.*?)(?:"|\')/i';
    if (preg_match($pattern, $this->content)) {
      $this->content = preg_replace($pattern, '<form$1method="post"', $this->content);
    } else {
      $this->content = str_ireplace('<form', '<form method="post"', $this->content);
    }

    // action attr
    $pattern = '/<form(.*?)action=(?:"|\')(.*?)(?:"|\')/i';
    if (preg_match($pattern, $this->content)) {
      $this->content = preg_replace($pattern, '<form$1action="' . $this->config['action_url'] . '"', $this->content);
    } else {
      $this->content = str_ireplace('<form', '<form method="post"', $this->content);
    }

    // data-form-key attr
    $pattern = '/<form(.*?)data-form-key=(?:"|\')(.*?)(?:"|\')/i';
    if (preg_match($pattern, $this->content)) {
      $this->content = preg_replace($pattern, "<form$1data-form-key=\"{$this->config['form_key']}\"", $this->content);
    } else {
      $this->content = str_ireplace('<form', "<form data-form-key=\"{$this->config['form_key']}\"", $this->content);
    }

    // adds class
    $pattern = '/<form(.*?)class=(?:"|\')(.*?)(?:"|\')/i';
    if (preg_match($pattern, $this->content, $matches)) {
      if (stripos($matches[2], $this->config['form_class']) === false) {
        $this->content = preg_replace($pattern, "<form$1class=\"{$this->config['form_class']} $2\"", $this->content);
      }
    } else {
      $this->content = str_ireplace('<form', "<form class=\"{$this->config['form_class']}\"", $this->content);
    }

    // action_key input
    $action = "<input type=\"hidden\" name=\"{$this->config['action_key']}\" value=\"{$this->config['form_key']}\" />";
    if ((stripos($this->content, '</form>') !== false)) {
      if (preg_match('/<input.*?name=(?:"|\')' . $this->config['action_key'] . '(?:"|\').*?>/i', $this->content, $matches)) {
        $this->content = str_ireplace($matches[0], '', $this->content);
      }
      $this->content = str_ireplace('</form>', "\n\t$action\n</form>", $this->content);
    }

    // $to_time = microtime(true);
    // $to_mem = memory_get_usage();

    // $total_time = $to_time - $from_time;
    // $total_mem = $to_mem - $from_mem;

    // $debug_time = [
    //   'time_from'  => $from_time,
    //   'time_to'    => $to_time,
    //   'time_total' => $total_time,
    // ];
    // $debug_mem = [
    //   'mem_from'  => $from_mem,
    //   'mem_to'    => $to_mem,
    //   'mem_total' => $total_mem,
    // ];

    // dd($this->content, $debug_time, $debug_mem);
  }

  /**
   * Save data to storage (cache or session, by default: cache)
   * @param string      $key          Data id
   * @param mixed       $data         Data value
   * @param string      $storage_key  Storage id
   * @param string|null $storage      Storage type
   * @return bool
   */
  public function save(string $key, $data, string $storage_key, $storage = null) : bool {
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
  public function load(string $key, string $storage_key, $storage = null) {
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
  public function addError(string $key, string $code, string $public_key = null) : void {
    $this->errors[$key][$public_key ?: $code] = $this->modx->lexicon('xaroform_error_' . $code);
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

  /**
   * Adds config for sets window.XaroFormConfig.forms[%this-form%]
   */
  public function addJSConfig(array $config = []) : void {
    $this->custom_js_config = array_merge($this->custom_js_config, $config);
  }

  /**
   * Adds config for sets window.XaroFormConfig.common
   */
  public static function setInitializeConfig(array $config = []): void
  {
    self::$common_js_config = array_merge(self::$common_js_config, $config);
  }

  public function mergeConfig(string $prefix, array $config_default, array $config): array
  {
    $arr = [];
    foreach ($config_default as $key => $value) {
      if (is_int($key)) {
        $arr[$value] = $this->config[$prefix . '_' . $value] ?: $this->getOption($prefix . '_' . $value);
      } else {
        $arr[$key] = $value;
      }
    }

    return array_merge($arr, $config);
  }

  public static function dd(string $func, string $file, string $line, string $msg) {
    dd("[Error] $func in file $file on line $line: $msg");
  }
}