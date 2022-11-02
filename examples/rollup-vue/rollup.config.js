import vue from 'rollup-plugin-vue';

export default {
  input: './App.vue',
  plugins: [vue()],
  output: {
    name: 'vue',
    format: 'es',
    file: 'lib/mini-vue.esm.js'
  }
}