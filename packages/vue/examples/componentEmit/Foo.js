import { h } from '../../dist/zjt-mini-vue.esm.js';

export const Foo = {
  setup(props, { emit }) {
    const emitAdd = () => {
      emit('add', 1, 2);
      emit('add-foo');
    };

    return {
      emitAdd
    };
  },
  render() {
    const btn = h(
      'button',
      {
        onClick: this.emitAdd
      },
      'buttonAdd'
    );

    const foo = h('p', {}, 'Foo');

    return h('div', {}, [foo, btn]);
  }
};
