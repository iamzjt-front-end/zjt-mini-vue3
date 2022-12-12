# 07_实现readonly功能

### 一、单元测试

```ts
describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);

    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);

    // ! 不能被set
    wrapped.foo = 2;
    expect(wrapped.foo).toBe(1);
  });
});
```

可以看出`readonly`也是对`对象`的一种代理，只不过只能读，不能写。  
也就是只能被`get`，不能被`set`，那也就没必要去`track`[收集依赖](https://juejin.cn/post/7170480677614256158)了。

### 二、代码实现

实现的逻辑也很简单，`get`的时候，我们正常返回值。当又`set`操作时，我们给予一个警告⚠️。  
实现如下：

```ts
// src/reactivity/reactive.ts

export function readonly(target) {
  return new Proxy(target, {
    get(target, key) {
      const res = Reflect.get(target, key);

      return res;
    },

    set(target, key, value) {
      // todo 抛出警告⚠️ 不可以被set
      return true;
    },
  });
}
```

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a3f4ab9543534384bf5d640e3f615530~tplv-k3u1fbpfcp-zoom-1.image" width="666" alt="07_01_readonly单测结果"/>

单测通过。

### 三、代码重构

#### 1. 首次重构

当`happy path`实现后，此时可以看到`reactive`和`readonly`的`get`比较相似，就可以抽离出一个函数`createGetter`，返回一个`get`函数。

```ts
function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}
```

为了保持代码的一致性，再把`set`也抽离出来。

```ts
function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    trigger(target, key);
    return res;
  };
}
```

抽离后的代码如下：

```ts
import { track, trigger } from './effect';

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    trigger(target, key);
    return res;
  };
}

export function reactive(target) {
  return new Proxy(target, {
    get: createGetter(),
    set: createSetter(),
  });
}

export function readonly(target) {
  return new Proxy(target, {
    get: createGetter(true),

    set(target, key, value) {
      // ps 此处由于做不一样的操作，就不写成createSetter()了
      // todo 抛出警告⚠️ 不可以被set
      return true;
    },
  });
}
```

抽离完成后，别忘记继续跑一遍全部单测。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3524ec784dfd4ea2aad5ac4ee6d12df9~tplv-k3u1fbpfcp-zoom-1.image" width="666" alt="07_02_第一次封装后的单测结果"/>

---------------------------------------------------------------------------------------

#### 2. 二次重构

其实再仔细观察代码，可以看出两个`new Proxy`的第二个参数有很多相似的地方，这时候就可以考虑二次封装。

首先进行功能划分，`reactive.ts`里面只做对对象的代理。  
而具体的代理操作，我们单独抽离出一个文件进行管理，可能后续还有其他类型处理的对象代理，以便延展。

所以，在`reactivity`下建立`baseHandlers.ts`，专门存储用于代理处理函数。

```ts
// + src/reactivity/baseHandlers.ts

import { track, trigger } from './effect';

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    trigger(target, key);
    return res;
  };
}

// * reactive
export const mutableHandlers = {
  get: createGetter(),
  set: createSetter(),
};

// * readonly
export const readonlyHandlers = {
  get: createGetter(true),

  set(target, key, value) {
    // todo 抛出警告⚠️ 不可以被set
    return true;
  },
};
```

从`baseHandlers.ts`中导出`mutableHandlers`和`readonlyHandlers`，然后在`reactive.ts`中进行导入即可。

```ts
import { mutableHandlers, readonlyHandlers } from './baseHandlers';

export function reactive(target) {
  return new Proxy(target, mutableHandlers);
}

export function readonly(target) {
  return new Proxy(target, readonlyHandlers);
}
```

这时候，`reactive.ts`中的代码就很简洁。在这里，我们能看到的是，`reactive`和`readonly`对对象进行了不同的代理操作。

在大部分情况下，我们只关注这个函数实现了什么功能，这个函数内部具体怎么处理，我们并不关心。

如果一定要看具体的代理逻辑，那就去另一个文件中去阅读。

继续跑一下单测，确保重构没有问题。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6d08296f95c04c61b343f75b93611542~tplv-k3u1fbpfcp-zoom-1.image" width="666" alt="07_03_第二次封装后的单测结果"/>

---------------------------------------------------------------------------------------

#### 3. 三次重构（梅开三度）

`reactive`和`readonly`的主要逻辑基本相同，都是对象代理，不具备一个良好的语义性。  
而后续为了完善现有逻辑，我们应该会在代理操作之前进行一些判断和处理，并不会直接代理数据。

所以为了后续以便于扩展，就继续抽离出进行`预处理`和`创建响应式对象`的函数`createReactiveObject`。如下：

```ts
// + src/reactivity/reactive.ts
import { mutableHandlers, readonlyHandlers } from './baseHandlers';

function createReactiveObject(target: any, baseHandlers) {
  return new Proxy(target, baseHandlers);
}

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers);
}
```

再看到`mutableHandlers`和`readonlyHandlers`，会发现，每次调用`mutableHandlers`，实际上都会重新创建`get`，所以考虑用一个全局变量存储，就不会被销毁。

```ts
// + src/reactivity/baseHandlers.ts
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

// * reactive
export const mutableHandlers = {
  get,
  set,
};

// * readonly
export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    // todo 抛出警告⚠️ 不可以被set
    return true;
  },
};
```

这样重构就完成了，暂时看不出什么可以再进行优化的点了。

那最后再次跑一下单测。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6e3f67e7b3eb41f88c5fa2e134695141~tplv-k3u1fbpfcp-zoom-1.image" width="666" alt="07_04_第三次封装后的单测结果"/>

### 四、实现警告

到此为止，还剩最后一个地方需要完善，就是上面的`todo`，`readonly`变量被`set`时，抛出警告。

1. 单元测试

   先来看一下单测。

   ```ts
   it('should call console.warn when set', () => {
     // console.warn()
     // mock
     // ps: jest.fn() 用于创建一个 Mock 函数，可以设置该函数的返回值、监听该函数的调用、改变函数的内部实现等等。通过 jest.fn() 创建的函数有一个特殊的 .mock 属性，该属性保存了每一次调用情况
     console.warn = jest.fn();
   
     const user = readonly({ age: 10 });
     user.age = 11;
   
     expect(console.warn).toBeCalled();
   });
   ```

2. 代码实现

   ```ts
   export const readonlyHandlers = {
     get: readonlyGet,
     set(target, key, value) {
       // ! 抛出警告⚠️ 不可以被set
       console.warn(`key: ${ key } set value: ${ value } failed, because the target is readonly!`, target);
       return true;
     }
   };
   ```

最后走一遍单测。

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7678ed595ed74651a6a84cefcc4bae9b~tplv-k3u1fbpfcp-zoom-1.image" width="999" alt="07_05_打印警告单测结果"/>

可以看到，警告也打印了，所有的测试用例也都通过了。🍓

### ps

这是一个 [早起俱乐部](https://juejin.cn/pin/7173512204149325861)！

⭐️ 适合人群：所有想有所改变的人，可以先从早起半小时开始！抽出30分钟，从初心开始！！  
⭐️ 没有任何其它意味，只是本人想寻找一起早起、志同道合的小伙伴。