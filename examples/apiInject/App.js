import { h, provide, inject } from '../../lib/zjt-mini-vue.esm.js';

const Provider = {
  name: 'App',
  setup() {
    provide('foo', 'fooVal');
    provide('bar', 'barVal');
  },
  render() {
    return h(
      'div',
      {},
      [
        h('p', {}, 'Provider'),
        h(Consumer)
      ]
    );
  }
};

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo');
    const bar = inject('bar');

    return {
      foo,
      bar
    };
  },
  render() {
    return h('div', {}, `Consumer: - ${ this.foo } - ${ this.bar }`);
  }
};

export default {
  name: 'App',
  setup() {
    return {};
  },
  render() {
    return h(
      'div',
      {},

      h('p', {}, 'apiInject'),
      h(Provider)
    );
  }
};
