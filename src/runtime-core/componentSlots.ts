import { isArray } from '../shared';
import { ShapeFlags } from '../shared/ShapeFlags';

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlot(children, instance.slots);
  }
}

function normalizeObjectSlot(children, slots) {
  // array -> 多节点插槽
  // object -> 具名插槽
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return isArray(value) ? value : [value];
}
