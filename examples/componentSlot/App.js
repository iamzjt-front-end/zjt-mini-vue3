import { h } from '../../lib/zjt-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  render() {
    const app = h('div', {}, 'app');
    // 单节点插槽
    // const foo = h(
    //   Foo,
    //   {},
    //   h('p', {}, '123')
    // );
    // 多节点插槽
    // const foo = h(
    //   Foo,
    //   {},
    //   [
    //     h('p', {}, '123'),
    //     h('p', {}, '456')
    //   ]
    // );
    // 具名插槽
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => h('p', {}, 'header' + age),
        footer: ({ age }) => h('p', {}, 'footer' + age)
      }
    );

    return h('div', {}, [app, foo]);
  },

  setup() {
    return {};
  }
};
