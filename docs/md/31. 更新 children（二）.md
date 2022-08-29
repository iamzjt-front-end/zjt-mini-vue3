# 更新 chilren（二）

在本小节中，我们将会去实现 `array` => `array` 的四种简单情况：

- 新旧左端对比
- 新旧右端对比
- 新多新增
- 旧多删除

## 1. 例子

[例子](https://github.com/zx-projects/mini-vue/blob/main/example/patchChildren/ArrayToArray.js)

- 1、2、3、4

## 2. 前导知识

我们先试想一下，这里的 patchChildren 的意义是什么？当然是找到新旧节点不同的地方，颗粒化的更新视图。那么我们一般开发中时，会出现什么情况呢：

- 新节点比老节点多，创建多的新节点，在理想的情况下，新节点恰好在头部或者尾部
- 老节点比新节点多，删除多的老节点，在理想的情况下，需要删除的老节点恰好在头部或者尾部
- 如果在中间，那么会比较复杂，可能会涉及到移动、新增、删除等等。
- 那么我们还如何确定需要更新的部分呢？
- Vue 的 `diff` 采用双端对比的算法，首先对比头部，然后对比尾部，用于确认需要重点对比的中间部分

我们来看一张图：

![diff](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/mindmap/diff%20%E7%AE%97%E6%B3%95/%E4%B8%AD%E9%97%B4%E5%AF%B9%E6%AF%94.png)

- 如何确定混乱的部分（图中使用绿色圈起来的部分）
- 首先，对比新旧节点的首部，也就是 a,b 进行对比，对比到不同的部分，首部对比停止
- 然后，对比新旧节点的尾部，也就是 f,g 进行对比，对比到不同的部分，尾部对比停止
- 最后，就确定好了混乱的部分

## 3. 实现

### 3.1 核心

在本小节中，我们将只会对比头部和尾部，暂时不涉及到中间。那么对比是如何实现的呢？我们来看看下图：

![example](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/example.png)

其核心就是三个指针：

- `e1`：旧节点的尾部
- `e2`：新节点的尾部
- `i`：当前对比的节点

### 3.2 实现新旧节点头部对比

#### 例子

```ts
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
]
const nextChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
]
```

- 旧节点：A B C
- 新节点：A B C D

- 从头部开始对比

#### 实现

还记得我们之前在 `render` 中的对比 children 的函数吗

```ts
function patchChildren(c1, c2, container, parentInstance) {
  // other code ...
  // 这里已经进入到了新节点是 array 的情况了
  if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
    hostSetElementText(n1.el, '')
    mountChildren(c2, container, parentInstance)
  } else {
    // 对比 array -> array
    patchKeyedChildren(c1, c2, container, parentInstance)
  }
}
```

在 `patchKeyedChilren`中我们将会进行对比

```ts
function patchKeyedChildren(c1, c2, container, parentInstance) {
  // 声明三个指针，e1 是老节点最后一个元素，e2 是新节点最后一个元素，i 是当前对比的元素
  let e1 = c1.length - 1
  let e2 = c2.length - 1
  let i = 0
  // 目前我们用来两个节点是否一样暂时只用 type 和 key
  function isSameVNode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key
  }
  // 首先我们要从新旧节点头部开始对比
  while (i <= e1 && i <= e2) {
    // 从头部开始对比，如果当前对比的 vnode 相同
    // 就进入 patch 阶段，如果不相等，直接中断掉这个循环
    if (isSameVNode(c1[i], c2[i])) {
      patch(c1[i], c2[i], container, parentInstance)
    } else {
      break
    }
    i += 1
  }
}
```

由于我们用到了 `key`，所以在创建一个 VNode 节点的时候还要初始化 `key`

```ts
export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    el: null,
    // 初始化 key
    key: props ? props.key : null,
    shapeFlags: getShapeFlags(type),
  }
  // other code ...
}
```

最后，让我们再看一段动画

![diff-01](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/vue-diff-01.gif)

### 3.2 实现新旧节点尾部对比

#### 例子

```ts
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
]
const nextChildren = [
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
]
```

- 旧节点：A B C
- 新节点：D E B C

- 现在我们再对比头部就会出现问题，因为第一个就不一样，所以`i` 就会停下了

- 那么我们除了对比头部，还要对比尾部

#### 实现

```ts
function patchKeyedChildren(c1, c2, container, parentInstance) {
  // 声明三个指针，e1 是老节点最后一个元素，e2 是新节点最后一个元素，i 是当前对比的元素
  // 目前我们用来两个节点是否一样暂时只用 type 和 key
  // 首先我们要从新旧节点头部开始对比
  // 对比完了头部，我们还要对比尾部
  while (i <= e1 && i <= e2) {
    // 尾部这里就是对比尾部的了，所以是 n1[e1] 和 n1[e2]
    if (isSameVNode(c1[e1], c2[e2])) {
      patch(c1[e1], c2[e2], container, parentInstance)
    } else {
      break
    }
    // 这里也变成了 e1 -= 1, e2 -= 1
    e1 -= 1
    e2 -= 1
  }
}
```

我们来看看动画吧！

![diff-02](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/vue-diff-02-3.gif)

### 3.3 新节点比旧节点长，添加新节点 - 尾部

#### 例子

```ts
const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
const nextChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
]
```

- 旧节点：A B
- 新节点：A B C D
- 新节点比旧节点长，此时我们需要先进行对比
- 首先对比头部，最终 `i` 停留在 `2`也就是对比完`B`
- 然后进行尾部对比，因为第一个尾部就不相同 `D !== B`,所以 `e1` 和 `e2` 没变

#### 实现

最终我们进行了两轮对比后，发现这种情况下，其实是这样的：

```ts
i > e1 && i <= e2
```

所以就在对比的最后面：

```ts
if (i > e1) {
  if (i <= e2) {
    while (i <= e2) {
      patch(null, c2[i], container, parentInstance)
      i += 1
    }
  }
}
```

### 3.3 新节点比旧节点长，添加新节点 - 头部

#### 例子

```ts
const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
const nextChildren = [
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
]
```

- 旧节点：A B
- 新节点：C A B
- 新节点比旧节点长，此时我们需要先进行对比
- 首先对比头部，最终 `i` 停留在 `0`也就是对比完`A`和`C`
- 然后进行尾部对比，最终 `e1 = -1; e2 = 0`

#### 实现

最终进行两轮对比后，发现在这种情况下，其实是这样的：

```ts
i > e1 && i <= e2
```

此时我们直接使用 `patch` 就不对了，这是因为我们所写的逻辑都是 `$el.append()`，是直接追加的，所以像这种情况下我们不要直接追加而是需要加在最前面，这个时候我们可以改写我们的 DOM API

```ts
// runtime-dom/index

// 将 parent.append 修改为 insertBefore，这样就可以传入一个锚点
// 将会在这个锚点之前插入元素
// 如果这个锚点是 null，那么将会和 append 的行为一样
function insert(el, parent, anchor) {
  parent.insertBefore(el, anchor || null)
}
```

```ts
 if (i > e1) {
   if (i <= e2) {
     // nextPos 就是需要追加元素的索引
     // 如果这个新元素的索引已经超过了新节点的长度，那么说明是追加到尾部
     // anchor = null，如果没有超过新节点的长度，那么就是插入到某个位置
     // 此时 anchor = c2[nextPos].el，也就是这个新加元素的下一个元素
     const nextPos = e2 + 1
     const anchor = nextPos < l2 ? c2[nextPos].el : null
     while (i <= e2) {
       patch(null, c2[i], container, parentInstance)
       i += 1
     }
   }
 }
```

因为我们新添加了一个 `anchor` 参数，所以需要给函数们加入这个参数。

此时，添加新节点到头部的功能也已经实现了

### 3.4 新节点比旧节点短，删除旧节点 - 尾部

#### 例子

```ts
const prevChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "C" }, "C"),
];
const nextChildren = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];
```

- 旧节点：A B C
- 新节点：A B
- 新节点比旧节点短，此时我们需要先进行对比
- 首先对比头部，最终 `i` 停留在 `2` 也就是对比完`B`和`B`，此时 i 已经 > e2，停止比对头部
- 然后进行尾部对比，最终 `e1 = 2; e2 = 1`

#### 实现

通过这个例子对比，我们可以看出来：

```ts
i > e2
```

我们可以在对比后再次添加一个判断

```ts
function patchKeyedChildren(c1, c2, container, parentInstance, anchor) {
  // 对比头部和尾部
  if (i > e1) {
    // 新增
  } else if (i > e2) {
    // 删除
    while (i <= e1) {
      hostRemove(c1[i].el)
      i += 1
    }
  }
}
```

### 3.5 新节点比旧节点短，删除旧节点 - 头部

#### 例子

```ts
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
]
const nextChildren = [h('p', { key: 'B' }, 'B'), h('p', { key: 'C' }, 'C')]
```

- 旧节点：A B C
- 新节点：B C
- 新节点比旧节点短，此时我们需要先进行对比
- 首先对比头部，最终 `i` 停留在 `0` 因为新旧的第一个元素就不一样
- 然后进行尾部对比，最终 `e1 = 0; e2 = -1`

#### 实现

通过这个例子对比，我们可以看出来：

```ts
i > e2
```

这个时候我们发现和头部的判断是一样的，就可以复用头部的逻辑了