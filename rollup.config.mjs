import pkg from "./package.json" assert { type: 'json' };
import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/index.ts',
  output: [
    // * 1. cjs -> commonjs
    // * 2. esm -> es module
    {
      format: 'cjs',
      file: pkg.main
    },
    {
      format: 'es',
      file: pkg.module
    }
  ],
  plugins: [typescript()]
};
