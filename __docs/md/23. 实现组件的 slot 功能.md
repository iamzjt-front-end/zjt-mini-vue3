# 实现组件的 slot 功能

在本小节中，我们将会实现组件的 slot 功能

## 1. 什么是 slot

我们先看看最简单的 h 函数中的 slot 是什么样子的

```ts
import { h } from '../../lib/mini-vue.esm.js'
import { Foo } from './Foo.js'

export default {
  render() {
    // 我们在渲染一个组件的时候，向第 3 个函数挂载 h
    return h('div', {}, [h(Foo, {}, h('div', {}, '123'))])
  },
  setup() {},
}
```

```ts
import { h } from '../../lib/mini-vue.esm.js'

export const Foo = {
  setup() {},
  render() {
    // 我们可以在这里通过 `this.$slots` 进行接收到挂载的 $slots
    return h('div', {}, this.$slots)
  },
}
```

类似于模板中的这样

```html
<Foo>
  <div>123</div>
</Foo>
```

## 2. 实现 slots

### 2.1 实现

通过对示例的研究，我们发现其实 slots 就是 component 的第三个参数

首先，我们在创建 `component` 实例的时候初始化一个 slots

```ts
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    // 初始化 slots
    slots: {},
  }
  component.emit = emit.bind(null, component) as any
  return component
}
```

在 `setupComponent` 的时候进行处理 slots

```ts
export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  // 处理 slots
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}
```

```ts
// componentSlots.ts

export function initSlots(instance, slots) {
  // 我们这里最粗暴的做法就是直接将 slots 挂载到 instance 上
  instance.slots = slots
}
```

然后我们在拦截操作的时候加入对于 `$slots` 的处理

```ts
import { hasOwn } from '../shared/index'

const PublicProxyGetterMapping = {
  $el: i => i.vnode.el,
  // 加入对于 $slots 的处理
  $slots: i => i.slots,
}

// other code ...
```

现在我们就已经可以来实现挂载 slots 了。

### 2.2 优化

现在我们已经实现如何挂载 slots 了，但是如果我们传递多个 slots 呢？

模板中是这样

```ts
<Foo>
  <div>123</div>
  <div>456</div>
</Foo>
```

在 h 函数中是这样的：

```ts
render() {
    return h('div', {}, [
        // 可以传递一个数组
        h(Foo, {}, [h('div', {}, '123'), h('div', {}, '456')]),
    ])
}
```

我们再来看看接收 slots 的地方是怎么写的：

```ts
render() {
    const foo = h('p', {}, 'foo')
    // 第三个参数只能接收 VNode，但是这里我们的 this.$slots 是一个数组
    // 所以就无法渲染出来
    // 这个时候就可以创建一个 VNode
    return h('p', {}, [foo, this.$slots])
},
```

```ts
return h('p', {}, [foo, h('div', {}, this.$slots)])
```

我们可以将这里的渲染 slots 抽离出来，例如我们抽离一个函数叫做 `renderSlots`

```ts
// runtime-core/helpers/renderSlots

import { h } from '../h'

export function renderSlots(slots) {
  return h('div', {}, slots)
}
```

```ts
return h('p', {}, [foo, renderSlots(this.$slots)])
```

现在数组的形式已经可以实现了，但是单个的形式我们却无法实现了，所以我们需要改一下，我们是在 `initSlots` 的时候进行挂载 slots 的，我们进行一个判断，判断默认都是数组。

```ts
export function initSlots(instance, slots) {
  // 进行类型判断
  slots = Array.isArray(slots) ? slots : [slots]
  instance.slots = slots
}
```

OK，现在我们无论是数组还是单个都可以实现了。

## 3. 具名 slots

我们在给定 slots 时，还可以给定名字。

### 3.1 例子

我们来看看一个具名插槽的例子

在模板中是这样的：

```html
<Foo>
  <template v-slot:header></template>
  <template v-slot:bottom></template>
</Foo>
```

在 h 函数中是这样的

```ts
const foo = h(
    Foo,
    {},
    {
        header: h('div', {}, '123'),
        footer: h('div', {}, '456'),
    }
)
return h('div', {}, [app, foo])
```

我们在接收 slots 的时候是如何接收的呢？`renderSlots` 第二个参数可以指定 name

```ts
return h('p', {}, [
    renderSlots(this.$slots, 'header'),
    foo,
    renderSlots(this.$slots, 'footer'),
])
```

### 3.2 实现

首先，我们在挂载的时候就从数组变成了对象。但是在这里我们还是要进行两次判断，第一个判断如果传入的是简单的值，那么就视为这个是 `default`。如果传入的是对象，那么再具体判断

```ts
function initObjectSlots(instance, slots) {
  if(!slots) return
  // 单独传了一个 h
  if (slots.vnode) {
    instance.slots.default = [slots]
    return
  }
  // 传了一个数组
  if (Array.isArray(slots)) {
    instance.slots.default = slots
    return
  }
  // 传了一个对象
  for (const slotName of Object.keys(slots)) {
    instance.slots[slotName] = normalizeSlots(slots[slotName])
  }
}

function normalizeSlots(slots) {
  return Array.isArray(slots) ? slots : [slots]
}
```

然后我们在渲染 `slots` 的时候，也要对多个类型进行判断

```ts
export function renderSlots(slots, name = 'default') {
  // 此时 slots 就是 Object
  const slot = slots[name]
  if (slot) {
    return h('div', {}, slot)
  }
}
```

好了，现在我们的具名插槽就也已经支持了。

## 4. 作用域插槽

### 4.1 例子

在 template 中，作用域插槽是这样的

注册方

```html
<slot :count="1"></slot>
```

使用方

```ts
<template #default="{count}">{{count}} 是 1</template>
```

在 h 函数中是这样的

注册方

```ts
return h('p', {}, [
    // 第三个参数就是 props
    renderSlots(this.$slots, 'header', {
        count: 1,
    }),
    foo,
    renderSlots(this.$slots, 'footer'),
])
```

使用方

```ts
const foo = h(
    Foo,
    {},
    {
        // 这样我们的 slots 就变成一个函数了
        header: ({ count }) => h('div', {}, '123' + count),
        footer: () => h('div', {}, '456'),
    }
)
```

### 4.2 实现

首先，在注册的时候，第三个参数是 props，而我们的 slots 也变成了函数

```ts
export function renderSlots(slots, name = 'default', props) {
  // 此时 slots 就是函数
  const slot = slots[name]
  if (slot) {
    return h('div', {}, slot(props))
  }
}
```

在初始化的时候

```ts
// other code...

function initObjectSlots(instance, slots) {
  // other code ...
  for (const slotName of Object.keys(slots)) {
    // 在这里的时候，我们通过 `slots[slotName]` 来获取到 slot 对应的值
    // 但是现在我们对应的值已经变成了函数，所以需要调用 `slots[slotName]()`
    // 但是我们在 render 时候，会将这一段整体作为一个函数进行调用
    // 所以结合上面我们的 `renderSlots`，就变成了这样
    // props => normalizeSlots(slots[slotName](props))
    instance.slots[slotName] = props => normalizeSlots(slots[slotName](props))
  }
}

// other code...
```

现在我们也已经支持作用域插槽了。