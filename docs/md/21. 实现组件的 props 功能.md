# 实现组件的 props

## 1. 实现挂载一个组件

我们在进行 render 的时候，还可以挂载一个组件

```ts
// Foo.js
import { h } from '../../lib/mini-vue.esm.js'

export const Foo = {
  setup(props) {},
  render() {
    return h('div', {}, 'Hello World')
  },
}
```

```ts
// App.js
render() {
    return h(
      'div',
      {
        class: 'red', // event
        onClick() {
          console.log('click')
        },
        onMousedown() {
          console.log('mousedown')
        },
      },
      [
        // 挂载一个组件
        h(Foo, { class: 'blue' }),
      ]
    )
  },
```

通过测试我们发现，我们之前写的代码其实是支持挂载一个组件的，我们再来复习一个 render 的调用流程：

- `createApp`

- `mount`

- 创建 App.js 的 VNode，并调用 render 方法来挂载这个 VNode

- 进入 `render` 方法，调用 `patch`

- 进入 `patch` 方法，首先需要判断一下此时 App.js 组件的类型，是一个 statefulComponent

- 进入 `processComponent` 方法，进入`mountComponent` 方法，创建 App.js 的组件实例

- 进入 `setupComponent`，传入组件实例

- 在这里进行初始化 `setupStatefulComponent`，处理 setup

- `finishSetup`，将 component 的 render 挂载到 instance 的 render

- 调用 `instance.render` 返回 VNode 树

- 再次进入 `patch` 逻辑，此时我们的 VNode 已经是 element 了

- 进行 patchElement，此时对 children 再次递归 patch

- 如果某个 child 是 component，那么就可以进行挂载了

- 所以这样就可以来挂载一个组件了。

## 2. 实现挂载 props

首先，一个组件的 setup 可以传入一个参数，该参数就是 props

```ts
import { h } from '../../lib/mini-vue.esm.js'

export const Foo = {
  // setup 第一个参数是 props
  setup(props) {
    console.log(props)
  },
  render() {
    return h('div', {}, 'Hello World')
  },
}
```

那么这里的 props 是在哪里传入的呢？是在父组件的 render 的时候传递的

```ts
return h(
      'div',
      {},
      [
        // 第二个参数就是 props
        h(Foo, { count: 1 }),
      ]
    )
```

那么我们该如何实现呢？首先，我们在处理 h 的时候就是 createVNode，第二个参数会被挂载到 vnode 实例的 props 属性。那我们又是在哪里进行处理 statefulComponent 的呢？

```ts
// components.ts

export function setupComponent(instance) {
  // 在这里进行处理 props，此时传入 instance，instance.vnode.props
  initProps(instance, instance.vnode.props)
  setupStatefulComponent(instance)
}
```

```ts
// componentProps
export function initProps(instance, rawProps) {
  // 在这里先处理 props 的情况
  // 因为某些组件可能没有 props，所以要给一个默认值
  instance.props = rawProps || {}
  // TODO attrs
}
```

在调用 component.setup 的时候调用传入 props 参数

```ts
function setupStatefulComponent(instance) {
  const component = instance.vnode.type
  // other code ...
  const { setup } = component
  if (setup) {
    // 在这里将 instance.props 传入
    const setupResult = setup(instance.props)
    handleSetupResult(instance, setupResult)
  }
}
```

这样我们就可以获取 props上了。

## 3. props 挂载到 this 中

```ts
import { h } from '../../lib/mini-vue.esm.js'

export const Foo = {
  setup(props) {
    console.log(props)
  },
  render() {
    // props 也会被挂载到 this 中
    return h('div', {}, 'counter: ' + this.count)
  },
}
```

还记得之前我们是如何将 setup 返回值挂载到 props 中的嘛？

```ts
export const componentPublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance
    // 在这里挂载 setupState
    // 此时我们还可以进行判断
    if(key in setupState){
      return setupState[key]
    }
    const publicGetter = PublicProxyGetterMapping[key]
    if(publicGetter){
      return publicGetter(instance)
    }
  },
}
```

```ts
export const componentPublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance
    // 在这里也可以对 props 进行判断
    if(key in setupState){
      return setupState[key]
    }else if(key in props) {
      return props[key]
    }
    const publicGetter = PublicProxyGetterMapping[key]
    if(publicGetter){
      return publicGetter(instance)
    }
  },
}
```

那么我们就可以将重复的部分抽离出来了

```ts
// shared/index.ts
export function hasOwn(target, key) {
  return Reflect.has(target, key)
}
```

```ts
export const componentPublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance
    // 将重复的部分抽离出来
    if(hasOwn(setupState, key)){
      return Reflect.get(setupState, key)
    }else if(hasOwn(props, key)) {
      return Reflect.get(setupState, key)
    }
    const publicGetter = PublicProxyGetterMapping[key]
    if(publicGetter){
      return publicGetter(instance)
    }
  },
}
```

然后我们再次测试一下，发现也是没有问题的

## 4. props 是 readonly 的

最后，props 是不可以被修改的，那么这个该怎么实现呢？还记得我们在 reactivity 的模块中 readonly 和 shallowReadonly 嘛？这里只需要包一层就可以了，所以需要用 shallowReadonly 来包一层

```ts
// component.ts
function setupStatefulComponent(instance) {
    // other code ...
    // 传入的 setup 用 shallowReadonly 包一层
    const setupResult = setup(shallowReadonly(instance.props))
}
```

我们测试一下

```ts
import { h } from '../../lib/mini-vue.esm.js'

export const Foo = {
  setup(props) {
    console.log(props)
    props.count++
    console.log(props)
  },
  render() {
    return h('div', {}, 'counter: ' + this.count)
  },
}
```

发现没有问题，props 的值是无法改变的

