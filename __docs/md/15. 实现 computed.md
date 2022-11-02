# 实现 computed

在本小节中，将会实现 computed

## 1. happy path

先看测试

```ts
it('happy path', () => {
    const user = reactive({
        age: 1,
    })

    const age = computed(() => {
        return user.age
    })

    expect(age.value).toBe(1)
})
```

接下来我们看如何实现

```ts
class ComputedRefImpl {
    private _getter: any
    constructor(getter) {
        this._getter = getter
    }
    get value() {
        // 在调用 value 时将传入的 getter 的执行结果返回
        return this._getter()
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}
```

## 2. 缓存机制

我们来看看测试样例

```ts
 it('should computed lazily', () => {
     const value = reactive({ foo: 1 })
     const getter = jest.fn(() => value.foo)
     const cValue = computed(getter)

     // lazy
     expect(getter).not.toHaveBeenCalled()
     // 触发 get 操作时传入的 getter 会被调用一次
     expect(cValue.value).toBe(1)
     expect(getter).toHaveBeenCalledTimes(1)

     // 不会再次调用 computed
     cValue.value
     expect(getter).toHaveBeenCalledTimes(1)
 })
```

这里我们发现，再次读取 cValue.value 的时候是不会再次去计算的，而是拿的缓存。

```ts
class ComputedRefImpl {
  private _getter: any
  // _value 缓存值
  private _value: any
  // _dirty 是否需要更新值
  private _dirty = false
  constructor(getter) {
    this._getter = getter
  }
  get value() {
    // 这里进行判断，如果还未初始化，执行 getter，缓存一份
    if (this._dirty) {
      this._value = this._getter()
      this._dirty = false
    }
    // 这里就直接返回缓存
    return this._value
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}
```

接下来，我们来看看进阶版的

```ts
// 在不需要这个 computed 的时候 value 变了 computed 也不会执行
value.foo = 2
expect(getter).toHaveBeenCalledTimes(1)

// 在需要这个 computed 的时候再次计算（如果 computed 依赖的值已经发生更改）
expect(cValue.value).toBe(2)
expect(getter).toHaveBeenCalledTimes(2)

// 不变拿的就是缓存
cValue.value
expect(getter).toHaveBeenCalledTimes(2)
```

其实现在我们就已经有了思路了，为什么不执行 getter 是因为我们加了一把锁 `_dirty`，那么只需要在依赖的值所发生的改变的时候将这个 `_dirty = false` 就可以了，那么再次 get value 的时候就会因为锁打开了而重新执行并计算值

我们知道依赖的值发生改变的时候其实是进入了 `trigger` 方法里面，而 `trigger` 中有一个判断条件，那就是如果 ReactiveEffect option 有 `scheduler` 的话，是会执行 `scheduler` 而不是 `execution`，那么我们就可以通过这个 `scheduler` 做文章了。

那么现在问题又来了，`scheduler` 是存在 `EeactiveEffect` 实例上的，而该类是在 `effect` 中创建实例的，所以我们的 `computed` 其实也需要自己维护一个 effect，相当于把 getter 作为 effect。

```ts
import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _getter: any
  private _value: any
  private _dirty = false
  private _effect: any
  constructor(getter) {
    this._getter = getter
    // 这里需要内部维护一个 ReactiveEffect 实例
    this._effect = new ReactiveEffect(getter, {
      scheduler: () => {
        // 在 scheduler 中把锁打开
        this._dirty = true
      },
    })
  }
  get value() {
    // 因为在依赖值更新的时候会进行 triiger， triiger 调用 scheduler，锁打开了
    // 再次 get value，因为锁是打开的，就可以重新计算值了
    if (this._dirty) {
      this._value = this._effect.run()
      this._dirty = false
    }
    return this._value
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}
```

这样我们的测试就跑通了