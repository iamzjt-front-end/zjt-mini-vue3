import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';
import { isObject } from '../shared';

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw'
}

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

function createReactiveObject(raw: any, baseHandlers, proxyMap) {
  if (!isObject(raw)) {
    console.warn(`value cannot be made reactive: ${ String(raw) }`);
    return raw;
  }
  if (raw[ReactiveFlags.RAW]) {
    return raw;
  }
  const existingProxy = proxyMap.get(raw);
  // + 这里解决的是reactive多层嵌套的问题
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(raw, baseHandlers);
  // + 缓存一下已经被代理的对象
  proxyMap.set(raw, proxy);
  return proxy;
};

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers, reactiveMap);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers, readonlyMap);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers, shallowReadonlyMap);
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}