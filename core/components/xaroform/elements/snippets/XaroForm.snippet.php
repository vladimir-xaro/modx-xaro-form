<?php
/** @var \modX $modx */
/** @var array $scriptProperties */
/** @var \XaroForm $XaroForm */

// $XaroForm = $modx->getService('XaroForm', 'XaroForm', MODX_CORE_PATH . 'components/xaroform/model/', $scriptProperties);
$modx->loadClass('XaroForm', MODX_CORE_PATH . 'components/xaroform/model/', true, true);
$XaroForm = new XaroForm($modx, $scriptProperties);

if (! $XaroForm) {
    return 'Could not load XaroForm class!';
}

return $XaroForm->initialize();