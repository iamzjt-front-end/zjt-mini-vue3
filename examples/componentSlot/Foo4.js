import { h, renderSlots } from '../../lib/zjt-mini-vue.esm.js';

export const Foo4 = {
  render() {
    const foo = h('p', {}, 'foo');

    const age = 18;

    return h(
      'div',
      {},
      // 作用域插槽
      [
        renderSlots(this.$slots, 'header', { age: 18 }),
        foo,
        renderSlots(this.$slots, 'footer', { age: 20 })
      ]
    );
  },

  setup() {
    return {};
  }
};
