# 实现 Fragment 节点和 Text 节点

## 1. Fragment 节点

### 1.1 例子

我们在上一篇中已经实现了 slots，但是我们再向 slots 添加内容的时候，发现如果添加的内容超过了 1 个，最终还是要通过一个 `div` 包裹这两个元素的，这是为什么呢？

```ts
import { h } from '../h'

export function renderSlots(slots, name = 'default', props) {
  const slot = slots[name]
  if (slot) {
    // 我们在 renderSlots 的时候就使用了 div 作为包裹
    // 这是因为我们没办法将 array 直接渲染出来
    return h('div', {}, slot(props))
  }
}
```

下面我们改如何实现呢？

```ts
// render.ts

// other code ...

export function patch(vnode, container) {
  // 我们在 patch 的时候对类型进行判断
  // 这个时候我们可以添加一个 Fragment 类型，来对 Fragment 进行判断
  const { shapeFlags } = vnode
  if (shapeFlags & ShapeFlags.ELEMENT) {
    processElement(vnode, container)
  } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container)
  }
}

// other code ...
```

### 1.2 实现

首先，我们可以在 renderSlots 的时候从生成 div 到生成 Fragment

```ts
export function renderSlots(slots, name = 'default', props) {
  // 此时 slots 就是 Object
  const slot = slots[name]
  if (slot) {
    // 从 div -> Fragment
    return h('Fragment', {}, slot(props))
  }
}
```

为了避免与用户的组件重名，我们可以生成一个 Symbol

```ts
// vnode.ts
export const Fragment = Symbol('Fragment')
```

```ts
import { Fragment } from '../vnode'

export function renderSlots(slots, name = 'default', props) {
  const slot = slots[name]
  if (slot) {
    // 从 'Fragement' -> Symbol
    return h(Fragment, {}, slot(props))
  }
}
```

这样我们在 patch 的时候就可以对类型进行判断了

```ts
// render.ts

export function patch(vnode, container) {
  const { type, shapeFlags } = vnode
  switch (type) {
    // 对类型进行判断
    // 如果是 Fragement
    case Fragment:
      // 走 processFragment 的逻辑
      processFragment(vnode, container)
      break
    default:
      if (shapeFlags & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
      } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
      }
      break
  }
}


function processFragment(vnode, container) {
  // 因为 fragment 就是用来处理 children 的
  mountChildren(vnode, container)
}
```

现在我们 slots 多个子节点就不再需要使用 div 来包裹了

## 2. Text 节点

我们的 slots 目前也不支持直接渲染一个 TextContent 节点

### 2.1 例子

```ts
const foo = h(
    Foo,
    {},
    {
        header: ({ count }) => h('div', {}, '123' + count),
        // 渲染一个节点是无法进行渲染的
        footer: () => 'hello TextNode',
    }
)
```

所以我们需要新增一个 API，用户创建纯 TextNode

```ts
footer: () => createTextVNode('hello TextNode'),
```

### 2.2 实现

我们在 VNode 中来实现这个 API

```ts
// vnode.ts

export const TextNode = Symbol('TextNode')

export function createTextVNode(text) {
  return createVNode(TextNode, {}, text)
}
```

在 render 中也要修改为对应的逻辑

```ts
export function patch(vnode, container) {
  const { type, shapeFlags } = vnode
  switch (type) {
    case Fragment:
      processFragment(vnode, container)
      break
    // 新增这个判断
    case TextNode:
      processTextNode(vnode, container)
      break
    default:
      if (shapeFlags & ShapeFlags.ELEMENT) {
        processElement(vnode, container)
      } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
      }
      break
  }
}
```

```ts
function processTextNode(vnode, container) {
  // TextNode 本身就是纯 text
  const element = (vnode.el = document.createTextNode(vnode.children))
  container.appendChild(element)
}
```

现在我们也已经支持 TextNode 了。