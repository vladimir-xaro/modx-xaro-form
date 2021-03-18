<?php

namespace Xaro\Form\Hooks;

use Xaro\Form\Hooks;

class Telegram {
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
      'msg_tpl'     => $this->form->config['telegram_msg_tpl'],
      'parse_mode'  => $this->form->config['telegram_parse_mode'],
      'bot_token'   => $this->form->config['telegram_bot_token'],
      'bot_chats'   => $this->form->config['telegram_bot_chats'],
      'is_notify'   => $this->form->config['telegram_is_notify'],
    ], $config);
  }

  /**
   * @return bool
   */
  public function process() : bool {
    $pdoTools = $this->modx->getService('pdoTools');

    $text = $pdoTools->getChunk($this->config['msg_tpl'], $this->hook->request->all());
    // Symbols needle are for MarkdownV2 and escape if you want display any: '*', '_', '~', '[', ']', '(', ')', '`'
    $text = str_replace(
      ['>', '#', '+', '-', '=', '|', '{', '}', '.', '!'],
      ['\>', '\#', '\+', '\-', '\=', '\|', '\{', '\}', '\.', '\!'], $text);

    $chats = explode(',', $this->config['bot_chats']);
    $msg_successed = 0;
    foreach ($chats as $id) {
      $msg_response = $this->sendMessage($id, $text);

      if ($msg_response['ok']) {
        $msg_successed++;
      } else {
        // TODO: change for a manager error
        $this->hook->addError($this->config['name'], "[Telegram] Failed to send message. Error data:\n" . var_export($msg_response, true));
      }
    }

    $files = $this->form->request->allFiles();
    if (!empty($files)) {
      $doc_successed = 0;
      foreach ($this->config['bot_chats'] as $id) {
        $doc_response = $this->sendDocument($id, $text);

        if ($doc_response['ok']) {
          $doc_successed++;
        } else {
          // TODO: change for a manager error
          $this->hook->addError($this->config['name'], "[Telegram] Failed to send document. Error data:\n" . var_export($doc_response, true));
        }
      }
    }

    return true;
  }

  /**
   * Sends message using Telegram BotAPI and returns telegram response
   * @return string
   */
  public function sendMessage(string $id, string $text) : array {
    $ch = curl_init("https://api.telegram.org/bot{$this->config['bot_token']}/sendMessage");
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ([
      'parse_mode'  => $this->config['parse_mode'],
      'chat_id'     => (int)$id,
      'text'        => $text,
    ]));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
  }

  /**
   * Sends document using Telegram BotAPI and returns telegram response
   * @return string
   */
  public function sendDocument(string $id, string $file) : array {
    $file = new \CURLFile($file->getRealPath());

    $ch = curl_init("https://api.telegram.org/bot{$this->config['bot_token']}/sendDocument");
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ([
      'chat_id'     => $id,
      'document'    => $file,
      'caption'     => '# CAPTION #'
    ]));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
  }

}