import { track, trigger } from './effect';

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    !isReadonly && track(target, key);
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

// * reactive
export const mutableHandlers = {
  get: createGetter(),
  set: createSetter(),
};

// * readonly
export const readonlyHandlers = {
  get: createGetter(true),

  set(target, key, value) {
    // todo 抛出警告⚠️ 不可以被set
    return true;
  },
};