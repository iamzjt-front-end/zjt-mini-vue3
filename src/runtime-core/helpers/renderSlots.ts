import { createVNode } from '../vnode';

export function renderSlots(slots, name, props) {
  const slot = slots[name];

  if (slot) {
    // function
    if (typeof slot === 'function') {
      return createVNode('div', {}, slot(props));
    }
  } else {
    return createVNode('div', {}, slots);
  }
}
