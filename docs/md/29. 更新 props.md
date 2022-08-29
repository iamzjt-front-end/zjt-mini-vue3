# 更新 props

在本小节中，我们将会实现更新 props 的逻辑

## 1. 例子

首先，我们可以写一个例子，来看看更新 props 都会考虑到哪些情况：

```ts
const props = ref({
  foo: 'foo',
  bar: 'bar',
})
function patchProp1() {
  // 逻辑1: old !== new
  props.value.foo = 'new-foo'
}
function patchProp2() {
  // 逻辑2: new === undefined || null, remove new
  props.value.bar = undefined
}
function patchProp3() {
  // 逻辑3: old 存在，new 不存在，remove new
  props.value = {
    bar: 'bar',
  }
}
```

## 2. 实现

在上一小节中我们已经在 `render.ts` 中创建了 `patchElement` 用于所有的更新处理。接下来，我们需要在这个函数中加入对 props 的更新逻辑的处理。

```ts
function patchElement(n1, n2, container) {
  const oldProps = n1.props || {}
  const newProps = n2.props || {}
  patchProps(oldProps, newProps)
}
```

然后我们在 `patchProps` 中加入多种情况下对于 props 的处理

```ts
function patchProps(oldProps, newProps) {
  // 情况1: old !== new 这个走更新的逻辑
  // 情况2: old 存在，new !== undefined，这个走删除的逻辑
  // 情况3: old 存在，new 不存在，这个也走删除的逻辑
}
```

### 2.1 情况 1

```ts
function patchElement(n1, n2, container) {
  const oldProps = n1.props || {}
  const newProps = n2.props || {}
  // 这里需要传递 el，我们需要考虑一点，到这一层的时候
  // n2.el 是 undefined，所以我们需要把 n1.el 赋给 n2.el
  // 这是因为在下次 patch 的时候 n2 === n1, 此刻的新节点变成旧节点，el 就生效了
  const el = (n2.el = n1.el)
  patchProps(el, oldProps, newProps)
}

function patchProps(el, oldProps, newProps) {
  // 如果 oldProps === newProps 那就不需要对比了
  if (oldProps === newProps) return
  // 情况1: old !== new 这个走更新的逻辑
  for (const propKey of Reflect.ownKeys(newProps)) {
    const oldProp = oldProps[propKey]
    const newProp = newProps[propKey]
    // 新旧属性进行对比，如果不相等
    if (oldProp !== newProp) {
      // 直接更新属性，这里 hostPatchProp 的时候我们又传入了一个新属性，也就是 oldPropValue
      // 在 `runtime-dom/index.ts/patchProp` 不要忘记添加这个参数
      // 这个是为了让用户自己也能主动处理新旧 prop 差异
      hostPatchProp(el, propKey, newProp, oldProp)
    }
  }
}
```

### 2.2 情况2

在情况2 中，`newProp` 是 undefined 或者 null，由于我们处理的逻辑已经抽离到了 `runtime-dom/index` 中，所以这里我们需要去修改那里的代码。

```ts
function patchProp(el, prop, val, oldVal) {
  if (isOn(prop)) {
    const event = prop.slice(2).toLowerCase()
    el.addEventListener(event, val)
  } else {
    console.log({ prop, val, oldVal })
		// 情况2: 如果 newVal === undefine || null 的时候，就删除
    if (val === undefined || null) el.removeAttribute(prop)
    else el.setAttribute(prop, val)
  }
}
```

### 2.3 情况3

在情况 3 中，我们去单独循环 newProps 肯定是不对的了，我们还要再去循环一遍 oldProps

```ts
function patchProps(el, oldProps, newProps) {
  if (oldProps === newProps) return
  for (const propKey of Reflect.ownKeys(newProps)) {
    const oldProp = oldProps[propKey]
    const newProp = newProps[propKey]
    if (oldProp !== newProp) {
      hostPatchProp(el, propKey, newProp, oldProp)
    }
  }
  // 情况3: old 存在，new 不存在，这个也走删除的逻辑
  // 在情况 3 中我们还要再次去循环一遍 oldProps
  for (const propKey of Reflect.ownKeys(oldProps)) {
    // 如果当前的 key 在 newProps 中没有
    if (!(propKey in oldProps)) {
      // 就去删除，第三个参数传 undefined 相当于走了情况 2，就调用了删除
      hostPatchProp(el, propKey, undefined, oldProps[propKey])
    }
  }
}
```

接下来我们还可以进行优化一下：

```ts
// shared/index

// 创建一个常量
export const EMPTY_OBJ = {}
```

```ts
// render.ts

function patchElement(n1, n2, container) {
  // 将 {} ==> EMPTY_OBJ
  const oldProps = n1.props || EMPTY_OBJ
  const newProps = n2.props || EMPTY_OBJ
  const el = (n2.el = n1.el)
  patchProps(el, oldProps, newProps)
}


// patchProps 逻辑中
// 在循环 oldProps 之前进行判断
// 如果 oldProps 是空的就不要进行循环了
if (oldProps !== EMPTY_OBJ) {
  for (const propKey of Reflect.ownKeys(oldProps)) {
    if (!(propKey in newProps)) {
      hostPatchProp(el, propKey, undefined, oldProps[propKey])
    }
  }
}
```

最后，这三种情况我们就都已经支持了。