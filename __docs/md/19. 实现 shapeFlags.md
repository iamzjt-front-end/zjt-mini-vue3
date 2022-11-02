# 实现 shapeFlags

我们在 `render.ts` 中对于 vnode 的类型进行判断，这里进行判断的类型我们发现一共有 4 种：

- element：`vnode.type === string`
- stateful_component：`isObject(vnode.type)`
- text_children：`vnode.type === string`
- array_children：`Array.isArray(children)`

```ts
export function patch(vnode, container) {
  if (typeof vnode.type === 'string') {
    processElement(vnode, container)
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container)
  }
}

function mountElement(vnode, container) {
  // other code ...
  if (typeof children === 'string') {
    domEl.textContent = children
  } else if (Array.isArray(children)) {
    mountChildren(vnode, domEl)
  }
}
```

## 1. v1 版本

我们可以将所有的判断抽离出来，统一管理

```ts
// 我们用 0 来代表 false，1 来代表 true
const ShapeFlags = {
  element: 0,
  stateful_component: 0,
  text_children: 0,
  array_children: 0,
}
```

```ts
// 更新
vnode.shapeFlags.element = 1

// 查找
if (vnode.shapeFlags.element === ShapeFlags.element) {
}
```

此时我们已经将判断单独抽离开了，下面我们还可以进行性能方面的优化

## 2. v2 版本

### 2.1 & 和 |

首先，我们先复习一下 & 和 |

#### 2.1.1 &

&：按位与，用于对两个二进制操作数逐位进行比较，并根据下表所示的换算表返回结果。

| 第一个数的值 | 第二个数的值 | 运算结果 |
| ------------ | ------------ | -------- |
| 1            | 1            | 1        |
| 1            | 0            | 0        |
| 0            | 1            | 0        |
| 0            | 0            | 0        |

以 0 作为 false，以 1 作为 true，简单理解就是：

- true & true = true
- true & false = false
- false & true = false
- false & false = false
- 两位都是 true 才是 true，反之所有的都是 false

```ts
console.log(12 & 5);  //返回值4
```

下图以算式的形式解析了 12 和 5 进行位与运算的过程。通过位与运算，只有第 3 位的值为全为 true，故返回 true，其他位均返回 false。

![img](..\images\按位与.gif)

#### 2.1.2 |

|：按位或，用于对两个二进制操作数逐位进行比较，并根据如表格所示的换算表返回结果。

| 第一个数的值 | 第二个数的值 | 运算结果 |
| ------------ | ------------ | -------- |
| 1            | 1            | 1        |
| 1            | 0            | 1        |
| 0            | 1            | 1        |
| 0            | 0            | 0        |

以 0 作为 false，以 1 作为 true，简单理解就是：

- true & true = true
- true & false = true
- false & true = true
- false & false = false
- 两位都是 false 才是 false，反之所有的都是 true

```ts
console.log(12 | 5);  //返回值13
```

下图以算式的形式解析了 12 和 5 进行位或运算的过程。通过位或运算，除第 2 位的值为 false 外，其他位均返回 true。

![img](..\images\按位或.gif)

### 2.2 左移操作符

**左移操作符 (`<<`)** 是将一个操作数按指定移动的位数向左移动。 

```ts
1 << 1 // 0001 -> 0010

1 << 3 // 0001 -> 1000
```

### 2.3 实现 v2 版本

通过对于按位与、按位或和左移操作符的理解，我们不难想象，可以将一个 shapeFlag 修改为下面这样：

```ts
const ShapeFlags = {
  element: 1, // 0001
  stateful_component: 1 << 1, // 0010
  text_children: 1 << 2, // 0100
  array_children: 1 << 3, // 1000
}
```

```ts
// 更新
vnode.shapeFlag.element = ShapeFlags.element

// 查询
if(vnode.shapeFlag.element === ShapeFlags.element){
    
}
```

下面我们就动手开始实现吧，首先在 shared 中创建一个文件 `ShapeFlags`

```ts
// shared/ShapeFlags.ts
export const enum ShapeFlags {
  ELEMENT = 1,
  STATEFUL_COMPONENT = 1 << 1,
  TEXT_CHILDREN = 1 << 2,
  ARRAY_CHILDREN = 1 << 3,
}
```

```ts
import { ShapeFlags } from '../shared/ShapeFlags'

export function createVNode(type, props?, children?) {
  // 这里先直接返回一个 VNode 结构
  const vnode = {
    type,
    props,
    children,
    el: null,
    shapeFlags: getShapeFlags(type),
  }
  // 还要对于 children 进行处理
  if (typeof children === 'string') {
    // 或运算符，vnode.shapeFlags | ShapeFlags.TEXT_CHILDREN
    // 这里其实非常巧妙，例如我们现在是 0001，0001 | 0100 = 0101
    vnode.shapeFlags |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    // 这里也是同理
    vnode.shapeFlags |= ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}

function getShapeFlags(type) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
```

这里做好了判断，下面我们就可以去修改判断部分了

```ts
// render.ts
export function patch(vnode, container) {
  const { shapeFlags } = vnode
  // 这里就用到了按位与了，只有都是 true，才是 true，才会进入下面
  if (shapeFlags & ShapeFlags.ELEMENT) {
    processElement(vnode, container)
  } else if (shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container)
  }
}


function mountElement(vnode, container) {
  // 解构出 shapeFlags
  const { type: domElType, props, children, shapeFlags } = vnode
  // 进行按位与判断
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    domEl.textContent = children
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, domEl)
  }
}
```

下面我们再进行打包，查看功能是否正常

### 2.4 v2 版本有什么好处

- 其实功能 v1 版本就已经实现了，但是我们为什么要舍弃可读性来实现 v2 版本呢？
- 首先，这一块的判断应该是要非常频繁执行的，一般一个项目的 render 过程中要有非常多的节点，所以会进行非常多的判断
- 虽然在程序开发中可读性 >> 性能，但是这一块的性能压力很大，而使用位运算会提升很大部分的性能
- 所以这里就使用了位运算

