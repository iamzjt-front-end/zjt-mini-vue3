# 实现 proxyRefs

## 1. get

先看测试样例

```ts
it('proxyRef', () => {
    const foo = {
        bar: ref(1),
        baz: 'baz',
    }

    // get
    const proxyFoo = proxyRefs(foo)
    expect(foo.bar.value).toBe(1)
    expect(proxyFoo.bar).toBe(1)
})
```

这里我们看通过 proxyRefs 包装一个对象，那么该对象的属性如果存在 ref，那么就自动 unRef，既然是一个对象，我们就可以用到 proxy

```ts
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      // 自动 unRef
      return unRef(Reflect.get(target, key, receiver))
    },
  })
}
```

## 2. set

```ts
proxyFoo.bar = 10
expect(proxyFoo.bar).toBe(10)
expect(foo.bar.value).toBe(10)

proxyFoo.bar = ref(20)
expect(proxyFoo.bar).toBe(20)
expect(foo.bar.value).toBe(20)
```

我们可以看到，set 是分为两种情况的，可能是一个 ref，也可能是一个原始值

```ts
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      // other code ...
    },
    set(target, key, value, receiver) {
      // set 分为两种情况，如果原来的值是 ref，并且新的值不是 ref
      // 那么就去更新原来的 ref.value = newValue
      // 第二种情况就是原来的值是 ref，newValue 也是一个 ref
      // 那么就直接替换就 OK 了
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value)
      } else {
        return Reflect.set(target, key, value, receiver)
      }
    },
  })
}
```

这样测试就可以跑通了