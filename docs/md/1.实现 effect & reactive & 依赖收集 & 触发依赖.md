# 实现 effect & reactive & 依赖收集 & 触发依赖



在本小节呢，我们将实现 effect & reactive & 依赖收集 & 触发依赖

## 1. 编写单元测试

我们先建一个单元测试：

```js
describe('effect', () => {
  it('happy path', () => {
    const user = reactive({
      age: 10,
    })
    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    // update
    user.age++
    expect(nextAge).toBe(12)
  })
})
```

以上的单元测试，就是本文中重点需要通过的测试。在此之前，我们可以先去写一个 reactive API

## 2. reactive 实现

### 2.1 编写一个单元测试

```js
// 编写 reactive 的 happy path
describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    // 期望包装后和源对象不一样
    expect(observed).not.toBe(original)
    // 期望包装后某个属性的值和源对象一样
    expect(observed.foo).toBe(original.foo)
  })
})
```

那该如何实现呢？在这里我们就可以使用 Proxy + Reflect 来实现了

### 2.2 实现

```js
// 可以使用简单的 Proxy 来实现
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      return res
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)
      return res
    },
  })
}
```

运行一下 happy path，通过

## 3. effect 实现

下面，我们就回过头来看看最开始的单元测试，此时我们已经有了 reactive，接下来就是去实现一个 effect API。

### 3.1 v1 版本

首先，我们知道了 effect 接受一个参数，可以通过抽象一层：

```js
class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
  }
  run() {
    this._fn()
  }
}

export function effect(fn) {
  // 抽象一层
  const _effect = new ReactiveEffect(fn)
  // 去调用方法
  _effect.run()
}
```

此时我们 update 之前的逻辑就可以跑通了，下面的难点在于 update

### 3.2 v2 版本

这个版本，我们主要是用于解决 update 的问题，我们来看看测试，发现在 get 操作的时候需要将依赖收集，在 set 操作的时候再去触发这个依赖，下面我们就可以手动在 reactive 中添加相应的逻辑

```js
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      // 在 get 时收集依赖
      track(target, key)
      return res
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)
      // 在 set 时触发依赖
      trigger(target, key)
      return res
    },
  })
}
```

下面，我们就去编写一个 track 和 trigger

```js
// track 相关代码
class ReactiveEffect {
  // ...
  run() {
    // 保存一下当前的 activeEffect
    activeEffect = this
    this._fn()
  }
}

// 创建全局变量 targetMap
const targetMap = new WeakMap()
export function track(target, key) {
  // 我们在运行时，可能会创建多个 target，每个 target 还会可能有多个 key，每个 key 又关联着多个 effectFn
  // 而且 target -> key -> effectFn，这三者是树形的关系
  // 因此就可以创建一个 WeakMap 用于保存 target，取出来就是每个 key 对应这一个 depsMap，而每个 depsMap 又是一个 Set
  // 数据结构（避免保存重复的 effect）
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
  // 将 effect 加入到 set 中
  dep.add(activeEffect)
}

// 需要一个全局变量来保存当前的 effect
let activeEffect

export function effect(fn) {
  // ...
}
```

下面是 trigger

```js
export function trigger(target, key) {
  // trigger 的逻辑就更加简单了，我们只需要取出对应的 deps 这个 set，再遍历执行每个 effect 就可以了
  const depsMap = targetMap.get(target)
  const deps = depsMap.get(key)
  for (const effect of deps) {
    effect.run()
  }
}
```

现在我们再跑测试，就发现通过了，现在我们已经实现了 effect、reactive 的 happy path 了



