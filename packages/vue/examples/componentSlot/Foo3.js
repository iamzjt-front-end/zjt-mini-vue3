import { h, renderSlots } from '../../dist/zjt-mini-vue.esm.js';

export const Foo3 = {
  render() {
    const foo = h('p', {}, 'foo');

    return h(
      'div',
      { class: 'foo3-root' },
      // 具名插槽
      // 1、获取到要渲染的元素
      // 2、获取要要渲染的位置
      [
        renderSlots(this.$slots, 'header'),
        foo,
        renderSlots(this.$slots, 'footer')
      ]
    );
  },

  setup() {
    return {};
  }
};
