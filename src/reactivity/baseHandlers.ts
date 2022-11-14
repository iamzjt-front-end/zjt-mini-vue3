import { track, trigger } from './effect';
import { ReactiveFlags, reactive } from './reactive';
import { isObject } from '../shared';

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    if (isObject(res)) {
      return reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }
    
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    trigger(target, key);
    return res;
  };
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

// * reactive
export const mutableHandlers = {
  get,
  set
};

// * readonly
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    // ! 抛出警告⚠️ 不可以被set
    console.warn(`key: ${ key } set value: ${ value } failed, because the target is readonly!`, target);
    return true;
  }
};