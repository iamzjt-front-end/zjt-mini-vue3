# codegen 生成 element

在本小节中，我们需要将一个 template 生成为 render

```html
<div></div>
```

```ts
// 生成为
const { createElementVNode: _createElementVNode } = Vue
export function render(_ctx, _cache) { return _createElementVNode(
'div') }
```

## 1. 测试样例

我们先写一个测试样例，这一次，我们可以采用快照的形式来看自己生成的 code string

```ts
test('simple element', () => {
  const template = '<div></div>'
  const ast = baseParse(template)
  const code = codegen(ast)
  expect(code).toMatchSnapshot()
})
```

## 2. 实现

首先，我们在 `runtimeHelpers` 中可以加入这个类型

```ts
export const TO_DISPLAY_STRING = Symbol('toDisplayString')
// 加入 createElementVNode
export const CREATE_ELEMENT_VNODE = Symbol('createElementVNode')

export const HelperNameMapping = {
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [CREATE_ELEMENT_VNODE]: 'createElementVNode',
}
```

然后我们可以写一个处理 element 的 transform 插件，记得在 transform 模块中执行每个插件的时候再传递一个 context 参数。

```ts
import { NodeType } from '../ast'
import { CREATE_ELEMENT_VNODE } from '../runtimeHelpers'

export function transformExpression(node, context) {
  if (node.type === NodeType.ELEMENT) {
    context.helper(CREATE_ELEMENT_VNODE)
  }
}
```

然后在测试的时候将这个插件加入其中。

```ts
test('simple element', () => {
  const template = '<div></div>'
  const ast = baseParse(template)
  transform(ast, {
    // 加入处理插件
    nodeTransforms: [transformElement],
  })
  const code = codegen(ast)
  expect(code).toMatchSnapshot()
})
```

最后在 codegen 阶段加入对于 element 的处理。

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
    // 加入对 element 的处理
    case NodeType.ELEMENT:
      genElement(node, context)
      break
  }
}

// 处理 element
function genElement(node, context) {
  const { push, helper } = context
  const { tag } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}('${tag}')`)
}
```

