# codegen 生成 text

在本小节中，我们需要将一个 template 生成为 render

```html
hi
```

```ts
// 生成为
export function render(_ctx, _cache) { return 'hi' }
```

## 1. 测试样例

我们先写一个测试样例，这一次，我们可以采用快照的形式来看自己生成的 code string

```ts
test('text', () => {
  const template = 'hi'
  const ast = baseParse(template)
  transform(ast)
  const code = codegen(ast)
  expect(code).toMatchSnapshot()
})
```

## 2. 实现

```ts
// 这里主要的实现就是将 code string 一直不停的追加
export function codegen(ast) {
  const context = createCodegenContext()
  const { push } = context
  const funcName = 'render'
  push(`export `)
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${funcName}(${signature}) { `)
  push(`return `)
  genNode(ast.codegenNode, context)
  push(` }`)
  return context.code
}

function genNode(node, context) {
  const { push } = context
  push(`'${node.content}'`)
}

// 将 code 封装，同时将追加 code 方法也封装，降低耦合
function createCodegenContext() {
  const context = {
    code: '',
    push(source: string) {
      context.code += source
    },
  }
  return context
}
```

