# 实现 effect 的 stop 功能

在本小节中，我们去实现 effect 的 stop 功能

## 1. stop 的测试样例

```ts
it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
        dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    // stop 一个 runner 之后
    stop(runner)
    obj.prop++
    // 依赖再次更新，当时传入的 effect 则不会重新执行
    expect(dummy).toBe(2)
    // runner 不受到影响
    runner()
    expect(dummy).toBe(3)
})
```

通过一个测试样例，我们发现其实也是非常简单的

## 2. 实现 stop

首先，我们知道所有的 effect 存在 deps 中，也就是我们的 effects 是在 `track` 方法进行保存的，那么如果不想让这个 effect 执行，就可以找到 target - key 对应的 deps 中，删除掉我们的 effect 即可。

首先，我们在 ReactiveEffect 实例中去记录我们反向对应的 deps

### 2.1 v1

```ts
// effect.ts 

class ReactiveEffect {
  // [stop] 反向记录自己对应的 dep 那个 set
  deps = []
  // other code 
}


export function track(target, key) {
  // other code ...
  dep.add(activeEffect)
  // [stop]：反向追踪 activeEffect 的 dep
  // 因为一个 activeEffect 可能会对应多个 dep，每个 dep 是一个 set
  // 这里我们可以使用一个数组
  activeEffect.deps.push(dep)
}
```

然后我们可以去实现一个 stop 的实例方法

```ts
class ReactiveEffect {
  // other code ...
  // [stop] 这个方法的作用就是去根据 this.deps 删除 this 对应的 effect
  stop() {
    this.deps.forEach((dep: any) => {
      dep.delete(this)
    })
  }
}
```

这样我们就可以去实现一个 stop 方法了

```ts
export function stop(runner) {
  // [stop] 如何获取到当前所属的 effect 实例呢？
  // 这样就可以去调用 stop 方法了
  runner.effect.stop()
}


export function effect(fn, options: any = {}) {
  // other code 
  const runner: any = _effect.run.bind(_effect)
  // [stop] 在这里挂载一下所属的 effect
  runner.effect = _effect
  return runner
}
```

### 2.2 v2

但是我们在运行完单测后会出现问题，这是因为如果使用上面的方法的话，会存在重复收集的问题，例如我们在 stop 后，此时所属的 effect 其实已经清空过了，但是下面我们又对依赖项进行了 getter，也就是 track，那么就会再次将所属的 track 收集起来，那么 stop 删除的元素就等于是重新就加回来了，所以我们需要修改一下代码，加一个状态；

```ts
class ReactiveEffect {
  // [stop] 该 effect 是否调用过 stop 方法了
  // true 未调用 false 调用
  active = true
  
  stop() {
    // 如果没调用这个方法，去清空所属的 effect
    if (this.active) {
      this.deps.forEach((dep: any) => {
        dep.delete(this)
      })
      this.active = false
    }
  }
}


// track 的代码也要改一下

export function track(target, key) {
  // 如果该 activeEffect 还没有调用 stop 方法的时候，再去添加依赖和反向收集依赖
  if (activeEffect.active) {
    activeEffect.deps.push(dep)
    dep.add(activeEffect)
  }
}
```

此时我们再去运行单元测试发现就没问题了

后面我们就可以去优化了，例如将删除依赖的函数作为单独的函数

```ts
class ReactiveEffect {
  stop() {
    cleanupEffect(this)
  }
}

// 把清除的逻辑单独作为函数
function cleanupEffect(effect) {
  if (effect.active) {
    effect.deps.forEach((dep: any) => {
      dep.delete(effect)
    })
    effect.active = false
  }
}
```

## 3. onStop 的测试样例

```ts
it('onStop', () => {
    const obj = reactive({
        foo: 1,
    })
    const onStop = jest.fn()
    let dummy
    // onStop 是一个函数，也是 effect 的 option
    const runner = effect(
        () => {
            dummy = obj.foo
        },
        {
            onStop,
        }
    )
    // 在调用 stop 的时候，onStop 也会执行
    stop(runner)
    expect(onStop).toBeCalledTimes(1)
})
```

## 4. 实现 onStop

```ts
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options)
  // [stop] 这里我们 options 会接收一个 onStop 方法
  // 其实我们可以将 options 中的所有数据全部挂载在 effect 上面
  // extend = Object.assign 封装一下是为了语义化更好
  extend(_effect, options)
  // other code ...
}
```

```ts
// ./src/shared/index.ts

export const extend = Object.assign
```

今后该项目中全局可用的工具函数可以放在 `shared` 目录下，这个也是为了与 `Vue` 的开发方式贴近

然后在清除的函数中去判断并执行

```ts
function cleanupEffect(effect) {
  if (effect.active) {
    effect.deps.forEach((dep: any) => {
      dep.delete(effect)
    })
    // [onStop] 如果存在 onStop，就去运行 onStop
    if (effect.onStop) effect.onStop()
    effect.active = false
  }
}
```

跑一下测试，发现也是可以通过的

## 5. 修复 happy path bug

这个时候我们再全局跑一下所有测试，发现在 `effect` 的 happy path 中出现了错误

```ts
export function track(target, key) {
  // 这一行找不到 activeEffect
  if (activeEffect.active) {
    activeEffect.deps.push(dep)
    dep.add(activeEffect)
  }
}
```

改成下面这样就可以了

```ts
if (activeEffec && activeEffect.active) {
    activeEffect.deps.push(dep)
    dep.add(activeEffect)
}
```

