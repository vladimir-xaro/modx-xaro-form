<?php
$settings = include_once 'settings.inc.php';
$errors   = include_once 'errors.inc.php';

$_lang['xaroform'] = 'XaroForm';

$_lang = array_merge($_lang, $settings, $errors);