import pkg from "./package.json" assert { type: 'json' };
import typescript from '@rollup/plugin-typescript';

export default {
  input: './packages/vue/src/index.ts',
  output: [
    // * 1. cjs -> commonjs
    // * 2. esm -> es module
    {
      format: 'cjs',
      file: "packages/vue/dist/zjt-mini-vue.cjs.js"
    },
    {
      format: 'es',
      file: "packages/vue/dist/zjt-mini-vue.esm.js"
    }
  ],
  plugins: [typescript()]
};
