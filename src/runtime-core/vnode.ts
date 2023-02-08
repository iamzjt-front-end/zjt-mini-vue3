export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    el: undefined
  };

  return vnode;
}
