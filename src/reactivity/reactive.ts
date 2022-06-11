export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      // target 目标对象 { foo: 1 }  key 属性 foo
      const res = Reflect.get(target, key);

      // TODO 依赖收集
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);

      // TODO 触发依赖
      return res;
    },
  });
}