import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";
// import postcss from "rollup-plugin-postcss";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
// import { deepmerge } from 'deepmerge';

// import multiInput from 'rollup-plugin-multi-input';

const XARO_ASSETS_PATH      = 'assets/components/xaroform/';
const XARO_FILENAME         = 'xaroform';
const XARO_VERSION          = '0.0.1-pl';
const XARO_PLUGINS_SRC_DIR  = 'src/js/plugins/';
const XARO_PLUGINS_DIR      = `${XARO_ASSETS_PATH}js/plugins/`;
const XARO_PLUGINS          = [ 'RecaptchaV3' ];

let pluginsConfig = [];
for (const plugin of XARO_PLUGINS) {
  pluginsConfig.push({
    input: `${XARO_PLUGINS_SRC_DIR}${plugin}.ts`,
    output: {
      sourcemap: true,
      file: `${XARO_PLUGINS_DIR}${plugin}.js`,
      format: 'iife',
      name: plugin,
    },
    plugins: [
      nodeResolve({
        browser: true
      }),
      typescript({
        target: 'es5'
      })
      // terser(),
    ],
  })
}

let config = [{
  input: 'src/index.ts',
  output: [{
    sourcemap: true,
    file: `${XARO_ASSETS_PATH}js/${XARO_FILENAME}.${XARO_VERSION}.js`,
    format: 'iife',
    name: 'XaroForm',
  // }, {
  //   sourcemap: true,
  //   file: `${XARO_ASSETS_PATH}js/${XARO_FILENAME}.${XARO_VERSION}.min.js`,
  //   format: 'iife',
  //   plugins: [
  //     terser()
  //   ]
  }],
  plugins: [
    nodeResolve({
      browser: true
    }),
    typescript({
      target: 'es5'
    }),
    scss({
      watch: 'src/scss/',
      output: `${XARO_ASSETS_PATH}css/${XARO_FILENAME}.${XARO_VERSION}.css`,
      failOnError: true,
    }),
    // terser(),
  ],
}];
config.push(...pluginsConfig);


export default config;