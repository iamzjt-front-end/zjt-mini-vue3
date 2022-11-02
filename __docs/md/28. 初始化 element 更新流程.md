# 初始化 element 更新流程

在本小节中，我们将会初始化 element 的更新逻辑

## 1. 例子

```ts
export default {
  setup() {
    const counter = ref(1)
    function inc() {
      counter.value += 1
    }
    return {
      counter,
      inc,
    }
  },
  render() {
    return h('div', {}, [
      h('div', {}, '' + this.counter),
      h('button', { onClick: this.inc }, 'inc'),
    ])
  },
}
```

首先我们需要解决模板使用 ref 的问题，因为目前 counter 是一个 ref，所以我们需要在实际执行 setup 的时候给这个返回的对象再包一层 proxyRefs

```ts
function setupStatefulComponent(instance) {
    // 在这里给最终 setup 运行后的结果再套一层 proxyRefs
    const setupResult = proxyRefs(
        setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        })
    )
}
```

## 2. 初始化更新逻辑

### 2.1 更新重新渲染视图

我们从例子中可以看出，`counter` 的更新并没有触发视图的更新，这是因为我们没有收集视图这个依赖，从而更改时也不会触发视图这个依赖。

那么我们最终是从哪里开始渲染视图的呢？

```ts
// render.ts

function setupRenderEffect(instance, vnode, container) {
    // 就是在这个函数中
    const subTree = instance.render.call(instance.proxy)
    patch(subTree, container, instance)
    vnode.el = subTree.el
}
```

我们需要给这一层包一个 effect，现在我们就已经实现更新重新渲染视图了

```ts
function setupRenderEffect(instance, vnode, container) {
    // 包一层 effect，让执行的时候去保存依赖
    // 并在值更新的时候重新渲染视图
    effect(() => {
        const subTree = instance.render.call(instance.proxy)
        patch(subTree, container, instance)
        vnode.el = subTree.el
    })
}
```

### 2.2 获取上一个节点

但是目前我们的实现是非常有问题的，因为我们更新只会无脑的重新新加视图，而不是再对比视图，所以我们需要对视图进行判断

首先，我们需要给组件实例新增加一个状态，叫做 `isMounted`，用来记录该组件是否已经被渲染过，默认值是 `false`

```ts
function setupRenderEffect(instance, vnode, container) {
    effect(() => {
        // 根据 instance.isMounted 状态进行判断
        if (instance.isMounted) {
            // update 逻辑，获取上一个 subTree
            const subTree = instance.render.call(instance.proxy)
            vnode.el = subTree.el
            // 获取上一个 subTree
            const preSubTree = instance.subTree
            // 然后将自己赋给 subTree
            instance.subTree = subTree
            console.log({ subTree, preSubTree })
        } else {
            // init 逻辑，存 subTree
            const subTree = (instance.subTree = instance.render.call(
                instance.proxy
            ))
            patch(subTree, container, instance)
            vnode.el = subTree.el
            instance.isMounted = true
        }
    })
}
```

借此我们就可以获取到旧的 subTree 了。

### 2.3 patch 新旧

然后我们在 `patch` 的时候只做了 init 逻辑，所以可以这样：

```ts
// 加入参数 n1,
// n1 ==> preSubTree
// n2 ==> currentSubTree
function patch(n1, n2, container, parentInstance) {
    const { type, shapeFlags } = n2
    switch (type) {
        case Fragment:
            processFragment(n1, n2, container, parentInstance)
            break
        case TextNode:
            processTextNode(n2, container)
            break
        default:
            if (shapeFlags & ShapeFlags.ELEMENT) {
                processElement(n1, n2, container, parentInstance)
            } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(n2, container, parentInstance)
            }
            break
    }
}
```

将上下游更改，同时我们触发渲染逻辑的时候

```ts
function setupRenderEffect(instance, vnode, container) {
    effect(() => {
        if (instance.isMounted) {
            const subTree = instance.render.call(instance.proxy)
            vnode.el = subTree.el
            const preSubTree = instance.subTree
            instance.subTree = subTree
            // update 逻辑，preSubTree 传递
            patch(preSubTree, subTree, container, instance)
        } else {
            const subTree = (instance.subTree = instance.render.call(
                instance.proxy
            ))
            // init 逻辑，preSubTree 传递 null
            patch(null, subTree, container, instance)
            vnode.el = subTree.el
            instance.isMounted = true
        }
    })
}
```

然后我们在处理 element 的时候

```ts
function processElement(n1, n2, container, parentInstance) {
    // n1 存在，update 逻辑
    if (n1) {
        patchElement(n1, n2, container)
    } else {
        // 不存在 init 逻辑
        mountElement(n1, n2, container, parentInstance)
    }
}

function patchElement(n1, n2, container) {
    // 此函数用于对比 props 和 children
}
```

## 3. 总结

最后呢，我们发现更新逻辑的核心就在于，将渲染视图部分放入 `effect` 中，这就导致了如果我们的数据是响应式的数据（例如 `ref`、`reactive`），那么这个响应式的数据更新的时候，就会重新触发视图。

然后我们保存一份上一个 `subTree`，与现在的 `subTree` 进行对比，从而实现新旧对比。

这就是更新的核心逻辑。