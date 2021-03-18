<?php

class XaroFormItemCreateProcessor extends modObjectCreateProcessor
{
    public $objectType = 'XaroFormItem';
    public $classKey = 'XaroFormItem';
    public $languageTopics = ['xaroform'];
    //public $permission = 'create';


    /**
     * @return bool
     */
    public function beforeSet()
    {
        $name = trim($this->getProperty('name'));
        if (empty($name)) {
            $this->modx->error->addField('name', $this->modx->lexicon('xaroform_item_err_name'));
        } elseif ($this->modx->getCount($this->classKey, ['name' => $name])) {
            $this->modx->error->addField('name', $this->modx->lexicon('xaroform_item_err_ae'));
        }

        return parent::beforeSet();
    }

}

return 'XaroFormItemCreateProcessor';