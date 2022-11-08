# 05_实现effect的scheduler功能

### 一、调度执行

说到`scheduler`，也就是`vue3`的调度器，可能大家还不是特别明白调度器的作用，先大概介绍一下。

> 可调度性是响应式系统非常重要的特性。首先我们要明确什么是可调度性。所谓可调度性，指的是当`trigger`
> 动作触发副作用函数重新执行时，有能力决定副作用函数执行的时机、次数以及方式。

> 有了调度函数，我们在`trigger`函数中触发副作用函数重新执行时，就可以直接调用用户传递的调度器函数，从而把控制权交给用户。

举个栗子：

```ts
const obj = reactive({ foo: 1 });

effect(() => {
  console.log(obj.foo);
})

obj.foo++;
obj.foo++;
```

首先在副作用函数中打印`obj.foo`的值，接着连续对其执行两次自增操作，输出如下：

```
   1
   2
   3
```

由输出结果可知，`obj.foo`的值一定会从1自增到3，2只是它的过渡状态。如果我们只关心最终结果而不关心过程，那么执行三次打印操作是多余的，我们期望的打印结果是：

```
   1
   3
```

那么就考虑传入调度器函数去帮助我们实现此功能，那由此需求，我们先来实现一下scheduler功能。

### 二、单元测试

首先还是藉由单测来梳理一下功能，这是直接从`vue3`源码中粘贴过来对`scheduler的`单测，里面很详细的描述了`scheduler`的功能。

```js
it('scheduler', () => {
  let dummy;
  let run: any;
  const scheduler = jest.fn(() => {
    run = runner;
  });
  const obj = reactive({ foo: 1 });
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    { scheduler },
  );
  expect(scheduler).not.toHaveBeenCalled();
  expect(dummy).toBe(1);
  // should be called on first trigger
  obj.foo++;
  expect(scheduler).toHaveBeenCalledTimes(1);
  // should not run yet
  expect(dummy).toBe(1);
  // manually run
  run();
  // should have run
  expect(dummy).toBe(2);
});
```

大概介绍一下这个单测的流程：

1. 通过 `effect` 的第二个参数给定的一个对象 `{ scheduler: () => {} }`, 属性是`scheduler`, 值是一个函数;
2. `effect` 第一次执行的时候, 还是会执行 `fn`;
3. 当响应式对象被 `set`，也就是数据 `update` 时, 如果 `scheduler` 存在, 则不会执行 `fn`, 而是执行 `scheduler`;
4. 当再次执行 `runner` 的时候, 才会再次的执行 `fn`.

### 三、代码实现

那接下来就直接开始代码实现功能，这里直接贴出完整代码了，**// +** 会标注出新增加的代码。

```ts
class ReactiveEffect {
  private _fn: any;

  // + 接收scheduler
  // + 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }
}

// * ============================== ↓ 依赖收集 track ↓ ============================== * //
// * targetMap: target -> key
const targetMap = new WeakMap();

// * target -> key -> dep
export function track(target, key) {
  // * depsMap: key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // * dep
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  dep.add(activeEffect);
}

// * ============================== ↓ 触发依赖 trigger ↓ ============================== * //
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  for (const effect of dep) {
    // + 判断是否有scheduler, 有则执行，无则执行fn
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect;

export function effect(fn, options: any = {}) {
  // + 直接将scheduler挂载到依赖上
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  return _effect.run.bind(_effect);
}
```

代码实现完成，那接下来看一下单测结果。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211070652467.png" width="666" alt="05_01_scheduler单测结果05_scheduler单测结果05_scheduler单测结果"/>

### 四、回归实现

好，现在我们再回到最初的栗子，在上面`scheduler`基础上，完成现有需求，继续看一下对此需求的单测。

