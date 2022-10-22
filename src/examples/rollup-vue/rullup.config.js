import vue from 'rollup-plugin-vue';

export default {
  input: './App.vue',
  plugin: [vue()],
  output: {
    name: 'vue',
    format: 'es',
    file: 'lib/mini-vue.esm.js'
  }
}