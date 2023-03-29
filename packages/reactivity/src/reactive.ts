import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';
import { isObject } from '@zjt-mini-vue3/shared';

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw'
}

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

function createReactiveObject(target: any, baseHandlers, proxyMap) {
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${ String(target) }`);
    return target;
  }
  if (target[ReactiveFlags.RAW]) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  // + 这里解决的是reactive多层嵌套的问题
  if (existingProxy) {
    return existingProxy;
  }
  const proxy = new Proxy(target, baseHandlers);
  // + 缓存一下已经被代理的对象
  proxyMap.set(target, proxy);
  return proxy;
}

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers, reactiveMap);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers, readonlyMap);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyHandlers, shallowReadonlyMap);
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
