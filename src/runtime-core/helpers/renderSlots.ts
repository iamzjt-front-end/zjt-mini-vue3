import { createVNode } from '../vnode';

export function renderSlots(slots) {
  console.log(slots);
  return createVNode('div', {}, slots);
}
