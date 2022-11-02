# 实现 toRaw

在本小节中，我们将会实现 toRaw API

## 1. happy path

先看测试样例

```ts
it('happy path', () => {
    // toRaw 可以 return 通过 `reactive` 、 `readonly` 、`shallowReactive` 、`shallowReadonly` 包装的 origin 值
    const reactiveOrigin = { key: 'reactive' }
    expect(toRaw(reactive(reactiveOrigin))).toEqual(reactiveOrigin)
    const readonlyOrigin = { key: 'readonly' }
    expect(toRaw(readonly(readonlyOrigin))).toEqual(readonlyOrigin)
    const shallowReadonlyOrigin = { key: 'shallowReadonly' }
    expect(toRaw(shallowReadonly(shallowReadonlyOrigin))).toEqual(
        shallowReadonlyOrigin
    )
    const shallowReactiveOrigin = { key: 'shallowReactive' }
    expect(toRaw(shallowReactive(shallowReactiveOrigin))).toEqual(
        shallowReactiveOrigin
    )

    const nestedWrapped = {
        foo: { bar: { baz: 1 }, foo2: { bar: { baz: 2 } } },
    }
    expect(toRaw(reactive(nestedWrapped))).toEqual(nestedWrapped)
})
```

通过测试样例我们发现，toRaw 的作用就是将包装过的值的原始值返回回来，同时我们嵌套的值也要嵌套转换回来

```ts
// reactive.ts

// 创建 RAW 枚举
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw',
}


export function toRaw(observed) {
  // 这里就是嵌套转换了
  const original = observed && observed[ReactiveFlags.RAW]
  return isProxy(original) ? toRaw(original) : original
}
```

```ts
// baseHandlers


function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key === ReactiveFlags.RAW) {
      // 判断一下，如果访问的 key 是 ReactiveFlag.RAW，就直接返回就可以了
      return target
    }
    // other code ...
  }
}
```

