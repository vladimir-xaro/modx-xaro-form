<?php
/** @var \modX $modx */
/** @var array $scriptProperties */
/** @var \XaroForm $XaroForm */

// $from_mem = memory_get_usage();
// $from_time = microtime(true);

$modx->loadClass('XaroForm', MODX_CORE_PATH . 'components/xaroform/model/', true, true);

if (array_key_exists('init', $scriptProperties) && !$scriptProperties['init']) {
    if (array_key_exists('common_js_config', $scriptProperties)) {
        $config = $scriptProperties['common_js_config'];
        $config = gettype($config) === 'array' ? $config : json_decode($config, true);
        XaroForm::setInitializeConfig($config);
    }
    // ...
    return;
}

$XaroForm = new XaroForm($modx, $scriptProperties);

if (! $XaroForm) {
    return 'Could not load XaroForm class!';
}

$chunk = $XaroForm->initialize();

// $to_time = microtime(true);
// $to_mem = memory_get_usage();

// $total_time = $to_time - $from_time;
// $total_mem = $to_mem - $from_mem;

// echo <<<EOD
// <pre>
// 'XaroForm execution result' => [
//     'time' => [
//         'from'  => $from_time,
//         'to'    => $to_time,
//         'total' => {$total_time} s',
//     ],
//     'memory' => [
//         'from'  => $from_mem,
//         'to'    => $to_mem,
//         'total' => {$total_mem} bytes',
//     ],
// ];
// </pre>
// EOD;

return $chunk;