import { isArray } from '../shared';

export function initSlots(instance, children) {
  // array -> 多节点插槽
  // object -> 具名插槽?
  instance.slots = isArray(children) ? children : [children];
}
