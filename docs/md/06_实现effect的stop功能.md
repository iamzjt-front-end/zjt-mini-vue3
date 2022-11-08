# 06_实现effect的stop功能

### 一、实现stop

#### 1. 单元测试

```js
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

通过以上单测，可以很明显地看出来，可以通过`stop`函数传入`runner`去停止数据的响应式，而当重新手动执行runner的时候，数据又会恢复响应式。

#### 2. 代码实现

从单测继续分析代码实现，通过`stop`函数传入`runner`，那就得继续回到`effect.ts`，首先导出一个`stop`函数。

```ts
export function stop(runner) {

}
```

再开始完善stop函数。

继续分析：

通过`runner`停止当前`effect`的响应式 -> 也就是从收集到当前`effect`的`dep`中将其删除，实际上是对`effect`
的操作，所以继续在`ReactiveEffect`上维护一个`stop`方法。

```ts
class ReactiveEffect {
  private _fn: any;

  // 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {

  }
}
```

大致思路明白了，接下来解决第一个问题：如何通过`runner`找到`ReactiveEffect`的实例，然后去调用`stop`。

答：在`function effect() {}`中将`_effect`挂载到`runner`上。

所以需要改写一下之前的代码：

```ts
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}
```

那么我们导出的`stop`函数的逻辑就清晰了。

```ts
export function stop(runner) {
  runner.effect.stop();
}
```

再来完善`ReactiveEffect`类的`stop`函数，也就是解决第二个问题：如何从收集到当前`effect`的`dep`中将其删除？

答：此时，我们并不知道当前`effect`存在于哪些`dep`中，所以考虑从`track`时入手，在`dep`收集`activeEffect`后，让`activeEffect`
反向收集`dep`，这样，就知道了当前`effect`所在的`dep`，接下来删掉就行了。

```js
dep.add(activeEffect);
activeEffect.deps.push(dep);
```

```ts
class ReactiveEffect {
  private _fn: any;
  deps = [];

  // 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {
    this.deps.forEach((dep: any) => {
      dep.delete(this);
    });
  }
}
```

功能完成后，继续看一下单测结果。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211080822280.png" width="666" alt="06_01_stop的单测结果"/>

#### 3. 代码优化

在完成功能以后，重新考虑对之前代码的实现。

1. 代码可读性的问题

   抽离将当前依赖从收集到的dep中删除的逻辑，命名为`cleanupEffect`，然后在类`ReactiveEffect`的`stop`
   中，直接调用`cleanupEffect(this)`即可。

   ```ts
   function cleanupEffect(effect: any) {
     effect.deps.forEach((dep: any) => {
       dep.delete(effect);
     });
   }
   ```

2. 性能问题

   当多次调用`stop`时，实际上第一次已经删除了，后续调用都没有实际意义，只会引起无意义的性能浪费。
   所以考虑给其一个`active`状态，当被`cleanupEffect`后，置为`false`，不再进行再次删除。

   ```ts
   class ReactiveEffect {
     private _fn: any;
     deps = [];
     active = true;
   
     // 在构造函数的参数上使用public等同于创建了同名的成员变量
     constructor(fn, public scheduler?) {
       this._fn = fn;
     }
   
     run() {
       activeEffect = this;
       return this._fn();
     }
   
     stop() {
       // 要从收集到当前依赖的dep中删除当前依赖activeEffect
       // 但是我们根本不知道activeEffect存在于哪些dep中，所以就要用activeEffect反向收集dep
       if (this.active) {
         cleanupEffect(this);
         this.active = false;
       }
     }
   }
   ```

---------------------------------------------------------------------------------------

### 二、实现onStop

#### 1. 单元测试

```js
it('onStop', () => {
  const obj = reactive({ prop: 1 });
  const onStop = jest.fn();
  let dummy;
  const runner = effect(
    () => {
      dummy = obj.foo;
    },
    {
      onStop,
    },
  );

  stop(runner);
  expect(onStop).toBeCalledTimes(1);
});
```

其实通过单测，可以看出功能跟stop有些类似，逻辑也很简单，就是通过`effect`的第二个参数，给定一个`onStop`
函数，当有这个函数时，我们再去调用`stop(runner)`
时，`onStop`就会被调用一次。

那么实现思路也就很清晰了，我们首先得在`ReactiveEffect`类中去接收这个函数，然后调用`stop`的时候，手动调用一下`onStop`即可。

#### 2. 代码实现：

```ts
class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  // + 定义函数可选
  onStop?: () => void;

  // 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }

  stop() {
    // 要从收集到当前依赖的dep中删除当前依赖activeEffect
    // 但是我们根本不知道activeEffect存在于哪些dep中，所以就要用activeEffect反向收集dep
    if (this.active) {
      cleanupEffect(this);
      // + 如果onStop有，就调用一次
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // + 接收onStop
  _effect.onStop = options.onStop;

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}
```

单测通过：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211090531550.png" width="666" alt="06_02_onStop单测结果"/>

#### 3. 代码优化

考虑到后续`options`可能还会传入很多其他选项，所以进行一下重构

```js
Object.assign(_effect, options);
```

感觉语义化稍弱，所以，就抽离出一个`extend`方法，又考虑到这个方法可以抽离成一个`工具函数`，所以在`src`下建立`shared`
目录，然后建立`index.ts`，专门放置各个模块通用的工具函数。

```js
// src/shared/index.ts

export const extend = Object.assign;

extend(_effect, options);
```

当然，重构完以后，别忘了重新跑一下`effect`单测。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211090603047.png" width="666" alt="06_03_onStop重构后的单测结果"/>

### 4. 解决问题的思路

可以看到effect的单测是通过的，那完成这一组功能后，继续完成的跑一下所有单测，看看是否对其他功能造成影响。

```shell
yarn test
```

果然，不出意外的话，出现意外了。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211090709131.png" width="888" alt="06_04_完整单测结果"/>

可以看到是`reactive`的`happy path`单测出了问题，而且`activeEffect`是个`undefined`，那我们回去重新看一下。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211090632425.png" width="666" alt="06_05_reactive单测"/>

不难看出`observed.foo`也是触发了`get`操作，也就是触发了`track`去收集依赖，而此时并没有`effect`
包裹着的依赖存在，所以`run`不会执行，也就没有`activeEffect`，所以此时我们并不应该去收集依赖，所以增加一个判断。

```js
if (!activeEffect) return;

dep.add(activeEffect);
activeEffect.deps.push(dep);
```

为了验证结果，再次跑一下全部的单测。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211090713460.png" width="666" alt="06_06_完整单测结果2"/>