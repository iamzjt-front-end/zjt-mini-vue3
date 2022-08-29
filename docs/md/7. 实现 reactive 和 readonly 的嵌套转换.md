# 实现 reactive 和 readonly 的嵌套转换

在本小节中，我们将会实现 reactive 和 readonly 的嵌套转换功能

## 1. reactive 嵌套转换单元测试

```ts
it('nested reactive', () => {
    const original = {
        nested: { foo: 1 },
        array: [{ bar: 2 }],
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
})
```

## 2. 实现 reactive 嵌套

```ts
// baseHandlers.ts


function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    // other code ...
      
      
    const res = Reflect.get(target, key, receiver)
    // [嵌套转换]
    // 在 shared 中写一个工具函数 isObject 用于判断是否是对象
    if (isObject(res)) {
      return reactive(res)
    }
	
    // other code ...
  }
}
```

```ts
// shared/index.ts

export function isObject(val) {
  return val !== null && typeof val === 'object'
}
```

这样测试就可以跑通了

## 3. readonly 嵌套测试样例

```ts
it('should readonly nested object', () => {
    const nested = { foo: { innerFoo: 1 }, bar: [{ innerBar: 2 }] }
    const wrapped = readonly(nested)
    expect(isReadonly(wrapped.foo)).toBe(true)
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReadonly(wrapped.bar[0])).toBe(true)
})
```

## 4. readonly 嵌套实现

```ts
// 改一下即可

// baseHandlers.ts

if (isObject(res)) {
    return isReadonly ? readonly(res) : reactive(res)
}
```

