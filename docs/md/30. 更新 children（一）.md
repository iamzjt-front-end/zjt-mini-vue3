# 更新 children（一）

在本小节中，我们将会实现 `children` 更新第一部分逻辑，即

- `text` => `array`
- `text` => `newText`
- `array` => `text`

而最后一部分的逻辑：

- `array` => `array` 由于涉及到 diff 算法，将会在后面篇章中重点讲解

## 1. 例子

查看 [例子](https://github.com/zx-projects/mini-vue/blob/main/example/patchChildren/App.js)

## 2. 实现

### 2.1 `array` => `text`

还记得我们是在哪里进行处理更新逻辑的呢？

```ts
// render.ts

function patchElement(n1, n2, container) {
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    const el = (n2.el = n1.el)
    patchProps(el, oldProps, newProps)
    patchChildren(n1, n2)
}
```

下面我们处理过了 props 还要处理 children

```ts
function patchChildren(n1, n2) {
    const prevShapeFlag = n1.shapeFlags
    const shapeFlag = n2.shapeFlags
    // 情况1：array => text
    // 对新的 shapeFlag 进行判断
    // 如果是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 如果老的 shapeFlag 是 array_children，需要做两件事
            // 1. 清空原有 children
            unmountChildren(n1.children)
            // 2. 挂载文本 children
            hostSetElementText(n2.el, n2.children)
        } 
    }
}
```

如果要从 array => text，需要做两件事情：

- 清空原有 `array_children`
- 挂载文本 `text_children`

#### 清空原有 array_children

```ts
function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
        // 遍历 children，同时执行 remove 逻辑
        // 由于这里涉及到元素渲染的实际操作，所以我们要抽离出去作为一个API
        hostRemove(children[i].el)
    }
}
```

```ts
// runtime-dom/index
function remove(child) {
  // 获取到父节点，【parentNode 是 DOM API】
  const parentElement = child.parentNode
  if (parentElement) {
    // 父节点存在，就从父节点中删除这个子节点
    parentElement.remove(child)
  }
}
```

#### 挂载 text_children

由于挂载 textChildren 也涉及到了视图渲染，所以需要

```ts
// runtime-dom/index
function setElementText(el, text) {
  el.textContent = text
}
```

现在我们就已经实现了 `text` => `array` 了。

### 2.2 `text` => `newText`

#### 1. 实现

```ts
// 情况2：text -> newText
function patchChildren(n1, n2) {
    const prevShapeFlag = n1.shapeFlags
    const shapeFlag = n2.shapeFlags
    const c1 = n1.children
    const c2 = n2.children
    // new 是 text，进来
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(n1.children)
            hostSetElementText(n2.el, n2.children)
        } else {
            // new 不是 array，进来
            if (c1 !== c2) {
                // 新旧 text 进行判断，如果不相等，再进行更新
                hostSetElementText(n2.el, c2)
            }
        }
    }
}
```

#### 2. 优化既有逻辑

上面那一段代码中，我们发现，`hostSetElementText` 出现了两次，根据判断条件的优化，我们可以这样：

```ts
if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 如果老的 shapeFlag 是 array_children，需要做两件事
        // 1. 清空原有 children
        unmountChildren(n1.children)
        // 2. 挂载文本 children
    }
    // 将设置新的文本节点模块放在一起，这样代码量就减少了
    // 逻辑也更清晰了一点
    if (c1 !== c2) {
        hostSetElementText(n2.el, c2)
    }
}
```

至此，我们也已经实现了 `text` => `newText` 的逻辑

### 2.3 `text` => `array`

```ts
if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
   // 处理 new 是 text_chilren
} else {
    // 处理 new 是 array
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 如果是 text -> array
        // 1. 清空 text
        hostSetElementText(n1.el, '')
        // 2. mountChildren
        // 这里注意传递的 container, parentInstance 都可以再上游传递过来
        mountChildren(c2, container, parentInstance)
    }
}
```

至此，我们的 3 种更新情况就已经实现了。