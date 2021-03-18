<?php

/**
 * The home manager controller for XaroForm.
 *
 */
class XaroFormHomeManagerController extends modExtraManagerController
{
    /** @var XaroForm $XaroForm */
    public $XaroForm;


    /**
     *
     */
    public function initialize()
    {
        $this->XaroForm = $this->modx->getService('XaroForm', 'XaroForm', MODX_CORE_PATH . 'components/xaroform/model/');
        parent::initialize();
    }


    /**
     * @return array
     */
    public function getLanguageTopics()
    {
        return ['xaroform:default'];
    }


    /**
     * @return bool
     */
    public function checkPermissions()
    {
        return true;
    }


    /**
     * @return null|string
     */
    public function getPageTitle()
    {
        return $this->modx->lexicon('xaroform');
    }


    /**
     * @return void
     */
    public function loadCustomCssJs()
    {
        $this->addCss($this->XaroForm->config['cssUrl'] . 'mgr/main.css');
        $this->addJavascript($this->XaroForm->config['jsUrl'] . 'mgr/xaroform.js');
        $this->addJavascript($this->XaroForm->config['jsUrl'] . 'mgr/misc/utils.js');
        $this->addJavascript($this->XaroForm->config['jsUrl'] . 'mgr/misc/combo.js');
        $this->addJavascript($this->XaroForm->config['jsUrl'] . 'mgr/widgets/items.grid.js');
        $this->addJavascript($this->XaroForm->config['jsUrl'] . 'mgr/widgets/items.windows.js');
        $this->addJavascript($this->XaroForm->config['jsUrl'] . 'mgr/widgets/home.panel.js');
        $this->addJavascript($this->XaroForm->config['jsUrl'] . 'mgr/sections/home.js');

        $this->addHtml('<script type="text/javascript">
        XaroForm.config = ' . json_encode($this->XaroForm->config) . ';
        XaroForm.config.connector_url = "' . $this->XaroForm->config['connectorUrl'] . '";
        Ext.onReady(function() {MODx.load({ xtype: "xaroform-page-home"});});
        </script>');
    }


    /**
     * @return string
     */
    public function getTemplateFile()
    {
        $this->content .= '<div id="xaroform-panel-home-div"></div>';

        return '';
    }
}