# 06_实现effect的stop功能

### 一、单元测试

```js
it('stop', () => {
  let dummy;
  const obj = reactive({ prop: 1 });
  const runner = effect(() => {
    dummy = obj.prop;
  });
  obj.prop = 2;
  expect(dummy).toBe(2);
  stop(runner);
  obj.prop = 3;
  expect(dummy).toBe(2);
  runner();
  expect(dummy).toBe(3);
});
```

通过以上单测，可以很明显地看出来，`stop`传入`runner`去停止数据的响应式，而当重新手动执行runner的时候，数据又会恢复响应式。