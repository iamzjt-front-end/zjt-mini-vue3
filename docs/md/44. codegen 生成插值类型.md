

# codegen 生成插值类型

在本小节中，我们需要将一个 template 生成为 render

```html
{{message}}
```

```ts
// 生成为
const { toDisplayString: _toDisplayString } = Vue
export function render(_ctx, _cache) { return _toDisplayString(_ctx.message) }
```

## 1. 测试样例

我们先写一个测试样例，这一次，我们可以采用快照的形式来看自己生成的 code string

```ts
test('interpolation', () => {
  const template = '{{message}}'
  const ast = baseParse(template)
  transform(ast)
  const code = codegen(ast)
  expect(code).toMatchSnapshot()
})
```

## 2. 实现

### 2.1 生成导入 code

首先，我们发现和生成 text 不同的是：

- 会有一个导入，也就是 `const { toDisplayString: _toDisplayString } = Vue`
- 以及还会有一个 `_toDisplayString(_ctx.message)`

首先，我们发现只有在 `type` 是 `NodeType.INTERPOLATION` 的情况下，才会有导入 `toDisplayString`，这部分我们最好在 transform 中做。然后在 codegen 阶段，我们直接对 ast 上挂在的 helpers 进行处理就好了

```ts
// transform.ts
export function transform(root, options = {}) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  createRootCodegen(root)
  // 在根节点挂载 helpers
  root.helpers = [...context.helpers.keys()]
}

function createTransformContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || {},
    helpers: new Map(),
    helper(name: string) {
      context.helpers.set(name, 1)
    },
  }
  return context
}
```

```ts
function traverseNode(node, context) {
  const { nodeTransforms } = context
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }
	// 在这里遍历整棵树的时候，将根据不同的 node 的类型存入不同的 helper
  switch (node.type) {
    case NodeType.INTERPOLATION:
      context.helper('toDisplayString')
      break
    case NodeType.ROOT:
    case NodeType.ELEMENT:
      // 只有在 ROOT 和 ELEMENT 才会存在 children，所以这个方法里面的 children 判断也可以去掉了
      // 我们在 parse 模块中 createRoot 的时候记得加上类型
      traverseChildren(node, context)
      break
    default:
      break
  }
}
```

下面的话，我们就可以在 codegen 里获取到 `ast.helpers`，并对其进行处理。

```ts
export function codegen(ast) {
  const context = createCodegenContext()
  const { push, newLine } = context
	
  // 这里处理 code 头部，如果说 ast.helpers 是有值的情况下，那么再追加头部 code
  if (ast.helpers.length) {
    genFunctionPreamble(ast, context)
  }
  
  // other code ...
}

function genFunctionPreamble(ast, context) {
  const VueBinding = 'Vue'
  const { push, newLine } = context
  const aliasHelper = s => `${s}: _${s}`
  // 遍历 ast.helpers 并处理别名
  push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinding}`)
  newLine()
}
```

### 2.2 生成插值 code

我们先来一个最初实现

```ts
function genNode(node, context) {
  // 在 genNode 的时候通过 node 的类型进行不同的处理
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
  }
}

function genExpression(node, context) {
  // 处理 SIMPLE_EXPRESSION
  const { push } = context
  push(`_ctx.${node.content}`)
}

function genInterpolation(node, context) {
  // 如果是插值，那么我们的 content 还可以通过 node.content 再处理一层
  const { push } = context
  push(`_toDisplayString(`)
  genNode(node.content, context)
  push(`)`)
}

function genText(node, context) {
  const { push } = context
  push(`'${node.content}'`)
}
```

但是这样的代码是不好维护的，我们可以将这个处理 SIMPLE_EXPRESSION 的逻辑作为一个 transform 插件。

```ts
// transforms/transformExpression
import { NodeType } from '../ast'

export function transformExpression(node) {
  if (node.type === NodeType.INTERPOLATION) {
    node.content = processExpression(node.content)
  }
}

function processExpression(node) {
  node.content = `_ctx.${node.content}`
  return node
}
```

```ts
// 在测试样例中
test('interpolation', () => {
  const template = '{{message}}'
  const ast = baseParse(template)
  transform(ast, {
    // 将其作为一个插件导入
    nodeTransforms: [transformExpression],
  })
  const code = codegen(ast)
  expect(code).toMatchSnapshot()
})
```

```ts
function genExpression(node, context) {
  const { push } = context
  // 这样我们就可以不用在这里加上 _ctx. 了
  push(`${node.content}`)
}
```

现在生成插值功能也已经完毕了

## 3. 重构

我们发现我们的代码中存在 `toDisplayString` 这个字符串，我们最好将其抽离出来，然后就可以将代码中写死的部分修改成活的了。

```ts
// runtimeHelpers
export const TO_DISPLAY_STRING = Symbol('toDisplayString')

export const HelperNameMapping = {
  [TO_DISPLAY_STRING]: 'toDisplayString',
}
```

