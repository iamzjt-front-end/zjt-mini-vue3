import { track } from './effect';

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);

      track(target, key);
      return res;
    },

    set(target, key, value) {
      const res = Reflect.set(target, key, value);

      // todo 触发依赖
      return res;
    },
  });
}
