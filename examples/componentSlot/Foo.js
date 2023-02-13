import { h } from '../../lib/zjt-mini-vue.esm.js';

export const Foo = {
  render() {
    const foo = h('p', {}, 'foo');

    console.log(this.$slots);
    return h('div', {}, [foo, this.$slots]);
  },

  setup() {
    return {}
  }
};
