# 10_实现reactive和readonly的嵌套对象转换功能

### 一、单元测试

```js
// src/reactivity/tests/reactive.spec.ts

it('nested reactive', () => {
  const original = {
    nested: {
      foo: 1
    },
    array: [{ bar: 2 }]
  };

  const observed = reactive(original);

  expect(isReactive(observed.nested)).toBe(true);
  expect(isReactive(observed.array)).toBe(true);
  expect(isReactive(observed.array[0])).toBe(true);
});
```

因为`Proxy`劫持的是对象本身，并不能劫持子对象的变化。

其实通过单测可以看出，我们只是想`reactive`嵌套的里层对象也转换成`reactive`。

### 二、代码实现