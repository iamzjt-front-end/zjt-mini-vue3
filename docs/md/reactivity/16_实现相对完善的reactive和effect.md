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

1. 单测用例

   ```js
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

   ```js
   // src/shared/index.ts
   
   export const isObject = (val) => {
     return val !== null && typeof val === 'object';
   };
   ```

   工具函数完成，那我们只需要在`reactive`中对入参进行判断即可。

   ```js
   // src/reactivity/reactive.ts
   
   function createReactiveObject(target: any, baseHandlers) {
     // + 不是对象，警告，返回原数据
     if (!isObject(target)) {
       console.log(`value cannot be made reactive: ${ String(target) }`);
       return target;
     }
     return new Proxy(target, baseHandlers);
   }
   ```

3. 单测结果

   <img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212040641529.png" width="777" alt="16_01_reactive参数类型问题单测结果"/>

#### （二）多层嵌套问题

1. 单测用例

   ```js
   it('observing already observed value should return same Proxy', () => {
     const original = { foo: 1 };
   
     const observed = reactive(original);
     const observed2 = reactive(observed);
   
     expect(observed2).toBe(observed);
   });
   ```

2. 完善逻辑

   核心逻辑：  
   我们只需要判断`target`是否是响应式对象，是的话，则返回`target`，否则就按正常逻辑来。  

   实现思路：  
   仔细一看，是不是可以类比`isReactive`和`isReadonly`的实现，这样的话，那就简单了。

   我们为`ReactiveFlags`增加一个枚举`RAW`，值为`__v_raw`。  
   然后当嵌套时，判断`target`是否有`ReactiveFlags[RAW]`。
   如果已经是响应式对象，则在`createGetter`中判断读取是否`key`为`ReactiveFlags[RAW]`，是的话，则返回`target`，中断`reactive`。
   那如果不是响应式对象呢，那自然就没有这个属性，继续往下走好了。

   代码实现：
   ```ts
   // src/reavtivity/reactive.ts
   
   export const enum ReactiveFlags {
      IS_REACTIVE = '__v_isReactive',
      IS_READONLY = '__v_isReadonly',
      RAW = '__v_raw'
   }
   
   function createReactiveObject(target: any, baseHandlers, proxyMap) {
      if (!isObject(target)) {
         console.warn(`value cannot be made reactive: ${ String(target) }`);
         return target;
      }
      if (target[ReactiveFlags.RAW]) {
         return target;
      }
      return new Proxy(target, baseHandlers);
   }
   ```
   
   ```ts
   // src/reactivity/baseHandlers.ts
   
   function createGetter(isReadonly = false, shallow = false) {
      return function get(target, key) {
         if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
         } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
         } else if (key === ReactiveFlags.RAW) {
            // + 增加判断
            return target;
         }

         const res = Reflect.get(target, key);

         if (shallow) {
           return res;
         }

         if (isObject(res)) {
           return isReadonly ? readonly(res) : reactive(res);
         }

         if (!isReadonly) {
           track(target, key);
         }

         return res;
      };
   }
   ```

3. 单测结果

   <img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212040646325.png" width="777" alt="16_02_reactive多层嵌套问题单测结果"/>

#### （三）多次监测问题

1. 单测用例

   ```js
   it('observing the same value multiple times should return same Proxy', () => {
     const original = { foo: 1 };

     const observed = reactive(original);
     const observed2 = reactive(original);

     expect(observed2).toBe(observed);
   });
   ```

2. 完善逻辑

   当我们多次监测同一个对象时，我们拿到的应该也是同一个响应式对象。  
   一方面是为了性能问题，避免多次代理造成的性能浪费；  
   另一方面，也是为了避免一些由此引起的不必要的问题。

   就举个简单的例子：

   例如在依赖收集`track`时，我们是根据原始对象的`target`和`key`去一一对应收集依赖进`targetMap`的。 此处注意是原始对象！

   那么就就意味着：如果同一对象，多次代理可以返回不同的响应式对象时，那么这些响应式对象对应的依赖将会收集在同一个`targetMap`
   中。  
   由此带来的就是：只要其中一个响应式对象发生变化，那么所有的这些响应式对象对应的依赖都会被触发并更新，而且我们也并没有必要去增加另外的一些标识，来区分这些由同一个对象产生的不同代理，那将会增加很多心智负担，那并不是我们所期望的。

   实现思路：  
   我们只需要将已经代理过的对象和对应的代理，按照原始对象`target` → 响应式对象`proxy`
   一对一存储即可。并且由于是弱引用，所以我们采用`WeakMap`来存储。

   代码实现：  
   ```ts
   // src/reactivity/reactive.ts
   
   export const reactiveMap = new WeakMap();
   export const readonlyMap = new WeakMap();
   export const shallowReadonlyMap = new WeakMap();

   function createReactiveObject(target: any, baseHandlers, proxyMap) {
      if (!isObject(target)) {
         console.warn(`value cannot be made reactive: ${ String(target) }`);
         return target;
      }
      if (target[ReactiveFlags.RAW]) {
         return target;
      }
      const existingProxy = proxyMap.get(target);
      // + 这里解决的是reactive多层嵌套的问题
      if (existingProxy) {
         return existingProxy;
      }
      const proxy = new Proxy(target, baseHandlers);
      // + 缓存一下已经被代理的对象
      proxyMap.set(target, proxy);
      return proxy;
   }

   export function reactive(target) {
      return createReactiveObject(target, mutableHandlers, reactiveMap);
   }

   export function readonly(target) {
      return createReactiveObject(target, readonlyHandlers, readonlyMap);
   }

   export function shallowReadonly(target) {
      return createReactiveObject(target, shallowReadonlyHandlers, shallowReadonlyMap);
   }
   ```

3. 单测结果

   <img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202212050553680.png" width="777" alt="16_03_reactive多次监测问题单测结果"/>

### 三、effect相关考虑完善

- 嵌套`effect`的情况


- `分支切换`，也就是三元表达式，不同的分支执行不同的代码，依赖收集不对
  解决思路：只收集当前激活依赖，每次收集前清除依赖。


- 避免无限递归循环，`prop++`的情况，导致栈溢出