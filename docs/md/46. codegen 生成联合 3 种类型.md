# codegen 生成联合 3 种类型

在本小节中，我们将会实现 codegen 生成联合 3 种类型的 code

```html
<div>hi,{{message}}</div>
```

```ts
// 生成为
const { createElementVNode: _createElementVNode, toDisplayString: _toDisplayString } = Vue
export function render(_ctx, _cache) { return _createElementVNode(
'div', null, 'hi,' + _toDisplayString(_ctx.message)) }
```

## 1. 测试样例

```ts
test('union 3 type', () => {
  const template = '<div>hi,{{message}}</div>'
  const ast = baseParse(template)
  transform(ast)
  const code = codegen(ast)
  expect(code).toMatchSnapshot()
})
```

## 2. 实现

此时我们直接生成快照，发现是有问题的，这是因为我们在 `genElement` 的时候没有考虑到 children

```ts
function genElement(node, context) {
  const { push, helper } = context
  const { tag } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}('${tag}'`)
  // 加入对 children 的处理
  const { children } = node
  if (children.length) {
    push(', null, ')
    for (let i = 0; i < children.length; i++) {
      genNode(children[i], context)
    }
  }
  push(')')
}
```

此时来看看我们的快照：

```
const { createElementVNode: _createElementVNode, toDisplayString: _toDisplayString } = Vue
export function render(_ctx, _cache) { return _createElementVNode('div', null, 'hi,'_toDisplayString(_ctx.message)) }
```

此时我们发现一个问题，那就是没有加号。所以我们可以再创建一个类型：`compound` 复合类型：

- 如果 text 、interpolation 相邻在一起，那么相邻在一起的就是 compound 类型

### 2.1 复合类型处理

首先，加入一种类型：

```ts
export const enum NodeType {
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  ROOT,
  // 加入复合类型
  COMPOUND_EXPRESSION,
}
```

此时我们需要去增加一个 `transformText`

```ts
import { NodeType } from '../ast'

export function transformText(node) {
  const { children } = node
  if (children.length) {
    let currentContainer
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (isText(child)) {
        for (let j = i + 1; j < children.length; j++) {
          const next = children[j]
          if (isText(next)) {
            // 相邻的是 text 或者 interpolation，那么就变成联合类型
            if (!currentContainer) {
              currentContainer = children[i] = {
                type: NodeType.COMPOUND_EXPRESSION,
                children: [child],
              }
            }
            // 在每个相邻的下一个之前加上一个 +
            currentContainer.children.push(' + ')
            currentContainer.children.push(next)
            // 遇到就删除
            children.splice(j, 1)
            // 修正索引，因为我们下一个循环就又 + 1 了。此时索引就不对了
            j -= 1
          } else {
            // 如果下一个不是 text 的了，那么就重置，并跳出循环
            currentContainer = undefined
            break
          }
        }
      }
    }
  }
}

function isText(node) {
  return node.type === NodeType.TEXT || node.type === NodeType.INTERPOLATION
}
```

然后在测试中加入这个 plugin

```ts
test('union 3 type', () => {
    const template = '<div>hi,{{message}}</div>'
    const ast = baseParse(template)
    transform(ast, {
      // 加入 transformText plugin
      nodeTransforms: [transformElement, transformExpression, transformText],
    })
    const code = codegen(ast)
    expect(code).toMatchSnapshot()
  })
```

然后我们就可以在 codegen 阶段加入对 COMPOUD 类型的处理

```ts
function genNode(node, context) {
  switch (node.type) {
    case NodeType.TEXT:
      genText(node, context)
      break
    case NodeType.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeType.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeType.ELEMENT:
      genElement(node, context)
      break
    // 加入对 compound 类型的处理
    case NodeType.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
  }
}

