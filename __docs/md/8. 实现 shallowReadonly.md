# 实现 shallowReadonly 功能

在本小节中，我们将会实现 shallowReadonly 功能

## 1. happy path 测试样例

```ts
it('happy path', () => {
    const original = { bar: { foo: 1 } }
    // shallow 的意思是浅的，默认 readonly 是嵌套的，而 shallowReadonly 刚好相反
    const shallow = shallowReadonly(original)
    expect(isReadonly(shallow)).toBe(true)
    expect(isReadonly(shallow.bar)).toBe(false)
})
```

## 2. shallowReadonly 的实现

```ts
// reactive.ts

// other code ...

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers)
}
```

```ts
// baseHandlers

// other code ...

const shallowReadonlyGet = createGetter(true, true)

// 参数加上 shallow
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // other code ...
      
    // 如果是 shallow ，直接 return res 即可
    if (shallow) return res
		
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    if (!isReadonly) {
      track(target, key)
    }
    return res
  }
}


// 这里我们发现 shalloReadonlyHandlers 和 readonly 的 set 一样
// 就可以复制一份，复写 get 就好了
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
})

```

这样我们再跑测试就可以通过了