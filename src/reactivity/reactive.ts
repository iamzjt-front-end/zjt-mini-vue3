import { mutableHandlers, readonlyHandlers } from './baseHandlers';

function createActiveObject(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

export function isReactive(value) {
  return !!value['is_reactive'];
}