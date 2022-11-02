# 实现 provide 和 inject

在本小节中我们将去实现 provide 和 inject

## 1. 例子

我们先看看 provide 和 inject 的一个例子

```ts
import { createApp, h, provide, inject } from '../../lib/mini-vue.esm.js'

const Provider = {
  render() {
    return h('div', {}, [h('div', {}, 'Provider'), h(Consumer)])
  },
  setup() {
    // 在上层 provide
    provide('foo', 'foo')
  },
}

const Consumer = {
  render() {
    return h('div', {}, 'Consumer: ' + `inject foo: ${this.foo}`)
  },
  setup() {
    return {
      // 在下层 inject
      foo: inject('foo'),
    }
  },
}

createApp(Provider).mount('#app')
```

## 2. 最简版实现

首先，我们需要创建一个 `apiInjecet.ts`

```ts
import { getCurrentInstance } from './component'

export function provide(key, value) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    currentInstance.providers[key] = value
  }
}
export function inject(key) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    return currentInstance.providers[key]
  }
}
```

然后我们需要在 `instance` 上面挂载一下，注意我们在 `inject` 的时候需要获得 parent，所以我们还需要挂载一个 parent，而 parent 则是在 `createComponentInstance` 时进行挂载，我们需要一层一层的向下传递

```ts
import { getCurrentInstance } from './component'

export function provide(key, value) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    currentInstance.providers[key] = value
  }
}
export function inject(key) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const { parent } = currentInstance
    return parent.providers[key]
  }
}
```

```ts
export function createComponentInstance(vnode, parent) {
  // 这里返回一个 component 结构的数据
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
    providers: {},
    // 挂载 parent
    parent,
  }
  component.emit = emit.bind(null, component) as any
  return component
}

// 然后再一层一层的传递

// 直到最上层
// render.ts

function setupRenderEffect(instance, vnode, container) {
  const subTree = instance.render.call(instance.proxy)
  // 这里的第三个参数，就是 parent
  patch(subTree, container, instance)
  vnode.el = subTree.el
}
```

现在我们就已经可以实现 `provide`、`inject` 的最简版的逻辑了。

## 3. 多层传递

但是目前我们的代码是存在问题的，例如我们知道 provide 是跨层级传递的，假设我们再生产者和消费者之间再加一层，那么代码就会出现问题。

### 3.1 例子

```ts
import { createApp, h, provide, inject } from '../../lib/mini-vue.esm.js'

const Provider = {
  render() {
    return h('div', {}, [h('div', {}, 'Provider'), h(Provider2)])
  },
  setup() {
    provide('foo', 'foo')
  },
}

// 再 Provider 和 Provider2 加一层，那么最下层就获取不到了
const Provider2 = {
  render() {
    return h('div', {}, [h('div', {}, 'Provider2'), h(Consumer)])
  },
  setup() {},
}

const Consumer = {
  render() {
    return h('div', {}, 'Consumer: ' + `inject foo: ${this.foo}`)
  },
  setup() {
    return {
      foo: inject('foo'),
    }
  },
}

createApp(Provider).mount('#app')
```

### 3.2 实现

那么这种该如何实现呢？其实我们就可以在初始化 instance 实例的时候：

```ts
export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
    slots: {},
    // 把初始化的 provides 默认指向父级的 provides
    providers: parent ? parent.providers : {},
    parent,
  }
  component.emit = emit.bind(null, component) as any
  return component
}
```

这样我们跨层级的部分也已经解决了。

但是现在我们还存在一个问题，由于我们直接用的是直接覆盖，上面我们将 `instance.providers` 修改为 `parent.provides`，但是我们在 `provides` 中直接将自己的 provides 更改了，由于引用关系，导致自己的 `parent.provides` 也被修改了。

例如下面的应用场景：

```ts
// 修改了自己的 provides.foo 也间接修改了 parent.provides.foo
provide('foo', 'foo2')
// 这时候取父亲的 provides.foo 发现就会被修改了
const foo = inject('foo')
```

那么如何解决呢？

```ts
// apiInject.ts

export function provide(key, value) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    // 在这里不要直接设置
    currentInstance.providers[key] = value
  }
}
```

我们其实可以通过原型链的方式巧妙的进行设置：

```ts
if (currentInstance) {
    let provides = currentInstance.provides
    if (currentInstance.parent) {
        const parentProvides = currentInstance.parent.provides
        // 如果自己的 provides 和 parent.provides，那么就证明是初始化阶段
        if (provides === parentProvides) {
            // 此时将 provides 的原型链设置为 parent.provides
            // 这样我们在设置的时候就不会五绕道 parent.provides
            // 在读取的时候因为原型链的特性，我们也能读取到 parent.provides
            provides = currentInstance.provides = Object.create(parentProvides)
        }
    }
    provides[key] = value
}
```

这样设置后我们就可以

## 4. inject 的默认值

### 4.1 例子

我们可以在 inject 时设置一个默认值，默认值可能时一个函数或者一个原始值

```ts
const baseFoo = inject('baseFoo', 'base')
const baseFoo = inject('baseBar', （）=> 'bar')
```

### 4.2 实现

```ts
export function inject(key, defaultValue) {
  const currentInstance = getCurrentInstance()
  if (currentInstance) {
    const { parent } = currentInstance
    // 如果 key 存在于 parent.provides
    if (key in parent.provides) {
      return parent.provides[key]
    } else if (defaultValue) {
      // 如果不存在，同时 defaultValue 存在
      // 判断类型，同时执行或返回
      if (typeof defaultValue === 'function') return defaultValue()
      return defaultValue
    }
  }
}
```

这样默认值的操作也已经可以了。