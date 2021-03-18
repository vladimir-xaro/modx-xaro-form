<?php
/** @var xPDOTransport $transport */
/** @var array $options */
/** @var modX $modx */
if ($transport->xpdo) {
    $modx =& $transport->xpdo;

    $dev = MODX_BASE_PATH . 'Extras/XaroForm/';
    /** @var xPDOCacheManager $cache */
    $cache = $modx->getCacheManager();
    if (file_exists($dev) && $cache) {
        if (!is_link($dev . 'assets/components/xaroform')) {
            $cache->deleteTree(
                $dev . 'assets/components/xaroform/',
                ['deleteTop' => true, 'skipDirs' => false, 'extensions' => []]
            );
            symlink(MODX_ASSETS_PATH . 'components/xaroform/', $dev . 'assets/components/xaroform');
        }
        if (!is_link($dev . 'core/components/xaroform')) {
            $cache->deleteTree(
                $dev . 'core/components/xaroform/',
                ['deleteTop' => true, 'skipDirs' => false, 'extensions' => []]
            );
            symlink(MODX_CORE_PATH . 'components/xaroform/', $dev . 'core/components/xaroform');
        }
    }
}

return true;