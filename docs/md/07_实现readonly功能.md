# 07_实现readonly功能

### 一、单元测试

```js
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

可以看出`readonly`也是对对象的一种代理，只不过只能读，不能写，也就是只能被`get`，不能被`set`，那也就没必要去`track`了。

### 二、代码实现

```js
// src/reactivity/reactive.ts

export function readonly(raw) {
  return new Proxy(raw, {
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

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211090816236.png" width="666" alt="07_readonly单测结果"/>