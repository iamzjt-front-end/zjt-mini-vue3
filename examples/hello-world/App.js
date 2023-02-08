import { h } from '../../lib/zjt-mini-vue.esm.js';

window.self = null;

export const App = {
  // .vue
  // template
  // render
  render() {
    // ui
    window.self = this;
    return h(
      'div',
      { id: 'root', class: ['red', 'active'] },
      // setupState
      // this.$el -> get root element
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
