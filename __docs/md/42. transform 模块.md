# transform 模块

在本小节中，我们将通过一个小例子，来看看 transform 模块的作用

## 1. 测试样例

```ts
test('should change text content', () => {
  const ast = baseParse('<div>hi</div>')
  transform(ast)
  expect(ast.children[0].children[0].content).toEqual('hi mini-vue')
})
```

我们这个测试样例要保证的就是，如果说 nodeType 是 text 的时候，修改其 content 的值。

## 2. 实现

实现起来还是非常简单的，我们只需要遍历整个树就可以了，这里我们使用递归来遍历。

```ts
export function transform(root) {
  traverseNode(root)
}

function traverseNode(node) {
  // 在这里就可以对 node 进行操作
  const children = node.children
  if (children) {
    for (let i = 0; i < children.length; i++) {
      traverseNode(children[i])
    }
  }
}
```

但是我们发现，其实将 content 的值追加 mini-vue 这类的需求，其实是非常特定的场景下的，但是我们设计程序是肯定要通用性最佳的，不可能要将特定的处理写在程序中。

所以我们就可以换一种思路，通过外部提供处理程序，内部再调用外部传入的处理程序。我们称之为插件（plugin）。

```ts
// 改写测试
test('should change text content', () => {
  const ast = baseParse('<div>hi</div>')
  // 外部提供处理
   const transformText = node => {
     if (node.type === NodeType.TEXT) {
       node.content += ' mini-vue'
     }
   }
  // 通过 options 传入内部，内部再调用
  transform(ast, {
    nodeTransforms: [transformText],
  })
  expect(ast.children[0].children[0].content).toEqual('hi mini-vue')
})
```

```ts
export function transform(root, options) {
  // 首先我们创建一个 transform 的上下文
  const context = createTransformContext(root, options)
  // 然后将这个上下文传入 traverseNode 中
  traverseNode(root, context)
}

function createTransformContext(root, options) {
  return {
    root,
    nodeTransforms: options.nodeTransforms || {},
  }
}

function traverseNode(node, context) {
  // 在这里对每个 node 通过 transforms 进行依次处理
  const { nodeTransforms } = context
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }
  const children = node.children
  if (children) {
    for (let i = 0; i < children.length; i++) {
      traverseNode(children[i], context)
    }
  }
}
```

这样，我们就可以通过外部传入的处理程序来对于内部的 node 进行处理了。

## 3. 重构

我们可以将 `traverseNode` 中的部分代码抽离出去

```ts
function traverseNode(node, context) {
  const { nodeTransforms } = context
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i]
    transform(node)
  }
  // 将递归的部分抽离出去
  traverseChildren(node, context)
}

function traverseChildren(node, context) {
  const children = node.children
  if (children) {
    for (let i = 0; i < children.length; i++) {
      traverseNode(children[i], context)
    }
  }
}
```

## 4. 为下个阶段 codegen 铺路

我们在看整个 compiler 模块的流程时，我们发现 transform 下个阶段就是 codegen，生成最终的 js string。那么目前我们在 codegen 模块可以直接对整个 ast 树进行做处理吗？肯定是不行的， 假设我们后期想要修改 ast 的结构，那么肯定还要修改 codegen 的代码。这是不合理的。

```ts
export function transform(root, options = {}) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  createRootCodegen(root)
}

function createRootCodegen(root) {
  // 所以我们为下个阶段 codegen 铺路，在 transform 指定 codegen 处理的节点
  root.codegenNode = root.children[0]
}
```

现在我们的模块职责就比较清楚了，codegen 只处理 codegenNode 

至于 parse 的 ast 怎么变成 codegenNode，那就是 transform 的事情了