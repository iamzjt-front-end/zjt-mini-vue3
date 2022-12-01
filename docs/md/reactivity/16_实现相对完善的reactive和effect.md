# 16_实现相对完善的reactive和effect

### 一、我们要优化哪些点？

既然要实现相对完善的`reactive`，那自然需要考虑的多一点。

一些`边缘case`的简单考虑：

1. `reactive`参数问题：
   - 参数类型问题，如果传入的参数不是对象呢？
   - 如果已经是一个响应式对象了呢？也就是嵌套问题，多次`reactive`同一对象
2. `effect`相关的考虑：
   - 嵌套`effect`的情况
   - `分支切换`，也就是三元表达式，不同的分支执行不同的代码，依赖收集不对
   - 避免无限递归循环，`prop++`的情况，导致栈溢出

接下来一个个来完善。

### 二、reactive相关考虑完善

#### （一）参数类型问题

1. 众所周知，`proxy`不能代理基本数据类型，所以遇到基本数据类型，我们应该直接返回原数据，并给一个提醒。

   那第一步，就得判断是不是对象，而且这应该是一个工具函数，所以，封装进`shared`。

   ```ts
   // src/shared/index.ts
   
   export const isObject = (val) => {
     return val !== null && typeof val === 'object';
   };
   ```

2. 在`reactive`函数进行判断。

   ```ts
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

3. 单测

   ```ts
   it('reactive params type must be object', () => {
     console.warn = jest.fn();
     // 传入的不是一个对象
     const original = reactive(1);
     
     expect(console.warn).toBeCalled();
     expect(original).toBe(1);
   });
   ```

#### （二）多层嵌套问题

`ReactiveFlags`增加`RAW`属性，值为`__v_raw`，然后当嵌套时，判断`target`是否有`ReactiveFlags[RAW]`，如果已经是响应式对象，则在`createGetter`中判断是否`key`
为`ReactiveFlags[RAW]`，是的话，则返回`target`。

### 三、effect相关考虑完善
