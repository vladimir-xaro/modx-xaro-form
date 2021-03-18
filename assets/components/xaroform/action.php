<?php

define('MODX_API_MODE', true);
$__rootPath = dirname(dirname(dirname(dirname(__FILE__)))) . '/';

require_once $__rootPath . 'config.core.php';
require_once MODX_CORE_PATH . 'model/modx/modx.class.php';

$modx = new modX();
$modx->initialize('web');
$modx->getService('error','error.modError', '', '');

$modx->getService('XaroForm', 'XaroForm', MODX_CORE_PATH . 'components/xaroform/model/');

$modx->XaroForm->process();