# 实现 customRenderer

在本小节中，我们将会实现 customRenderer

## 1. 目前渲染存在的问题

我们来看看目前我们自己的 mini-vue 渲染存在的问题，切换到 `render.ts`

```ts
function mountElement(vnode, container, parentInstance) {
  const { type: domElType, props, children, shapeFlags } = vnode
  // document.createElement(type) 强依赖 DOM API
  const domEl = (vnode.el = document.createElement(domElType))
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  for (const prop in props) {
    if (isOn(prop)) {
      const event = prop.slice(2).toLowerCase()
      // addEventListener，setAttribute 强依赖 DOM API
      domEl.addEventListener(event, props[prop])
    } else {
      domEl.setAttribute(prop, props[prop])
    }
  }
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    domEl.textContent = children
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, domEl, parentInstance)
  }
  // appendChild 强依赖 DOM API
  container.appendChild(domEl)
}
```

我们发现最终渲染的 API 强依赖 DOM 的 API，这个问题就在于框架只能运行在浏览器中。为了让我们的框架通用性更强，我们需要将实际渲染的模块抽离出来，自己默认有一套，同时别人也可以自己来配置。

通过对代码的观察，发现需要抽离出三个 API：

- `createElement`：用于创建元素
- `patchProp`：用于给元素添加属性
- `insert`：将于给父元素添加子元素

## 2. 实现 customRenderer

### 2.1 抽离强绑定 API

```ts
// 默认给定面向 DOM 平台的渲染接口
// 写在 runtime-dom/index.ts 中
export function createElement(type) {
  return document.createElement(type)
}

const isOn = (key: string) => /^on[A-Z]/.test(key)

export function patchProp(el, prop, props) {
  if (isOn(prop)) {
    const event = prop.slice(2).toLowerCase()
    el.addEventListener(event, props[prop])
  } else {
    el.setAttribute(prop, props[prop])
  }
}

export function insert(el, parent) {
  parent.appendChild(el)
}

export function selector(container) {
  return document.querySelector(container)
}
```

```ts
function mountElement(vnode, container, parentInstance) {
  const { type: domElType, props, children, shapeFlags } = vnode
  // 将强绑定 API 抽离
  const domEl = (vnode.el = createElement(domElType))
  for (const prop in props) {
    patchProp(domEl, prop, props)
  }
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    domEl.textContent = children
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, domEl, parentInstance)
  }
  insert(domEl, container)
}
```

### 2.2 继续抽象逻辑

然后，我们可以将整个 `render.ts` 的逻辑包裹在 `createRenderer` 函数中。

在 `render.ts` 中使用到的 `createElement` 等等通过 `createRenderer` 的参数传递过来

```ts
// render.ts

export function createRenderer(options) {
  // 改名字是为了 debug 方便
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    patchProp: hostPatchProp,
    selector: hostSelector,
  } = options
  // other code ...
}
```

将 `createApp` 也包裹在 `createAppAPI` 中。

```ts
// 这里接收 renderer
export function createAppAPI(renderer, selector) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        const vnode = createVNode(rootComponent)
        // 如果传过来了 selector，我们就用 selector 方法来获取 rootContainer
        // 如果没有传 selector，就直接用 rootContainer
        renderer(vnode, selector ? selector(rootContainer) : rootContainer)
      },
    }
  }
}
```

在 `render.ts` 中的 `createRenderer` 返回一个

```ts
return {
    createApp: createAppAPI(render, selector),
}
```

然后在我们创建的 `runtime-dom/index` 中

```ts
// 首先根据我们的实现的 DOM API 传入 createRenderer 中
// 创建出一个渲染器
const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  selector,
})

// 然后暴露出 createApp
export const createApp = (...args) => {
  return renderer.createApp(...args)
}
```

所以现在我们的 `crateApp` 逻辑就抽离出来了。

在这一个阶段呢，我们主要是做了以下这几件事情：

- 将之前实现的 `createApp` 包裹一层为 `createAppAPI`，通过传递过来的 renderer，返回 `createApp`

- 创建函数 `createRenderer`，接收自定义渲染器接口，并调用 `createAppAPI` 返回 `createApp`
- 在 `runtime-dom/index` 中写 DOM 环境下的元素 API，并调用 `createRenderer`，传递写好的 API，获取到 `createApp`。

所以呢：

- 默认情况下，Vue 提供的 `createApp` 就是在 DOM 平台下的
- 我们也可以通过调用 `createRenderer` 来传入自己实现的元素 API
- 获取特定的 `createApp`

我们的层级就从原来的：

- mini-vue 入口  ---->  `runtime-core`
- mini-vue 入口  ---->  `runtime-dom`  ---->  `runtime-core`

最后，我们再来试试之前写的 hello_world 能不能跑通吧！

## 3. 写一个 canvas 平台的例子

然后我们根据写好的 renderer 来写一个在 canvas 平台运行的例子吧！

[例子](https://github.com/zx-projects/mini-vue/tree/main/example/customRenderer)

