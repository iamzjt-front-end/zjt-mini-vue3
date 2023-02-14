import { h, renderSlots } from '../../lib/zjt-mini-vue.esm.js';

export const Foo = {
  render() {
    const foo = h('p', {}, 'foo');

    return h(
      'div',
      {},
      // 单节点插槽
      [foo, renderSlots(this.$slots)]
    );
  },

  setup() {
    return {};
  }
};
