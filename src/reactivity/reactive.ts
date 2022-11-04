export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);

      // todo 依赖收集
      return res;
    },

    set(target, key, value) {
      const res = Reflect.set(target, key, value);

      // todo 触发依赖
      return res;
    }
  })
}
