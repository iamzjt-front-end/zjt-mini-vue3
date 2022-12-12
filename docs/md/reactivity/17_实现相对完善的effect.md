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

首先，我们需要明确的一点是：什么是分支切换？

在上述单测中，可以看到，`conditionalSpy`中存在一个三元表达式，根据`obj.run`的值不同，会执行不同的代码分支。并且当`obj.run`
的值发生变化时，分支也会随之变更，这就是所谓的分支切换。

根据某个响应式对象值的变化，可能会增加或减少“活跃”响应式对象。  
增加倒是还好，`get`操作会触发`track`进行收集起来；  
减少的话，我们似乎目前并没有进行处理。那就意味着，会存在冗余依赖，那再次`trigger`的时候，也就会触发不必要地更新。

下面我们分步来具体讲解一下。

在第一段单测中，运行的过程中会发现报错了，报错信息如下：

[//]: # (todo 截图)

然后在点击进入到报错位置，打上断点，开始调试。

发现`dep`的值是`undefined`，然后再看`depsMap`中，只有`run`属性的依赖。  
这个很容易理解，因为`effect`首次运行时，只读取了`run`的值，自然就只有`run`被收集起来。



在第二段单测中，初始的依赖对应关系如下：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060614734.png" width="388" alt="17_01_分支切换前依赖对应关系图"/>

当`obj.run`的值变成`false`时，分支随之切换，再次对应的依赖关系应该如下图：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060618463.png" width="388" alt="17_02_分支切换后依赖对应关系图"/>

而当我们另外在调试过程中，却发现：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060700376.png" width="999" alt="17_03_run变化调试"/>

当`obj.run`变成`false`时，`targetMap`中依旧对应的是`run`和`prop`的依赖。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212060702642.png" width="999" alt="17_04_props变化调试"/> 

继续往下走，当`obj.prop`变化时，也触发了`trigger`，并且取到了依赖，触发更新。

但这并不是我们所期望的，一方面，我们希望的是当分支不活跃时，理应冗余依赖应从`targetMap`中删除；  
另一方面，就算不活跃分支中的响应式对象发生变化，也不需要去进行这种不必要地更新，因为无论更不更新都不会影响程序运行的结果且浪费性能。

##### 3. 单测结果


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

##### 2. 完善逻辑


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