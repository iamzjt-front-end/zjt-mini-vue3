import { h } from '../../lib/zjt-mini-vue.esm.js';

export const App = {
  // .vue
  // template
  // render
  render() {
    // ui
    return h('div', 'hi, ' + this.msg);
  },

  setup() {
    // composition api
    return {
      msg: 'zjt-mini-vue'
    };
  }
};
