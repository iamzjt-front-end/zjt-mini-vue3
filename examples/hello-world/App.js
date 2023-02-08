import { h } from '../../lib/zjt-mini-vue.esm.js';

export const App = {
  // .vue
  // template
  // render
  render() {
    // ui
    return h(
      'div',
      { id: 'root', class: ['red', 'active'] },
      'hi, ' + this.msg
      // 'hi, mini-vue'
      // [
      //   h('div', { class: 'red' }, 'hi'),
      //   h('div', { class: 'green' }, 'mini-vue')
      // ]
    );
  },

  setup() {
    // composition api
    return {
      msg: 'zjt-mini-vue'
    };
  }
};
