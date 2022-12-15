# 17_实现相对完善的effect

### 一、我们要优化哪些点？

在上篇[实现相对完善的reactive](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/16_实现相对完善的reactive.md)
后，那我们继续来实现相对完善的`effect`。

首先我们还是列举一些对`effect`的简单考虑：

- `分支切换`，也就是不同条件执行不同代码，例如：三元表达式。
- 嵌套`effect`的情况，应该如何处理？
- `prop++`的情况，既读又取导致无限递归，栈溢出的情况。

### 二、effect相关考虑完善

#### （一）分支切换问题

##### 1. 单测用例

```ts
it('should discover new branches while running automatically', () => {
  let dummy;
  const obj = reactive({ prop: 'value', run: false });

  const conditionalSpy = jest.fn(() => {
    dummy = obj.run ? obj.prop : 'other';
  });
  effect(conditionalSpy);

  expect(dummy).toBe('other');
  expect(conditionalSpy).toHaveBeenCalledTimes(1);

  obj.prop = 'Hi';
  expect(dummy).toBe('other');
  expect(conditionalSpy).toHaveBeenCalledTimes(1);

  obj.run = true;
  expect(dummy).toBe('Hi');
  expect(conditionalSpy).toHaveBeenCalledTimes(2);

  obj.prop = 'World';
  expect(dummy).toBe('World');
  expect(conditionalSpy).toHaveBeenCalledTimes(3);
});
```

```ts
it('should not be triggered by mutating a property, which is used in an inactive branch', () => {
  let dummy;
  const obj = reactive({ prop: 'value', run: true });

  const conditionalSpy = jest.fn(() => {
    dummy = obj.run ? obj.prop : 'other';
  });
  effect(conditionalSpy);

  expect(dummy).toBe('value');
  expect(conditionalSpy).toHaveBeenCalledTimes(1);

  obj.run = false;
  expect(dummy).toBe('other');
  expect(conditionalSpy).toHaveBeenCalledTimes(2);

  obj.prop = 'value2';
  expect(dummy).toBe('other');
  expect(conditionalSpy).toHaveBeenCalledTimes(2);
});
```

##### 2. 完善逻辑

###### 2.1. 前置概念

首先，我们需要明确的一点是：什么是分支切换？

在上述单测中，可以看到，`conditionalSpy`中存在一个三元表达式，根据`obj.run`的值不同，会执行不同的代码分支。并且当`obj.run`
的值发生变化时，分支也会随之变更，这就是所谓的分支切换。

根据某个响应式对象值的变化，可能会增加或减少“活跃”响应式对象。  
增加倒是还好，`get`操作会触发`track`进行收集起来；  
减少的话，我们似乎目前并没有进行处理。那就意味着，会存在冗余依赖，那再次`trigger`的时候，也就会触发不必要地更新。

###### 2.2. 通过第一个单测

下面我们分步来具体讲解一下。

在第一段单测中，运行的过程中会发现报错了，报错信息如下：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212130528482.png" width="999" alt="17_01_第一段单测报错信息"/>

然后在点击进入到报错位置，打上断点，开始调试。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212130544132.png" width="999" alt="17_02_第一段单测调试"/>

发现`dep`的值是`undefined`，而下面还接着去遍历了`undefined`，所以报错了。  
然后再看`depsMap`中，只有`run`属性的依赖。这个很容易理解，因为`effect`首次运行时，只读取了`run`的值，自然就只有`run`被收集起来。

那完善思路就很明确了，只要`dep`存在，才继续往下运行。

```ts
// src/reactivity/effect.ts

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  // + 考虑到depsMap可能也会没有，这里我们也加上
  if (!depsMap) return;

  let dep = depsMap.get(key);
  // + 如果没有dep，则直接终止运行
  if (!dep) return;

  triggerEffects(dep);
}
```

再跑一遍第一段单测。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212130605186.png" width="999" alt="17_07_第一段测试通过"/>

可以看到测试已通过。

###### 2.3. 通过第二个单测

在第二段单测中，初始的依赖对应关系如下：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060614734.png" width="388" alt="17_03_分支切换前依赖对应关系"/>

当`obj.run`的值变成`false`时，分支随之切换，再次对应的依赖关系应该如下图：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060618463.png" width="388" alt="17_04_分支切换后依赖对应关系"/>

而当我们另外在调试过程中，却发现：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060700376.png" width="999" alt="17_05_run变化调试"/>

当`obj.run`变成`false`时，`targetMap`中依旧对应的是`run`和`prop`的依赖。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060702642.png" width="999" alt="17_06_props变化调试"/> 

继续往下走，当`obj.prop`变化时，也触发了`trigger`，并且取到了依赖，触发更新。

但这并不是我们所期望的，一方面，我们希望的是当分支不活跃时，理应冗余依赖应从`targetMap`中删除；  
另一方面，就算不活跃分支中的响应式对象发生变化，也不需要去进行这种不必要地更新，因为无论更不更新都不会影响程序运行的结果且浪费性能。

那实现思路就很清晰了，我们只需要在每次收集依赖前将依赖全部清空，然后再重新收集即可。

```ts
// src/reactivity/effect.ts

export class ReactiveEffect {
  // ... 省略部分代码

  run() {
    // 已经被stop，那就直接返回结果
    if (!this.active) {
      return this._fn();
    }
    // 未stop，继续往下走
    // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
    shouldTrack = true;
    // + 清空依赖
    cleanupEffect(this);
    activeEffect = this;
    const result = this._fn();
    // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
    shouldTrack = false;

    return result;
  }

  // ... 省略部分代码
}
```

