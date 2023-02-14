import { h } from '../../lib/zjt-mini-vue.esm.js';
import { Foo } from './Foo.js';
import { Foo3 } from './Foo3.js';
import { Foo4 } from './Foo4.js';

export const App = {
  name: 'App',
  render() {
    // 单节点插槽
    const foo1 = h(
      Foo,
      {},
      h('p', {}, 'foo: 单节点')
    );
    // 多节点插槽
    const foo2 = h(
      Foo,
      {},
      [
        h('p', {}, 'foo: 多节点1'),
        h('p', {}, 'foo: 多节点2')
      ]
    );
    // 具名插槽
    const foo3 = h(
      Foo3,
      {},
      {
        header: h('p', {}, 'foo: 具名header'),
        footer: h('p', {}, 'foo: 具名footer')
      }
    );
    // 作用域插槽
    const foo4 = h(
      Foo4,
      {},
      {
        header: ({ age }) => h('p', {}, 'foo: 作用域header' + age),
        footer: ({ age }) => h('p', {}, 'foo: 作用域footer' + age)
      }
    );

    return h(
      'div',
      {},
      [
        h('div', {}, [foo1])
        // h('div', {}, [foo2]),
        // h('div', {}, [foo3]),
        // h('div', {}, [foo4])
      ]
    );
  },

  setup() {
    return {};
  }
};
