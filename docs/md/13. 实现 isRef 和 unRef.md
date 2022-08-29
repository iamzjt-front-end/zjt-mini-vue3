# 实现 isRef 和 unRef

在本小节中，我们将会去实现 isRef 和 unRef

## 1. isRef

我们先看测试样例

```ts
it('isRef', () => {
    expect(isRef(1)).toBe(false)
    expect(isRef(ref(1))).toBe(true)
    expect(isRef(reactive({ foo: 1 }))).toBe(false)
})
```

这个实现起来就非常简单，只需要给其一个标识即可

```ts
const enum RefFlags {
  IS_REF = '__v_isRef',
}

class RefImpl {
  // other code ...
  constructor(value) {
    this._value = isObject(value) ? reactive(value) : value
    // 给其一个标识
    this[RefFlags.IS_REF] = true
  }
  // other code ...
}

export function isRef(ref) {
  return !!ref[RefFlags.IS_REF]
}
```

## 2. unRef

先看测试样例

```ts
it('unRef', () => {
    expect(unRef(ref(1))).toBe(1)
    expect(unRef(1)).toBe(1)
})
```

实现：

```ts
export function unRef(ref) {
  return ref[RefFlags.IS_REF] ? ref.value : ref
}
```

这样测试就跑过了