看上去好像结束了，就这么一行代码。  
但如果你尝试运行单测，会发现目前的实现会导致无限循环执行。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212160628264.png" width="666" alt="17_08_第二段单测无限循环"/>

原因在哪呢？

问题出在`triggerEffects`的`for of`循环中:  
这里会遍历执行`run`，而`run`运行中会`cleanupEffect(this)`清空所有依赖;
然后重新运行`this._fn()`原始依赖时，会继续进行依赖的收集，会重新添加到`dep`中。

就相当于下面这段代码：

```ts
const set = new Set([1]);

set.forEach(item => {
  set.delete(1);
  set.add(1);
  console.log('遍历中');
})
```

在浏览器中运行，会发现无限执行下去，内存暴增，最后卡死。

> 语言规范中对此有明确的说明：在调用`forEach`遍历`Set`
> 集合时，如果一个值已经被访问过了，但该值被删除并重新添加到集合，如果此时`forEach`遍历没有结束，那么该值会重新被访问。

因此，上面的代码会无限执行。  
解决办法很简单，那就是构造另外一个`Set`集合并遍历它，或者拓展成数组进行遍历。  
遍历的是新`Set`，而增删操作的是旧的`Set`，并不会造成什么影响。

```ts
const set = new Set([1]);
const newSet = new Set(set);
// const newArr = [...set];

newSet.forEach(item => {
  set.delete(1);
  set.add(1);
  console.log('遍历中');
})
```

那我们此处也采用同样的思路去解决。

```ts
export function triggerEffects(dep) {
  // + 重新构建一个新的 Set
  const effects = new Set<any>(dep);

  for (const effect of effects) {
    if (effect.scheduler) {
      // ps: effect._fn 为了让scheduler能拿到原始依赖
      effect.scheduler(effect._fn);
    } else {
      effect.run();
    }
  }
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212160632767.png" width="999" alt="17_09_第二段单测通过截图"/>

#### （二）嵌套effect问题

##### 1. 单测用例

```js
it('should allow nested effects', () => {
  const nums = reactive({ num1: 0, num2: 1, num3: 2 });
  const dummy: any = {};

  const childSpy = jest.fn(() => (dummy.num1 = nums.num1));
  const childEffect = effect(childSpy);
  const parentSpy = jest.fn(() => {
    dummy.num2 = nums.num2;
    childEffect();
    dummy.num3 = nums.num3;
  });
  effect(parentSpy);

  expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
  expect(parentSpy).toHaveBeenCalledTimes(1);
  expect(childSpy).toHaveBeenCalledTimes(2);

  // * 应该只触发childEffect
  nums.num1 = 4;
  expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
  expect(parentSpy).toHaveBeenCalledTimes(1);
  expect(childSpy).toHaveBeenCalledTimes(3);

  // * 触发parentEffect，触发一次childEffect
  nums.num2 = 10;
  expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
  expect(parentSpy).toHaveBeenCalledTimes(2);
  expect(childSpy).toHaveBeenCalledTimes(4);

  // * 触发parentEffect，触发一次childEffect
  nums.num3 = 7;
  expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
  expect(parentSpy).toHaveBeenCalledTimes(3);
  expect(childSpy).toHaveBeenCalledTimes(5);
});
```

首先明确一点：`effect`是可以嵌套的。

简单举个栗子就是：组件嵌套、计算属性。  
那有朋友就要问了，组件嵌套和effect嵌套有什么关系吗？  
其实关系就在于，组件中的`template`会被转成`render`函数，而组件要实现响应式，就得将`render`函数作为`ReactiveEffect`
的参数进行依赖收集。而当组件嵌套或者使用计算属性时，此时就会产生`effect`的嵌套，而这我们是需要支持的。

上面的单测就展示了`effect(parentSpy)`中嵌套了`childEffect`的情况，然后分别触发`num1`、`num2`和`num3`变化，然后观察`dummy`
的变化及`父子effect`的执行情况。

##### 2. 完善逻辑

首先先走一遍单测，看一下我们现有的代码哪里会不满足用例的需求。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212160639280.png" width="999" alt="17_09_effect嵌套单测报错截图"/>

通过报错信息可以看到，我们期望`num3`为7，但是实际上`num3`还是2。  
很显然，`num3`并没有被更新，也就是`nums.num3 = 7`，并没有触发到`parentSpy`的执行。  
那我们反推回去，可以猜测`依赖收集`时，`depsMap`中并没有收集到`num3`的依赖。  
为了验证这个猜想，打上断点，我们来调试一下。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212160643089.png" width="888" alt="17_10_effect嵌套调试截图"/>

通过调试，可以看出，`depsMap`中果然只有`num1`、`num2`的依赖。  
那为什么会造成这个情况呢？

我们使用`activeEffect`这个全局变量来存储通过`effect`注册的依赖，而这么做的话，我们一次只能存储一个依赖。  
当从`外层effect`进入`里层effect`时，内层函数的执行会覆盖`activeEffect`的值，`activeEffect`的指向从`parentSpy`转向`childSpy`。  
并且，这个指向的变化是不可逆的，没办法从里向外层转。


##### 3. 单测结果

#### （三）无限递归循环

##### 1. 单测用例

```js
it('should avoid implicit infinite recursive loops with itself', () => {
  const counter = reactive({ num: 0 });
  const counterSpy = jest.fn(() => counter.num++);

  effect(counterSpy);
  expect(counter.num).toBe(1);
  expect(counterSpy).toHaveBeenCalledTimes(1);
  counter.num = 4;
  expect(counter.num).toBe(5);
  expect(counterSpy).toHaveBeenCalledTimes(2);
});
```

##### 2. 完善逻辑


##### 3. 单测结果