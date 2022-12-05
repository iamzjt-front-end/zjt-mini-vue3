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

1. 单测用例

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

2. 完善逻辑


3. 单测结果


#### （二）嵌套effect问题

1. 单测用例

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

2. 完善逻辑


3. 单测结果


#### （三）无限递归循环

1. 单测用例

   ```js
   it('should handle multiple effects', () => {
      let dummy1, dummy2;
      const counter = reactive({ num: 0 });
      effect(() => (dummy1 = counter.num));
      effect(() => (dummy2 = counter.num));

      expect(dummy1).toBe(0);
      expect(dummy2).toBe(0);
      counter.num++;
      expect(dummy1).toBe(1);
      expect(dummy2).toBe(1);
   });
   ```

2. 完善逻辑


3. 单测结果