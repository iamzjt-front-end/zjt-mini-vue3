# 12_实现ref功能

### 一、单元测试

首先建立`ref.spec.ts`，然后来看一下`ref`的`happy path`。

```ts
// src/reactivity/tests/ref.spec.ts

describe('ref', function () {
  it('happy path', () => {
    const a = ref(1);
    expect(a.value).toBe(1);
    a.value = 2;
    expect(a.value).toBe(2);
  });
})
```

