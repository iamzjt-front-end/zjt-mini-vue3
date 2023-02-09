import { h } from '../../lib/zjt-mini-vue.esm.js';
import { Foo } from './Foo.js';

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
      {
        id: 'root',
        class: ['red', 'active'],
        onClick() {
          console.log('click');
        }
      },
      // setupState
      // this.$el -> get root element
      // 'hi, ' + this.msg
      // 'hi, mini-vue'
      // [
      //   h('div', { class: 'red' }, 'hi'),
      //   h('div', { class: 'green' }, 'mini-vue')
      // ]
      [
        h('div', {}, this.msg),
        h(Foo, { count: 1 })
      ]
    );
  },

  setup() {
    // composition api
    return {
      msg: 'zjt-mini-vue'
    };
  }
};
