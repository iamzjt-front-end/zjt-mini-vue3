import { isArray } from '../shared';
import { ShapeFlags } from '../shared/ShapeFlags';

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlot(children, instance.slots);
  }
}

function normalizeObjectSlot(children, slots) {
  // object -> 单节点插槽
  // array -> 多节点插槽
  // object -> 具名插槽
  if (!isArray(children)) {
    for (const key in children) {
      const value = children[key];
      if (typeof value === 'function') {
        slots[key] = (props) => normalizeSlotValue(value(props));
      } else {
        slots[key] = normalizeSlotValue(value);
      }
    }
  } else {
    slots = normalizeSlotValue(children);
  }
}

function normalizeSlotValue(value) {
  return isArray(value) ? value : [value];
}
