# 实现 ref

在本小节中，我们将会实现 ref

## 1. happy path

```ts
it('happy path', () => {
    const refFoo = ref(1)
    expect(refFoo.value).toBe(1)
})
```

下面我们去实现

```ts
// ref.ts
export function ref(value) {
  return { value }
}
```

## 2. ref 应该是响应式

```ts
it('ref should be reactive', () => {
    const r = ref(1)
    let dummy
    let calls = 0
    effect(() => {
        calls++
        dummy = r.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    r.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
})
```

通过对 ref 的说明，我们发现 ref 传入的值大多数情况下是一个原始值。那么我们就不能通过 Proxy 的特性来对值进行封装了，这个时候我们可以采用 class getter setter 的方式来进行实现收集依赖和触发依赖

### 3.1 happy path 通过 class 实现

```ts
class RefImpl {
  private _value: any
  constructor(value) {
    this._value = value
  }
  get value() {
    return this._value
  }
}

export function ref(value) {
  return new RefImpl(value)
}
```

我们先把 happy path 通过 class 的方式实现

### 3.2 实现响应式

这里我们要响应式其实还是和 reactive 的套路是一样的，在 get 中收集依赖，在 set 中触发依赖。这个时候我们就可以去复用 reactive 的 track 逻辑了。

```ts
// 我们先看看现在 track 的逻辑

export function track(target, key) {
  if (!isTracking()) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  if (dep.has(activeEffect)) return
  activeEffect.deps.push(dep)
  dep.add(activeEffect)
}
```

其实有很多是无法通用的，下面的收集依赖的逻辑我们就可以单独抽离出来了

```ts
export function track(target, key) {
  if (!isTracking()) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  trackEffect(dep)
}

// 抽离函数
export function trackEffect(dep) {
  if (dep.has(activeEffect)) return
  activeEffect.deps.push(dep)
  dep.add(activeEffect)
}
```

而 trigger 呢？

```ts
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  for (const effect of deps) {
    if (effect.options.scheduler) {
      effect.options.scheduler()
    } else {
      effect.run()
    }
  }
}
```

同理，我们也可以将 trigger 单独的部分抽离出来，在重构了一个模块后，需要重新运行一遍测试，查看是否功能正常

```ts
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  triggerEffect(deps)
}

export function triggerEffect(deps) {
  for (const effect of deps) {
    if (effect.options.scheduler) {
      effect.options.scheduler()
    } else {
      effect.run()
    }
  }
}
```

最后，我们就可以在 ref 中

```ts
class RefImpl {
  private _value: any
  // 这里我们也需要一个 deps Set 用于储存所有的依赖
  public deps = new Set()
  constructor(value) {
    this._value = value
  }
  get value() {
    // 在 get 中进行依赖收集
    trackEffect(this.deps)
    return this._value
  }
  set value(newValue) {
    this._value = newValue
    // 在 set 中进行触发依赖
    triggerEffect(this.deps)
  }
}
```

这样我们再去运行测试发现就可以通过了

### 3.3 相同的值不会触发依赖

```ts
r.value = 2
expect(calls).toBe(2)
expect(dummy).toBe(2)
```

这个实现方法也非常简单:

```ts
class RefImpl {
  // other code ...
  set value(newValue) {
    // 在这里进行判断
    if (newValue === this._value) return
    // other code ...
  }
}
```

其实这里的判断我们可以写一个工具函数：

```ts
// shared/index.ts
export function hasChanged(val, newVal) {
  return !Object.is(val, newVal)
}
```

```ts
class RefImpl {
  // other code ...
  set value(newValue) {
    // 在这里用这个工具函数进行判断
    if (hasChanged(this._value, newValue)) {
      this._value = newValue
      triggerEffect(this.deps)
    }
  }
}
```

这个时候我们再进行测试发现就没有问题了

## 3. 嵌套 prop 应该是 reactive 的

我们先看看单元测试

```ts
it('should make nested properties reactive', () => {
    const a = ref({
        foo: 1,
    })
    let dummy
    effect(() => {
        dummy = a.value.foo
    })
    a.value.foo = 2
    expect(dummy).toBe(2)
    expect(isReactive(a.value)).toBe(true)
})
```

那这个我们该怎么实现呢？

```ts
class RefImpl {
  // other code ...
  constructor(value) {
    // 在这里进行一下判断，如果是 Object 的话，就对其进行 reacitve
    this._value = isObject(value) ? reactive(value) : value
  }
  // other code ...
}
```

下面我们再跑一下测试，就可以跑通了