```ts
it('job queue', () => {
  // 定义一个任务队列
  const jobQueue = new Set();
  // 使用 Promise.resolve() 创建一个 Promise 实例，我们用它将一个任务添加到微任务队列
  const p = Promise.resolve();

  // 一个标志代表是否正在刷新队列
  let isFlushing = false;

  function flushJob() {
    // 如果队列正在刷新，则什么都不做
    if (isFlushing) return;
    // 设置为true，代表正在刷新
    isFlushing = true;
    // 在微任务队列中刷新 jobQueue 队列
    p.then(() => {
      jobQueue.forEach((job: any) => job());
    }).finally(() => {
      // 结束后重置 isFlushing
      isFlushing = false;
      // 虽然scheduler执行两次，但是由于是Set，所以只有一项
      expect(jobQueue.size).toBe(1);
      // 期望最终结果拿数组存储后进行断言
      expect(logArr).toEqual([1, 3]);
    });
  }

  const obj = reactive({ foo: 1 });
  let logArr: number[] = [];

  effect(
    () => {
      logArr.push(obj.foo);
    },
    {
      scheduler(fn) {
        // 每次调度时，将副作用函数添加到 jobQueue 队列中
        jobQueue.add(fn);
        // 调用 flushJob 刷新队列
        flushJob();
      },
    },
  );

  obj.foo++;
  obj.foo++;

  expect(obj.foo).toBe(3);
});
```

在分析上段代码之前，为了辅助完成上述功能，我们需要回到`trigger`中，调整一下遍历执行，为了让我们的`scheduler`能拿到原始依赖。

```ts
for (const effect of dep) {
  // + 判断是否有scheduler, 有则执行，无则执行fn
  if (effect.scheduler) {
    effect.scheduler(effect._fn);
  } else {
    effect.run();
  }
}
```

再观察上面的单测代码，首先，我们定义了一个任务队列`jobQueue`，它是一个`Set`数据结构，目的是利用`Set`数据结构的自动去重功能。

接着我们看调度器`scheduler`的实现，在每次调度执行时，先将当前副作用函数添加到`jobQueue`队列中，再调用flushJob函数刷新队列。

然后我们把目光转向`flushJob`函数，该函数通过`isFlushing`标志判断是否需要执行，只有当其为`false`
时才需要执行，而一旦`flushJob`函数开始执行，`isFlushing`标志就会设置为true，意思是无论调用多少次`flushJob`函数，在一个周期内都只会执行一次。

需要注意的是，在`flushJob`内通过`p.then`将一个函数添加到`微任务队列`，在`微任务队列`内完成对`jobQueue`的遍历执行。

整段代码的效果是，连续对`obj.foo`执行两次自增操作，会同步且连续地执行两次`scheduler`
调度函数，这意味着同一个副作用函数会被`jobQueue.add(fn)`添加两次，但由于`Set`数据结构的去重能力，最终`jobQueue`
中只会有一项，即当前副作用函数。

类似地，`flushJob`也会同步且连续执行两次，但由于`isFlushing`标志的存在，实际上`flushJob`函数在一个事件循环内只会执行一次，即在微任务队列内执行一次。

当微任务队列开始执行时，就会遍历`jobQueue`并执行里面存储的副作用函数。由于此时`jobQueue`
队列内只有一个副作用函数，所以只会执行一次，并且当它执行时，字段`obj.foo`的值已经是3了，这样我们就实现了期望的输出。

再跑一遍完整流程，来看一下单测结果，确保新增代码不影响以往功能。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211071701323.png" width="666" alt="05_02_jobQueue的实现"/>

测试结束完以后，由于`job queue`是一个实际案例单测，所以我们将其抽离到`examples`下面的`testCase`里，建立`jobQueue.spec.ts`。

### 五、结语

可能你已经注意到了，这个功能点类似于在`Vue.js`中连续多次修改响应式数据但只会触发一次更新，实际上`Vue.js`
内部实现了一个更加完善的调度器，思路与上文介绍的相同。

此外，综合前面的这些内容，我们就可以实现`Vue.js`中一个非常重要且非常有特色的能力--`computed计算属性`，这个就后面再慢慢实现吧...