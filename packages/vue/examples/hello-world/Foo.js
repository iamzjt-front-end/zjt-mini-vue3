import { h } from '../../dist/zjt-mini-vue.esm.js';

export const Foo = {
  setup(props) {
    // props.count
    console.log(props);
    // props: readonly, 不可修改
  },
  render() {
    return h('div', {}, 'foo:' + this.count);
  }
}
