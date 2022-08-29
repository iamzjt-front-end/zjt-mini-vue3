# 更新children（四）

在本小节中，我们将会去实现 `array` => `array` 中间对比的最复杂的情况：

- 移动节点
- 新增节点

## 1. 移动节点

### 1.1 例子

```ts
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
]

const nextChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
]
```

- 旧节点：A B C D E F G
- 新节点：A B E C D F G
- 通过新旧对比我们发现，最终需要移动 E 的位置就好了

### 1.2 实现

#### 试想

一种暴力解法：

- 获取到混乱的部分，最终全部重排，虽然也是能够实现最终的效果的
- 但是性能有很大的浪费，因为调用 DOM API 的性能是非常差的，所以我们还是需要一种算法，来找到最精准的点。

在 Vue 3 中，使用了`最长递增子序列`的方式来获取到了稳定的序列（也就是不会变的）序列，举个例子：

- 老节点：B C D
- 新节点：D B C
- 其中 `B` 和 `C` 保持着一种稳定序列的关系，即 B 永远是在 C 的前面
- 最长递增子序列的算法就是去找到某个序列中最长的稳定序列。

通过 `getSequence` 获取递增序列的在混乱部分中的索引：

- 得到旧节点混乱部分的索引：C D E -> 2 3 4
- 得到新节点混乱部分的索引：E C D 每一项对应旧节点最终得出是：4 2 3
- 调用 `getSequence` 来获取到最长递增子序列在原数组中的索引是 `1 2`
- 对比新节点第一项 E 对应的混乱索引是 0，在最长递增子序列中不存在
- 表示要移动

![diff-6](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/vue-diff-06.gif)

#### 实现

我们需要一个映射用于储存每一项在旧节点中的索引

```ts
// 储存旧节点混乱元素的索引，创建定长数组，性能更好
const newIndexToOldIndexMap = new Array(toBePatched)
// 循环初始化每一项索引，0 表示未建立映射关系
for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
```

对每一项建立索引，我们在确定旧节点在新节点存在，并 `patch` 的时候，对每一项节点储存一下索引

```ts
// 遍历老节点循环体中，此时 i = 当前遍历的老节点元素的索引
if (newIndex === undefined) {
  hostRemove(prevChild.el)
} else {
  // 确定新节点存在，储存索引映射关系
  // newIndex 获取到当前老节点在新节点中的元素，减去 s2 是要将整个混乱的部分拆开，索引归于 0
  // 为什么是 i + 1 是因为需要考虑 i 是 0 的情况，因为我们的索引映射表中 0 表示的是初始化状态
  // 所以不能是 0，因此需要用到 i + 1
  newIndexToOldIndexMap[newIndex - s2] = i + 1
  patch(prevChild, c2[newIndex], container, parentInstance, null)
  patched += 1
}
```

在最后的部分，我们需要对索引映射进行处理，首先，我们需要调用 `getSequence` 来获取最长递增子序列在原数组中的索引

```ts
// 最后部分
// 获取最长递增子序列索引
const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
// 需要两个指针 i,j
// j 指向获取出来的最长递增子序列的索引
// i 指向我们新节点
let j = 0
for (let i = 0; i < toBePatched; i++) {
  if (i !== increasingNewIndexSequence[j]) {
    // 移动
    console.log('移动位置', c2[i + s2])
  } else {
    // 不移动
    console.log('不移动', c2[i + s2])
    j += 1
  }
}
```

此时结合我们最开始的例子，就可以得出：

- E，移动位置
- C、D 不移动位置

#### 优化

如果此时你发现直接顺序遍历，可能会出现很奇怪的情况，例如我们看看另一种情况：

- 旧节点：A B C D E F G
- 新节点：A B E C D F G
- 我们按照顺序去循环新节点，虽然找到第一个要移动的 E 了，但是由于我们是通过 `insertBefore` 来实现的，需要一个锚点，此时我们的锚点就是就是 `C`(因为他是混乱元素的第一个)，但是我们在当前的循环中，我们并不知道 `C` 是移动还是不移动，直接插入到 `C`元素之前是不可取的的行为。我们需要找到一个稳定的元素，就是最终的 `F`
- 所以我们需要更改最终遍历的顺序，我们要倒序进行遍历。

