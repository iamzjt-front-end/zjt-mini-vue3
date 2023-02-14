import { isArray, isFunction } from '../shared';
import { ShapeFlags } from '../shared/ShapeFlags';

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlot(children, instance.slots);
  }
}

function normalizeObjectSlot(children, slots) {
  for (const key in children) {
    const value = children[key];
    slots[key] = isFunction(value)
      ? (props) => normalizeSlotValue(value(props))
      : normalizeSlotValue(value);
  }
}

function normalizeSlotValue(value) {
  return isArray(value) ? value : [value];
}
