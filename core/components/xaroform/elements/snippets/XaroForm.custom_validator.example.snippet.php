<?php
/**
 * @var \XaroForm\Validator $validator
 * @var \modHelpers\Request $request
 * @var string $field Field key
 * @var string $ruleValue 
 */

$value = $request->input($field);
if (strtolower($value) === 'admin') {
  $validator->addError($field, 'custom_1', "\"$value\" cannot be field value");
  return false;
}

return true;