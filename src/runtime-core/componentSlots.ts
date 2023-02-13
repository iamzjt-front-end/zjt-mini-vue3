import { isArray } from '../shared';

export function initSlots(instance, children) {
  instance.slots = isArray(children) ? children : [children];
}
