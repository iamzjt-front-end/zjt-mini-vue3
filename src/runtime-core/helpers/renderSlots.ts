import { createVNode, Fragment } from '../vnode';
import { isFunction } from '../../shared';

export function renderSlots(slots, name, props) {
  const slot = slots[name];

  if (slot) {
    if (isFunction(slot)) {
      return createVNode(Fragment, {}, slot(props));
    } else {
      return createVNode(Fragment, {}, slot);
    }
  }
}
