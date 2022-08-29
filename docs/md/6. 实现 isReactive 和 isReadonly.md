# 实现 isReactive 和 isReadonly

在本小节中，我们将会实现 isReactive 和 isReadonly 这两个 API

## 1. isReactive 测试样例

```ts
// reactive.spec.ts
it('happy path', () => {
    // other code ...
    // 加入 isReactive 判断
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
})
```

## 2. isReactive 实现

这个该如何实现呢，其实也是非常简单的：

```ts
// reactive.ts

// other code ...

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

// other code ...

export function isReactive(raw) {
  // 这里为什么需要取反，这是因为如果是一个 original Object 的话，是不会进入 proxy getter 的
  // 这里的就会返回一个 undefined，双重取反强制转换为 boolean
  return !!raw[ReactiveFlags.IS_REACTIVE]
}
```

测试之后就跑通了

## 3. isReadonly 测试样例

```ts
// readonly.spec.ts
it('happy path', () => {
    // other code ...

    // [isReadonly]
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
})
```

## 4. isReadonly 实现

这个实现也是很简单的，仿照 isReactive 的实现：

```ts
// reacive.ts

// other code ...

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  // 添加枚举
  IS_READONLY = '__v_isReadonly',
}

// other code ...


// 添加 API
export function isReadonly(raw) {
  return !!raw[ReactiveFlags.IS_READONLY]
}
```

```ts
// baseHandlers.ts

// other code ...

function createGetter(isReadonly = false) {
  return function get(target, key, receiver) {
    // 进行判断
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }
    // other code ...
  }
}

// other code ...
```

这个时候再进行测试发现就可以通过了

