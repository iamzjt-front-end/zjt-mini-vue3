import { h, renderSlots } from '../../lib/zjt-mini-vue.esm.js';

export const Foo = {
  render() {
    const foo = h('p', {}, 'foo');

    return h(
      'div',
      {},
      [foo, renderSlots(this.$slots)]
    );
  },

  setup() {
    return {}
  }
};
