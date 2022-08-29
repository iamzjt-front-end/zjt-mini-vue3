# 实现组件的 emit 功能

## 1. 什么是 emit？

```ts
export const Foo = {
  setup(props, { emit }) {
    // setup 第二个参数是 ctx，里面有一个参数是 emit
    const handleClick = () => {
      // emit 是一个函数，第一个参数是触发的事件
      emit('add')
    }
    return {
      handleClick,
    }
  },
  render() {
    return h(
      'button',
      {
        onClick: this.handleClick,
      },
      '点击我'
    )
  },
}
```

```ts
export default {
  render() {
    // 这里在写组件的时候，第二个参数就可以传入 on + emit's Event
    return h('div', {}, [h('p', {}, 'hello'), h(Foo, { onAdd: this.onAdd })])
  },
  setup() {
    function onAdd() {
      console.log('onAdd')
    }
    return {
      onAdd,
    }
  },
}

```

## 2. 实现 emit

首先，setup 的第二个参数是一个对象，传入 emit

```ts
// component.ts

// 在 setupStatefulComponent 时调用组件的 component
function setupStatefulComponent(instance) {
    // other code ...
     const setupResult = setup(shallowReadonly(instance.props), {
      // 传入的 emit 就可以直接使用 instance.emit
      emit: instance.emit,
    })
    handleSetupResult(instance, setupResult)
}
```

那么我们需要在初始化 emit 的时候去注册一下 emit 

```ts
export function createComponentInstance(vnode) {
  // 这里返回一个 component 结构的数据
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  }
  component.emit = emit as any
  return component
}
```

将 emit 的逻辑单独抽离出来，创建 `componentEmit.ts`

```ts
// componentEmit.ts

// 第一个参数接收一个 event 的值
export function emit(event) {
  console.log('event', event)
}
```

而我们的触发 event 的值是从哪里来的呢？我们再回头看看上面的例子，其实第二个参数中就传入了 emit 的值，所以就可以理解为，我们要触发的事件，其实就在 props 中。但是问题来了，这个函数该如何获取到 instance 呢（因为 props 在 instance 中）？

```ts
export function createComponentInstance(vnode) {
  // 这里返回一个 component 结构的数据
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  }
  // 使用 bind 这个小技巧可以让 component 传入的 emit 参数中携带，同时不影响其他的参数
  component.emit = emit.bind(null, component) as any
  return component
}
```

```ts
export function emit(instance, event) {
  const { props } = instance
}
```

接下来，我们就可以从 props 中来获取到具体的 event 了。但是目前还是有一个问题的，我们 `emit('add')` 这里的都是全部小写的，而上层父组件监听的则是大写的 `onAdd`，同时加了一个 on，我们需要这样

```ts
export function emit(instance, event) {
  // 获取 props
  const { props } = instance
  const toUpperCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)
  // 将 event 第一个字母大写，同时加上 on
  const handler = props[`on${toUpperCase(event)}`]
  // 如果 props 中存在这个 handler，那么就触发这个 handler
  handler && handler()
}
```

现在我们就已经可以实现 emit 了。

## 3. 完善 emit

### 3.1 emit 可以传递参数

```ts
export const Foo = {
  setup(props, { emit }) {
    const handleClick = () => {
      // emit 可以传递多个参数
      emit('add', 1, 2)
    }
    return {
      handleClick,
    }
  },
}
```

会在父组件监听的事件上进行接收。这个也是非常简单的，

```ts
// 接收参数
export function emit(instance, event, ...params) {
  const { props } = instance
  const toUpperCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)
  const handler = props[`on${toUpperCase(event)}`]
  // 触发时传递参数
  handler && handler(...params)
}
```

### 3.2 事件名可以是短横线格式

```ts
// emit 的事件名称也可以是短横线连接的
emit('add-count', 1)
```

```ts
// 在监听的时候需要换成驼峰的格式
h(Foo, { onAdd: this.onAdd, onAddCount: this.onAddCount })
```

那么这个还如何解决呢？

```ts
// 我们在处理 event 的时候仅仅处理了全部是小写的情况
// 所以我们还需要处理一层，
export function emit(instance, event, ...params) {
  const { props } = instance
  // toUpperCase 名字可以改为 capitalize，表述的更加准确
  const toUpperCase = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1)
  const handler = props[`on${toUpperCase(event)}`]
  // 触发时传递参数
  handler && handler(...params)
}
```

我们需要加一个 `camelize` 处理层，先将短横连接的转换为大写格式

```ts
export function emit(instance, event, ...params) {
  const { props } = instance
  // 在这里进行正则匹配，将 横杠和第一个字母 -> 不要横杠，第一个字母大写
  const camelize = (str: string) => {
    return str.replace(/-(\w)/, (_, str: string) => {
      return str.toUpperCase()
    })
  }
  const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
  // 在这里先处理横杠，在处理大小写
  const handler = props[`on${capitalize(camelize(event))}`]
  handler && handler(...params)
}
```

现在我们的 emit 就已经完善了