```ts
let j = increasingNewIndexSequence.length - 1
for (let i = toBePatched - 1; i >= 0; i--) {
  // 获取元素的索引
  const nextIndex = i + s2
  // 获取到需要插入的元素
  const nextChild = c2[nextIndex]
  // 获取锚点
  const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
  if (i !== increasingNewIndexSequence[j]) {
    // 移动
    hostInsert(nextChild.el, container, anchor)
  } else {
    j -= 1
  }
}
```

![diff-7](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/vue-diff-07.gif)

最后，这个判断可以来优化一下：

```ts
if (i !== increasingNewIndexSequence[j]) {
  // 移动
  hostInsert(nextChild.el, container, anchor)
} else {
  j -= 1
}
```

变成

```ts
// 增加 j <= 0 判断
if (j <= 0 || i !== increasingNewIndexSequence[j]) {
  // 移动
  hostInsert(nextChild.el, container, anchor)
} else {
  j -= 1
}
```

#### 优化（二）

其实我们还是有优化的点的，如果说我们的新旧节点对比不需要移动，那么再去判断最长递增子序列就没有必要了。那么这个该如何判断呢？其实我们只需要判断节点是一直在递增的就可以了，如果节点是一直有递增关系的，那么就不需要移动，如果没有递增关系，那么就可以理解为是需要移动的。 

增加两个变量

```ts
// 应该移动
let shouldMove = false
// 目前最大的索引
let maxNewIndexSoFar = 0
```

```ts
if (newIndex === undefined) {
  hostRemove(prevChild.el)
} else {
  // 在储存索引的时候
  // 判断是否需要移动
  // 如果说当前的索引 >= 记录的最大索引
  if (newIndex >= maxNewIndexSoFar) {
    // 就把当前的索引给到最大的索引
    maxNewIndexSoFar = newIndex
  } else {
    // 否则就不是一直递增，那么就是需要移动的
    shouldMove = true
  }
  newIndexToOldIndexMap[newIndex - s2] = i + 1
  patch(prevChild, c2[newIndex], container, parentInstance, null)
  patched += 1
}
```

然后在计算最长递增子序列的时候进行判断，如果应该移动，那么就计算，如果不应该移动，直接给定一个空数组就好了

```ts
const increasingNewIndexSequence = shouldMove
        ? getSequence(newIndexToOldIndexMap)
        : []
for (let i = toBePatched - 1; i >= 0; i--) {
  const nextIndex = i + s2
  const nextChild = c2[nextIndex]
  const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
  // 在这里也进行一个判断
  if (shouldMove) {
    if (j < 0 || i !== increasingNewIndexSequence[j]) {
      hostInsert(nextChild.el, container, anchor)
    } else {
      j -= 1
    }
  }
}
```

## 2. 创建节点

### 2.1 例子

```ts
const prevChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];

const nextChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "C" }, "C"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];
```

- 旧节点：A B C E F G
- 新节点：A B E C D F G
- 对比新旧节点我们发现，需要移动 E 的位置，同时创建 D

### 2.2 实现

在这里我们的主要逻辑其实就已经实现完毕了，因为我们建立了一个索引映射表，如果某一项的索引是 0，那么就说明这一项在旧节点中找不到，那么这一项就是需要新建的。

```ts
// 在最终处理索引映射表的时候
for (let i = toBePatched - 1; i >= 0; i--) {
  const nextIndex = i + s2
  const nextChild = c2[nextIndex]
  const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
  // 如果说某一项是0，证明这一项在旧节点中不存在，那么就需要创建了
  if (newIndexToOldIndexMap[i] === 0) {
    // 创建
    patch(null, nextChild, container, parentInstance, anchor)
  } else if (shouldMove) {
   	// 处理移动
  }
}
```

至此，diff 算法结束。

