# 更新 component

在本小节中，我们将会实现更新 component 的逻辑

## 1. 例子

[查看例子](https://github.com/zx-projects/mini-vue/tree/main/example/componentUpdate)

### 1.1 代码补充

在例子中涉及到了一个问题，我们可以在 `render` 函数中获取到 `this.$props.xx` 来拿到父组件传给子组件的 prop。所以我们需要加一下：

```ts
// componentPublicInstance 

const PublicProxyGetterMapping = {
  $el: i => i.vnode.el,
  $slots: i => i.slots,
  // 加上一个 props
  $props: i => i.props,
}
```

## 2. 实现

### 2.1 现有逻辑的问题

现在我们直接用现有的代码来运行例子会发现，每次更新的时候都会重新渲染一下子组件，这是因为我们之前缩写的任何 update 逻辑都是对于 `element` 所做的处理，没有写 `compoent` 的处理逻辑。

```ts
// 因为 props 在父组件中，所以 props 更新会触发视图重新渲染
function setupRenderEffect(instance, vnode, container, anchor) {
  effect(() => {
    if (instance.isMounted) {
      // update 逻辑
      // 此时进入 patch
      patch(preSubTree, subTree, container, instance, anchor)
    } else {
      // init 逻辑
    }
  })
}
```

```ts
// 在 processComponent 中只有 mount 没有 update
function processComponent(vnode, container, parentInstance, anchor) {
  mountComponent(vnode, container, parentInstance, anchor)
}
```

### 2.2 更新组件的初步实现

所以我们需要加入 `update` 的逻辑

```ts
// 将 patch 中的 n1,n2 传过来，如果存在 n1，那么说明应该走 update 逻辑
function processComponent(n1, n2, container, parentInstance, anchor) {
  if (n1) {
    // update component
    updateComponent(n1, n2)
  } else {
    // init component
    mountComponent(n2, container, parentInstance, anchor)
  }
}
```

这里我们更新组件，其实就是更新组件的 `children` 和 `props`也就是重新运行下面这一段逻辑：

```ts
// 子组件在 init 逻辑会走这一个函数，子组件自身状态改变时也会重新走一遍 update
// 现在我们只需要在父组件更新时，如果涉及到子组件也需要更新，就调用一下子组件的这个方法就可以了
function setupRenderEffect(instance, vnode, container, anchor) {
  effect(() => {
    if (instance.isMounted) {
      // update 
      patch(preSubTree, subTree, container, instance, anchor)
    } else {
      // init 
    }
  })
}
```

所以我们可以将这个 effect 给挂载到 `instance` 中

```ts
function setupRenderEffect(instance, vnode, container, anchor) {
    instance.update = effect(() => {})
}
```

下面我们只需要在 `updateComponent` 中获取到这个`instance`就可以调用 `update`方法了。

```ts
// 1. 在 vnode 中加入 component 这个属性，用于指向该 vnode 所在的 componentInstance
export function createVNode(type, props?, children?) {
  // 这里先直接返回一个 VNode 结构
  const vnode = {
    type,
    props,
    children,
    el: null,
    // 初始化 component
    component: null,
    key: props ? props.key : null,
    shapeFlags: getShapeFlags(type),
  }
  return vnode
}

// 2. 在 mountComponent 的时候将填充 component

function mountComponent(vnode, container, parentInstance, anchor) {
  // 填充 vnode.compeont
  const instance = (vnode.component = createComponentInstance(
    vnode,
    parentInstance
  ))
}
```

然后我们就可以在 `updateComponent` 中获取到 `instance` 并调用了

```ts
function updateComponent(n1, n2) {
  const instance = (n2.component = n1.component)
  // instance 挂载最新的虚拟节点
  instance.next = n2
  instance.update()
}
```

```ts
// 在 update 逻辑中，对更新进行处理
// 如果 next 存在，那么就说明是组件更新的逻辑
function setupRenderEffect(instance, vnode, container, anchor) {
  instance.update = effect(() => {
    if (instance.isMounted) {
      const { next, vnode } = instance
      if (next) {
        // 更新组件 el、props
        next.el = vnode.el
        // 然后具体更新代码
        updateComponentPreRender(instance, next)
      }
    } else {
      // init 
    }
  })
}

// 具体的更新逻辑
// 首先将 vnode 更新，然后更新 props
// 最后将 nextVNode 设置为空
function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode
  instance.props = nextVNode.props
  nextVNode = null
}
```

现在已经可以在父组件中来更新子组件了。

### 2.3 若子组件不用更新不要触发更新逻辑

但是现在的逻辑还是有点问题的，例如我们不更新涉及到子组件的 props，只更新父组件的状态，那么还是会进入到 `update` 的逻辑，所以我们需要优化一下：

```ts
function updateComponent(n1, n2) {
  const instance = (n2.component = n1.component)
  // 增加一个判断，如果需要更新，再进入更新的逻辑
  if (shouldUpdateComponent(n1, n2)) {
    instance.next = n2
    instance.update()
  } else {
    // 不需要更新，就重置就好了
    n2.el = n1.el
    instance.vnode = n2
  }
}
```

```ts
// componentUpdateUtils
// 这边的函数就是对 props 进行判断，如果新旧 props 不相等，那么就意味着需要更新
export function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps } = prevVNode
  const { props: nextProps } = nextVNode
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  return false
}
```

至此，组件更新逻辑结束