# 实现 effect 返回 runner

在本小节中，我们将会实现 effect 返回 runner

## 1. 测试样例

```ts
it('runner', () => {
    // runner 就是 effect(fn) 返回一个函数，执行该函数就相当于重新执行了一次传入 effect 的 fn
    // 同时执行 runner 也会将 fn 的返回值返回
    let foo = 1
    const runner = effect(() => {
        foo++
        return 'foo'
    })
    expect(foo).toBe(2)
    // 调用 runner
    const r = runner()
    expect(foo).toBe(3)
    // 获取 fn 返回的值
    expect(r).toBe('foo')
})
```

## 2. 实现

这个该如何实现呢？其实也是非常简单的：

```ts
// effect.ts
class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
  }
  run() {
    activeEffect = this
    const res = this._fn()
    // [runner] return 运行的值
    return res
  }
}

// other code ...


export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  // [runner]: 在这里将 run 方法 return 出去
  // 但是要注意 this 指向问题，所以可以 bind 后 return 出去
  return _effect.run.bind(_effect)
}
```

再次测试一下，测试样例就可以通过了