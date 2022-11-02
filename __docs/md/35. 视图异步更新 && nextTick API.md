# 视图异步更新 && nextTick API

在本小节中，我们将会实现视图异步更新，以及实现 `nextTick` API

## 1. 例子

```ts
export default {
  setup() {
    const count = ref(1)
    function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log('update')
        count.value = i
      }
    }

    return {
      onClick,
      count,
    }
  },
  render() {
    const button = h('button', { onClick: this.onClick }, 'update')
    const p = h('p', {}, 'count:' + this.count)
    return h('div', {}, [button, p])
  },
}
```

- 这个例子会进行 100 次循环，在每次循环时，对视图的依赖进行更新
- 而由于视图的依赖触发了更新，那么就会触发重新生成 VNode、对比、更新
- 这也就导致了，更新流程被触发了 100 次。

- 这样的性能开销是非常大的

## 2. 视图异步更新

由于循环是同步代码，根据浏览器任务队列，微任务队列中的任务等待同步任务执行完毕后进行调用栈进行执行，所以核心优化点就是，**我们只需要将依赖更新导致触发更新逻辑的流程加入到微任务队列中就可以了**

```ts
function setupRenderEffect(instance, vnode, container, anchor) {
  instance.update = effect(() => {
    // 渲染和更新逻辑
    // 如果视图依赖发生变化，那么会重新进入到该函数中，我们只需要将此次渲染任务加入到微任务队列中就可以了。
  })
}
```

那么该怎么加呢？还记得 `scheduler` 嘛？当一个 `effect` 函数有了 `scheduler` 之后，后续的依赖更新将只会执行 `scheduler` 而不是传入的函数。

```ts
function setupRenderEffect(instance, vnode, container, anchor) {
  instance.update = effect(
    () => {
    },
    {
      scheduler() {
        // 将本次 update 加入到任务队列中
        queueJobs(instance.update)
      },
    }
  )
}
```

```ts
// scheduler
const queue: any[] = []
let isFlushPending = false

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}

function queueFlush() {
  // 使用 Promise 来在下一次异步任务清空时进行清空当前的视图渲染的异步队列
  // 使用 shift() 从头部开始清理
  if (isFlushPending) return
  isFlushPending = true
  Promise.resolve().then(() => {
    isFlushPending = false
    let job
    while ((job = queue.shift())) {
      job && job()
    }
  })
}
```

现在我们的视图已经是异步更新了，等待所有同步代码执行完毕后，开始清空微任务队列中的更新视图任务

## 3. 实现 nextTick API

我们可以通过 `nextTick` API 来获取下一次更新视图时的数据

```ts
// 举个例子
const count = ref(1)
const instance = getCurrentInstance()
function onClick() {
  for (let i = 0; i < 100; i++) {
    count.value = i
  }
  // 此时 count 的值应该还是 1
  console.log({ instance })
  // 通过这两种方式可以等待到异步更新完毕视图后再执行代码
  nextTick(() => {
    console.log({ instance })
  })
  await nextTick()
  console.log({ instance })
}
```

```ts
const queue: any[] = []
let isFlushPending = false
let p = Promise.resolve()

// 添加 nextTick API
export function nextTick(fn) {
  return fn ? p.then(fn) : p
}

```

然后我们可以重构这一部分的代码

```diff
const queue: any[] = []
let isFlushPending = false
let p = Promise.resolve()

export function nextTick(fn) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
 queueFlush()
}

function queueFlush() {
  // 使用 Promise 来在下一次异步任务清空时进行清空当前的视图渲染的异步队列
  // 使用 shift() 从头部开始清理
  if (isFlushPending) return
  isFlushPending = true
+ nextTick(flushJobs)
-	Promise.resolve().then(() => {
-    isFlushPending = false
-    let job
-    while ((job = queue.shift())) {
-      job && job()
-    }
-  })
}

+ function flushJobs() {
+   isFlushPending = false
+   let job
+   while ((job = queue.shift())) {
+     job && job()
+   }
+ }
```

最后就完事了

