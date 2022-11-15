import { track, trigger } from './effect';
import { ReactiveFlags, reactive, readonly } from './reactive';
import { isObject, extend } from '../shared';

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
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
const shallowReadonlyGet = createGetter(true, true);

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

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
});