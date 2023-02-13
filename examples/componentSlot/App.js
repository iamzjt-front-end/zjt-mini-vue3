import { h } from '../../lib/zjt-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  render() {
    const app = h('div', {}, 'app');
    // 支持多节点 slot
    // const foo = h(
    //   Foo,
    //   {},
    //   [
    //     h('p', {}, '123'),
    //     h('p', {}, '456')
    //   ]
    // );
    // 单节点 slot
    const foo = h(
      Foo,
      {},
      h('p', {}, '123')
    );

    return h('div', {}, [app, foo]);
  },

  setup() {
    return {};
  }
};
