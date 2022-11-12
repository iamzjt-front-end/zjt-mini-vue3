# 09_优化stop功能

### 一、定位问题

既然标题是优化`stop`功能，那就意为着我们之前实现的`stop`功能是存在一定的缺陷了，或者说是不满足某些特定情况的，也就是边缘case。

先来回顾一下之前的测试案例：

```ts
it('stop', () => {
  let dummy;
  const obj = reactive({ prop: 1 });
  const runner = effect(() => {
    dummy = obj.prop;
  });

  obj.prop = 2;
  expect(dummy).toBe(2);

  stop(runner);
  obj.prop = 3;
  expect(dummy).toBe(2);

  runner();
  expect(dummy).toBe(3);
});
```

其实眼尖的小朋友应该发现了，你`stop`完以后，`obj.prop++`呢，响应式还是可以正确的被停止掉吗？

那既然这样，我们就更新一下测试案例，然后重新跑一遍。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211120622891.png" width="888" alt="09_01_边缘case首次单测结果"/>

通过结果，可以看出，期望值`Expected`是2，而实际收到的值`Received`却是3，那就意味着响应式并没有被正确停止，那具体是什么原因呢，我们不妨来调试一下看看过程。

首先在关键节点，打上断点。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211120658427.png" width="666" alt="09_02_断点位置1"/>

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211120659669.png" width="666" alt="09_03_断点位置2"/>

接下来用webstorm开始调试：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211120735770.png" width="888" alt="09_04_cleanEffect()中this存在"/>

首先当我们走到`cleanEffect(this)`这一步时，会发现`this`是存在的，且`deps`里面也是有值的。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211120739393.png" width="888" alt="09_05_deps被成功清空"/>

继续往下走，当`cleanEffect(this)`这一步执行完后，会发现`deps`中的`Set`都被清空了，也就是这个依赖也都从收集到的`dep`中被正确删除了。

乍一看，好像没啥问题，继续往下走。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211120746774.png" width="888" alt="09_06_重新触发get进入track"/>

发现又触发了`get`操作，读取的是`prop`这个属性。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211120749226.png" width="888" alt="09_07_被重新收集依赖和反向收集"/>

再往下走，会发现，又进入了`track`，`dep`中又被重新收集了依赖，`activeEffect.deps`又重新反向收集，所以我们之前的清空都白做了。
然后，又触发`set`，走`trigger`，执行`run`的时候，又触发了`get`，继续收集依赖，反向收集，然后`dummy`被更新成3，所以上面实际值是3，也就清晰了。

抓到元凶了！

```js
obj.prop = 3;
obj.prop++;
```

两种操作的区别就是：

- `obj.prop = 3;`只触发了`set`，并没有触发`get`。
- `obj.prop++`可以分解来看，`obj.prop = obj.prop + 1;`，所以既触发了`set`，又触发了`get`。

### 二、解决问题

清空过后的依赖，由于触发了`get`，导致又被重新收集回去。

既然定位到了问题所在，那接下来的难点就是如何解决这个问题？

那就由我们手动判断是否应该去收集这个依赖。很显然，当++的时候，我们并不希望去收集这个依赖。

```ts
// src/reactivity/effect.ts

let activeEffect;
let shouldTrack = false; // + 是否应该收集依赖

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

  if (!activeEffect) return;
  if (!shouldTrack) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}
```

那什么时候不应该去收集这个依赖呢，其实就是当我们`stop`过以后，这个依赖就不应该被收集了。

而且我们知道，`dep`收集到的依赖其实就是`activeEffect`，而`activeEffect`是在`run`的时候去赋值的。

那我们只需要根据是否已经被`stop`来区分，`run`的时候是否给`activeEffect`赋值。

然而`ReactiveEffect`类中的`active`状态就是用来判断是否已经被`stop`过，那么问题就迎刃而解了。

接下来进行处理：

```ts
// src/reactivity/effect.ts

let shouldTrack;

class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true; // 是否已经 stop 过，true 为 未stop
  onStop?: () => void;

  // 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    // 已经被stop，那就直接返回结果
    if (!this.active) {
      return this._fn();
    }
    // 未stop，继续往下走
    // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
    shouldTrack = false;

    return result;
  }

  stop() {
    // ...
  }
}
```


而`run`被调用只有三种情况：

1. 首次运行 -> _effect.run()
2. 运行runner -> runner() -> _effect.run()
3. trigger

第1，第2种情况，很显然没啥区别，而且我们也是希望此时要收集到依赖。

那么只有第3种情况的时候，我们并不想要再次收集依赖。

第3种情况我们来反推一下，也就是：触发`trigger` -> 触发`set`