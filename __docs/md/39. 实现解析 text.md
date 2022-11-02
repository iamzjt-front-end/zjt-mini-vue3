# 实现解析 text

## 1. 测试样例

```ts
test('simple text', () => {
  const textStr = 'simple text'
  const ast = baseParse(textStr)
  expect(ast.children[0]).toStrictEqual({
    type: NodeType.TEXT,
    content: 'simple text',
  })
})
```

## 2. 实现

### 2.1 实现

```ts
function parseChildren(context: { source: string }): any {
  const nodes: any = []
  let node
  const s = context.source
  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if (s.startsWith('<') && /[a-z]/i.test(s[1])) {
    node = parseElement(context)
  }
  // 如果上面两种都无法解析，那么就是普通的 text 节点
  if (!node) {
    node = parseText(context)
  }
  nodes.push(node)
  return [node]
}
```

```ts
function parseText(context: { source: string }): any {
  // 获取 content
  const content = context.source.slice(0)
  // 推进
  advanceBy(context, content.length)
  return {
    type: NodeType.TEXT,
    content,
  }
}
```

### 2.2 优化

我们发现 `context.source.slice` 在上面的代码也用到了，我们就可以抽离成为一个函数

```ts
function parseText(context: { source: string }): any {
  // 抽离成一个函数
  const content = parseTextData(context, context.source.length)
  advanceBy(context, content.length)
  return {
    type: NodeType.TEXT,
    content,
  }
}

function parseTextData(context: { source: string }, length) {
  return context.source.slice(0, length)
}
```

在 `parseInterpolation` 这个函数中也有重复的代码，也可以进行重构

