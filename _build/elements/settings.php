<?php

return [
    // Data
    'data_storage' => [
        'xtype' => 'textfield',
        'value' => 'cache',
        'area' => 'xaroform_data',
    ],
    'data_form_storage_key' => [
        'xtype' => 'textfield',
        'value' => 'xaro/form',
        'area' => 'xaroform_data',
    ],


    // Google Recaptcha
    'recaptcha_is_on' => [
        'xtype' => 'combo-boolean',
        'value' => false,
        'area' => 'xaroform_recaptcha',
    ],
    'recaptcha_secret' => [
        'xtype' => 'textfield',
        'value' => '',
        'area' => 'xaroform_recaptcha',
    ],
    'recaptcha_public' => [
        'xtype' => 'textfield',
        'value' => '',
        'area' => 'xaroform_recaptcha',
    ],
    'recaptcha_min_score' => [
        'xtype' => 'numberfield',
        'value' => 0,
        'area' => 'xaroform_recaptcha',
    ],

    // Telegram
    'telegram_is_on' => [
        'xtype' => 'combo-boolean',
        'value' => true,
        'area' => 'xaroform_telegram',
    ],
    'telegram_bot_token' => [
        'xtype' => 'textfield',
        'value' => '',
        'area' => 'xaroform_telegram',
    ],
    'telegram_bot_chats' => [
        'xtype' => 'textfield',
        'value' => '',
        'area' => 'xaroform_telegram',
    ],
];