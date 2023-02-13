import { h, renderSlots } from '../../lib/zjt-mini-vue.esm.js';

export const Foo = {
  render() {
    const foo = h('p', {}, 'foo');

    const age = 18;

    return h(
      'div',
      {},
      // 单节点插槽
      // 多节点插槽
      // [foo, renderSlots(this.$slots)]
      // 具名插槽
      // 1、获取到要渲染的元素
      // 2、获取要要渲染的位置
      // [
      //   renderSlots(this.$slots, 'header'),
      //   foo,
      //   renderSlots(this.$slots, 'footer')
      // ]
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
