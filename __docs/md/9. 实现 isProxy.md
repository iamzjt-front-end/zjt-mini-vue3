# 实现 isProxy

## 1. 单测

这里就不放了，简单来说，isProxy 可以检测某个对象是否是由 `reactive` 和 `readonly` 创建出来的

## 2. 实现

```ts
// reactive.ts

export function isProxy(wrapped) {
  return isReactive(wrapped) || isReadonly(wrapped)
}
```

这样就非常简单的实现了