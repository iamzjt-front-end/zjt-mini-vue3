# 10_实现reactive和readonly的嵌套对象转换功能

### 一、单元测试

```js
// src/reactivity/tests/reactive.spec.ts

test('nested reactive', () => {
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