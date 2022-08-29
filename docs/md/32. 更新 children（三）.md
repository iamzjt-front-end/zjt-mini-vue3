# 更新 chilren（二）

在本小节中，我们将会去实现 `array` => `array` 中间对比的一种简单情况：

- 旧的比新的多，删除

## 1. 例子

[例子](https://github.com/zx-projects/mini-vue/blob/main/example/patchChildren/ArrayToArray.js)

- 5.1.1、5.1.2

## 2. 实现

我们在上一个小节中，已经实现了新旧节点的首尾对比，在这个小节中呢，我们将会涉及到对比中间节点了。

### 2.1 例子

```ts
const prevChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C', id: 'c-prev' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
]

const nextChildren = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'C', id: 'c-next' }, 'C'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
]
```

- 旧节点：A B C D F G
- 新节点：A B E C F G
- 新旧节点对比我们发现旧的比新的多 D，所以需要删除掉旧的中的 D

### 2.2 实现

我们已经可以通过上一小节实现的前后对比确定混乱的部分：

![diff-3](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/vue-diff-03.gif)

此时指针：

- `i`：2
- `e1`: 3
- `e2`: 3

下面我们要做的就是要判断出老的部分是否是多出来了，我们可以使用映射来对比

```ts
// render.ts

function patchKeyedChildren(c1, c2, container, parentInstance, anchor) {
  // 前后对比结束
  if (i > e1) {
    // 新的比老的多
  } else if (i > e2) {
    // 新的比老的少
  } else {
    // 对比中间部分
    let s1 = i
    let s2 = i
    // c2 混乱部分映射
    const keyToNewIndexMap = new Map()
    // 添加映射
    for (let i = s2; i <= e2; i++) {
      const nextChild = c2[i]
      keyToNewIndexMap.set(nextChild.key, i)
    }
    // 循环老的，根据映射找
    for (let i = s1; i <= e1; i++) {
      const prevChild = c1[i]
      let newIndex
      // 如果当前老的子节点的 key 不是空的
      if (prevChild.key !== null) {
        // 就去映射表中找到新的对应的 newIndex
        newIndex = keyToNewIndexMap.get(prevChild.key)
      } else {
        // 如果老的子节点的 key 是空的，还需要再次遍历新节点，找到与当前老节点相同的 VNode，并将其索引赋给 j
        for (let j = s2; j <= e2; j++) {
          if (isSameVNode(prevChild, c2[j])) {
            newIndex = j
            break
          }
        }
      }
      // 如果新节点中不存在对应的老节点，那么就删除掉老节点
      if (newIndex === undefined) {
        hostRemove(prevChild.el)
      } else {
        // 如果存在，就进入到 patch 阶段，继续递归对比
        patch(prevChild, c2[newIndex], container, parentInstance, null)
      }
    }
  }
}
```

![diff-4](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/vue-diff-04.gif)

- 以上的动画对应的是`老节点有 key` 的情况下
- 如果老节点没有 `key` 那么，还需要遍历一次新节点通过 `isSameVNode`，以确认**老节点是否在新节点中**

## 3. 优化

### 3.1 例子

```ts
const prevChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "C", id: "c-prev" }, "C"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];

const nextChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "C", id:"c-next" }, "C"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G"),
];
```

- 旧节点：A B C E D F G
- 新节点：A B E C F G
- 我们发现，旧节点是比新节点多的，按照现有逻辑来说，我们先遍历新节点进行储存映射
- 旧节点因为比新节点多，所以我们可以直接把多出来的旧节点直接删除掉

### 3.2 实现

添加一个两个变量：

```ts
// 添加变量 toBePatched，用于记录所有需要 patch 的节点，也就是目前新节点的混乱部分的个数
const toBePatched = e2 - s2 + 1
// patched 是当前的 patch 过的个数
let patched = 0
```

在循环老节点的时候进行判断

```ts
if (patched >= toBePatched) {
  // 如果当前 patched 的个数 >= 应该 patched 的个数
  // 那么直接删除
  hostRemove(prevChild.el)
  continue
}
```

我们来看看动画：

![diff-5](https://raw.githubusercontent.com/zx-projects/mini-vue-docs/main/images/diff/vue-diff-05.gif)