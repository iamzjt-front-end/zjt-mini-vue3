# 实现 effect 的 scheduler 功能

在本小节中，我们将会实现 effect 的 scheduler 功能

## 1. 测试样例

我们先来看看测试样例

```ts
it('scheduler', () => {
    // 1. scheduler 作为 effect 的一个 option
    // 2. 有了 scheduler 之后原来的 fn 参数只会执行初始化的一次
    // 3. 如果依赖更新时不会执行 fn ，而是会去执行 scheduler
    // 4. runner 不受影响
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
        run = runner
    })
    const obj = reactive({ foo: 1 })
    // 在这里将 scheduler 作为一个 option 传入 effect
    const runner = effect(
        () => {
            dummy = obj.foo
        },
        { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    // 会执行一次 effect 传入的 fn
    expect(dummy).toBe(1)
    obj.foo++
    // 有了 scheduler 之后，原来的 fn 就不会执行了
    expect(scheduler).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)
    run()
    expect(dummy).toBe(2)
})
```

## 2. 实现 scheduler

```ts
class ReactiveEffect {
  private _fn: any
  // [scheduler] 构造函数加入 options，这里使用 public 可以供外部使用
  constructor(fn, public options) {
    this._fn = fn
  }
  // other code ...
}

// other code ...


export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  for (const effect of deps) {
    // [scheduler] 这里需要判断一下 scheduler，如果存在就去运行 scheduler 而不是 fn
    if (effect.options.scheduler) {
      effect.options.scheduler()
    } else {
      effect.run()
    }
  }
}


export function effect(fn, options: any = {}) {
  // [scheduler]在创建 ReactiveEffect 实例的时候，保存一下 options
  const _effect = new ReactiveEffect(fn, options)
  // other code ...
}
```

这样我们再运行单元测试，就可以通过了