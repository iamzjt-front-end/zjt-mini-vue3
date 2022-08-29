# 实现解析 element 标签

## 1. 测试样例

 ```ts
 test('simple element', () => {
   const elementStr = '<div></div>'
   const ast = baseParse(elementStr)
   expect(ast.children[0]).toStrictEqual({
     type: NodeType.ELEMENT,
     tag: 'div',
   })
 })
 ```

## 2. 实现

### 2.1 伪实现

我们先给 `NodeType` 枚举添加一种 `ELEMENT` 类型

```ts
function parseChildren(context: { source: string }): any {
  const nodes: any = []
  let node
  // 将 context.source 提取出来
  const s = context.source
  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
    // 如果第一位是 < 而且第二位是 a-z 的话，就进入到 parseElement
  } else if (s.startsWith('<') && /[a-z]/i.test(s[1])) {
    node = parseElement(context)
  }
  nodes.push(node)
  return [node]
}
```

```ts
// 为了使测试快速通过，我们可以先写一个伪实现
function parseElement(context: { source: string }): any {
  return {
    type: NodeType.ELEMENT,
    tag: 'div',
  }
}
```

### 2.2 实现

第一步就是将 `<div></div>` 中的 `div` 提取出来，我们可以来使用正则。

```
^<[a-z]*
```

通过这个正则可以将 `<div` 提取出来

```ts
function parseElement(context: { source: string }): any {
  return parseTag(context)
}

function parseTag(context: { source: string }) {
  // i 忽略大小写, ([a-z]*) 作为一个分组
  const match = /^<([a-z]*)/i.exec(context.source)
  // 其中 tag[1] 就是匹配出来的 div
  const tag = match![1]
  return {
    type: NodeType.ELEMENT,
    tag,
  }
}
```

然后别忘了还需要推进

```ts
function parseTag(context: { source: string }) {
  const match = /^<([a-z]*)/i.exec(context.source)
  const tag = match![1]
  // 增加推进，同时通过 match[0] 来获取匹配出的 <div 的长度
  // +1 意思是需要加上 >
  advanceBy(context, match![0].length + 1)
  return {
    type: NodeType.ELEMENT,
    tag,
  }
}
```

最后，推进后我们的 `context.source` 还剩下 `</div>`，此时我们发现和我们写好的匹配 `<div>` 的很像，只需要修改正则就好了

```
^<\/?[a-z]*
```

```ts
function parseElement(context: { source: string }): any {
  // 这里调用两次 parseTag 处理前后标签
  const element = parseTag(context)
  parseTag(context)
  return element
}

function parseTag(context: { source: string }) {
  // 修改正则
  const match = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match![1]
  advanceBy(context, match![0].length + 1)
  return {
    type: NodeType.ELEMENT,
    tag,
  }
}
```

### 2.3 优化

再处理结束标签的时候我们发现不需要 `return` 了，所以可以优化一下

```ts
// 增加枚举
const enum TagType {
  START,
  END,
}

function parseElement(context: { source: string }): any {
  // 传入类型
  const element = parseTag(context, TagType.START)
  parseTag(context, TagType.END)
  return element
}

function parseTag(context: { source: string }, type: TagType) {
  const match = /^<\/?([a-z]*)/i.exec(context.source)
  const tag = match![1]
  advanceBy(context, match![0].length + 1)
  // 如果是 TagType.END 就不需要 return
  if (type === TagType.END) return
  return {
    type: NodeType.ELEMENT,
    tag,
  }
}
```

 