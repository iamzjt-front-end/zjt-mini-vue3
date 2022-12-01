# 16_实现相对完善的reactive和effect

### 一、我们要优化哪些点？

既然要实现相对完善的`reactive`，那自然需要考虑的多一点。

那我们大概列举一些`边缘case`的简单考虑：

1. `reactive`参数问题：
   - 参数类型问题，如果传入的参数不是对象呢？
   - 如果已经是一个响应式对象了呢？也就是嵌套问题，多次`reactive`同一对象。
   - 那自然还有另外一个类似的问题，同一个对象，分别两次调用`reactive`后拿到的响应式对象还是同一个吗？

2. `effect`相关的考虑：
   - 嵌套`effect`的情况，应该如何处理？
   - `分支切换`，也就是三元表达式，不同的分支执行不同的代码，这种就没问题吗？
   - `prop++`的情况，又得避免又读又取导致无线递归，栈溢出的情况。

看着是不是有些头大，但是这些都是我们应该要考虑到的地方。  
不着急，接下来一个个来完善。

### 二、reactive相关考虑完善

#### （一）参数类型问题

1. 先来看一下单测

   ```
   it('reactive params type must be object', () => {
     console.warn = jest.fn();
     // 传入的不是一个对象
     const original = reactive(1);
     
     expect(console.warn).toBeCalled();
     expect(original).toBe(1);
   });
   ```

2. 完善逻辑

   众所周知，`proxy`不能代理基本数据类型，所以遇到基本数据类型，我们应该直接返回原数据，并给一个提示。  
   那第一步，就得判断是不是对象，而且这应该是一个工具函数，所以，封装进`shared`。

   ```
   // src/shared/index.ts
   
   export const isObject = (val) => {
     return val !== null && typeof val === 'object';
   };
   ```

   工具函数完成，那我们只需要在`reactive`中对入参进行判断即可。

   ```
   // src/reactivity/reactive.ts
   
   function createReactiveObject(raw: any, baseHandlers) {
     // + 不是对象，警告，返回原数据
     if (!isObject(raw)) {
       console.log(`value cannot be made reactive: ${ String(raw) }`);
       return raw;
     }
     return new Proxy(raw, baseHandlers);
   }
   ```

3. 单测结果

[//]: # (todo 单测截图)

#### （二）多层嵌套问题

1. 先来看一下单测

   ```js
   it('observing already observed value should return same Proxy', () => {
     const original = { foo: 1 };
   
     const observed = reactive(original);
     const observed2 = reactive(observed);
   
     expect(observed2).toBe(observed);
   });
   ```

2. 完善逻辑

   核心逻辑：我们只需要判断`raw`是否是响应式对象，是的话，则返回`raw`，否则就按正常逻辑来。

   具体实现：
   仔细一看，是不是类比`isReactive`和`isReadonly`的实现，
   `ReactiveFlags`增加`RAW`属性，值为`__v_raw`，然后当嵌套时，判断`target`是否有`ReactiveFlags[RAW]`
   ，如果已经是响应式对象，则在`createGetter`中判断是否`key`
   为`ReactiveFlags[RAW]`，是的话，则返回`target`。

#### （三）多次监测问题

### 三、effect相关考虑完善

- 嵌套`effect`的情况


- `分支切换`，也就是三元表达式，不同的分支执行不同的代码，依赖收集不对
  解决思路：只收集当前激活依赖，每次收集前清除依赖。


- 避免无限递归循环，`prop++`的情况，导致栈溢出