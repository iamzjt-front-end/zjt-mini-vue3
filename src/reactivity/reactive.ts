import { track, trigger } from "./effect";

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // target 目标对象 { foo: 1 }  key 属性 foo
      const res = Reflect.get(target, key);

      // * 收集依赖
      track(target, key);
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);

      // * 触发依赖
      trigger(target, key);
      return res;
    },
  });
}
