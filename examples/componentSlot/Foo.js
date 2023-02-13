import { h, renderSlots } from '../../lib/zjt-mini-vue.esm.js';

export const Foo = {
  render() {
    const foo = h('p', {}, 'foo');

    return h(
      'div',
      {},
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
    return {}
  }
};
