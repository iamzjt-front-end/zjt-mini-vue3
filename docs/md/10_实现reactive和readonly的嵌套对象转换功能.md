# 10_实现reactive和readonly的嵌套对象转换功能

### 一、单元测试

1. reactive

   ```ts
   // src/reactivity/tests/reactive.spec.ts
   
   it('nested reactive', () => {
     const original = {
       nested: { foo: 1 },
       array: [{ bar: 2 }]
     };
   
     const observed = reactive(original);
   
     expect(isReactive(observed.nested)).toBe(true);
     expect(isReactive(observed.array)).toBe(true);
     expect(isReactive(observed.array[0])).toBe(true);
   });
   ```

2. readonly

   ```ts
   it('nested readonly', () => {
     const original = { foo: 1, bar: { baz: 2 } };
     const wrapped = readonly(original);
   
     expect(isReadonly(wrapped)).toBe(true);
     expect(isReadonly(wrapped.bar)).toBe(true);
   });
   ```

### 二、代码实现

为什么嵌套的深层对象没有转换成`reactive`、`readonly`呢？

因为`Proxy`劫持的是对象本身，并不能劫持子对象的变化。

其实通过单测可以看出，我们只需要将`reactive`嵌套的里层对象也转换成`reactive`，将`readonly`嵌套的里层对象也转换成`readonly`。

那只需要在`get`中，返回`res`的时候，将`res`转换成相应的代理就可以了。

```ts
function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
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

跑一下完整的单测结果看下：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211150805879.png" width="666" alt="10_reactive和readonly嵌套对象转换完整单测结果"/>

**ps:** 其实这里需要注意的一点就是，在`get`中处理嵌套转换，我们只有在用到这个`子对象`的时候，才会将这个`子对象`
转换成响应时代理，避免了不必要的性能浪费。对比`vue2`的递归遍历`defineProperty`来说，也是一个优化的地方。