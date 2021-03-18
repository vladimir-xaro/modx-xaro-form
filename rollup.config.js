import scss from "rollup-plugin-scss";
import { terser } from "rollup-plugin-terser";
// import postcss from "rollup-plugin-postcss";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
// import { deepmerge } from 'deepmerge';

const XARO_ASSETS_PATH = 'assets/components/xaroform/';
const XARO_FILENAME = 'xaroform';
const XARO_VERSION = '0.0.1-pl';

export default {
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
}