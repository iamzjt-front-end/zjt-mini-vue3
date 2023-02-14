import { createVNode } from '../vnode';
import { isFunction } from '../../shared';

export function renderSlots(slots, name, props) {
  const slot = slots[name];

  if (slot) {
    // function
    if (isFunction(slot)) {
      return createVNode('div', {}, slot(props));
    }
  } else {
    return createVNode('div', {}, slots);
  }
}