function genCompoundExpression(node, context) {
  const { children } = node
  const { push } = context
  // 对 children 进行遍历
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    // 如果是 string，也就是我们手动添加的 +
    if (isString(child)) {
      // 直接 push
      push(child)
    } else {
      // 否则还是走 genNode
      genNode(child, context)
    }
  }
}
```

此时我们就可以生成了。

### 2.2 优化 genElement

此时我们回过头来看看 `genElement` 我们发现是有问题的：

```ts
function genElement(node, context) {
  // 我们这里写死了 props 给 null，以及直接用 tag
  const { push, helper } = context
  const { tag } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}('${tag}'`)
  const { children } = node
  if (children.length) {
    push(', null, ')
    for (let i = 0; i < children.length; i++) {
      genNode(children[i], context)
    }
  }
  push(')')
}
```

我们需要一个兼容层来处理 props 和 tag。在哪里处理呢？就是在 `transformElement` 的地方进行处理

```ts
export function transformElement(node, context) {
  if (node.type === NodeType.ELEMENT) {
    context.helper(CREATE_ELEMENT_VNODE)
    // 中间处理层，处理 props 和 tag
    const vnodeTag = node.tag
    const vnodeProps = node.props

    const { children } = node
    let vnodeChildren = children

    const vnodeElement = {
      type: NodeType.ELEMENT,
      tag: vnodeTag,
      props: vnodeProps,
      children: vnodeChildren,
    }

    node.codegenNode = vnodeElement
  }
}
```

```ts
function createRootCodegen(root) {
  const child = root.children[0]
  // 在这里进行判断，如果说 children[0] 的类型是 ELEMENT，那么直接修改为 child.codegenNode
  if (child.type === NodeType.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = root.children[0]
  }
}
```

然后就可以修改 `genElement`

```ts
function genElement(node, context) {
  const { push, helper } = context
  const { tag, props } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}('${tag}'`)
  const { children } = node
  if (children.length) {
    // 这里的 props 就可以是活的了
    push(`, ${props}, `)
    for (let i = 0; i < children.length; i++) {
      genNode(children[i], context)
    }
  }
  push(')')
}
```

### 2.3 优化插件执行顺序

现在我们又发现了一个问题，虽然我们仍然引入了 `transformExpression` 插件，但是我们的 interpolation 还是没有 `_ctx`。这是因为我们修改了结构，此时第二层结构还存在一个 `COMPOUND_EXPRESSION`。那么我们就需要让 `transformExpression` 最先执行，他执行完毕后，再去执行其他的插件。也就是优化插件的执行顺序。

我们设计是这样的：

- 如果一个插件执行返回的是一个函数，那么表示该插件会是一个退出执行函数
- 在最后，会执行所有的退出函数

```ts
function traverseNode(node, context) {
  const { nodeTransforms } = context
  const exitFns: any[] = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    const exitFn = transform(node, context)
    // 收集退出函数
    if (exitFn) exitFns.push(exitFn)
  }
  switch (node.type) {
    case NodeType.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
    case NodeType.ROOT:
    case NodeType.ELEMENT:
      traverseChildren(node, context)
      break
    default:
      break
  }
  let i = exitFns.length
  // 执行所有的退出函数
  while (i--) {
    exitFns[i]()
  }
}
```

### 2.4 优化空值

```ts
function genElement(node, context) {
  const { push, helper } = context
  const { tag, props } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  const { children } = node
  // 在这里批量处理 tag，props 和 children，优化空值情况
  genNodeList(genNullable([tag, props, children]), context)
  push(')')
}

function genNodeList(nodes, context) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node)) {
      push(node)
    } else if (isArray(node)) {
      for (let j = 0; j < node.length; j++) {
        const n = node[j]
        genNode(n, context)
      }
    } else {
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}

function genNullable(args) {
  return args.map(arg => arg || 'null')
}
```

## 3. 重构

### 3.1 抽离 vnode

```ts
export function transformElement(node, context) {
  return () => {
    if (node.type === NodeType.ELEMENT) {
      context.helper(CREATE_ELEMENT_VNODE)
      const vnodeTag = `'${node.tag}'`
      const vnodeProps = node.props

      const { children } = node
      let vnodeChildren = children
			// 这里可以抽离
      const vnodeElement = {
        type: NodeType.ELEMENT,
        tag: vnodeTag,
        props: vnodeProps,
        children: vnodeChildren,
      }

      node.codegenNode = vnodeElement
    }
  }
}
```

```ts
export function transformElement(node, context) {
  if (node.type === NodeType.ELEMENT) {
    return () => {
      // 中间处理层，处理 props 和 tag
      const vnodeTag = `'${node.tag}'`
      const vnodeProps = node.props

      const { children } = node
      const vnodeChildren = children
			// 抽离函数
      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      )
    }
  }
}

// ast.ts

export function createVNodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE)
  return {
    type: NodeType.ELEMENT,
    tag,
    props,
    children,
  }
}
```

### 3.2 抽离 isText

还可以将 `transformText` 中的 isText 抽离到 `utils.ts` 中。

