import { h, renderSlots } from '../../dist/zjt-mini-vue.esm.js';

export const Foo = {
  render() {
    const foo = h('p', {}, 'foo');

    return h(
      'div',
      { class: 'foo-root' },
      // 单节点插槽
      [foo, renderSlots(this.$slots, 'default')]
    );
  },

  setup() {
    return {};
  }
};
