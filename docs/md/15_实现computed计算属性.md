# 15_实现computed计算属性

### （一）单元测试

```ts
// src/reactivity/tests/computed.spec.ts

describe('computed', function () {
  it('happy path', function () {
    // 特点: ref .value 缓存
    const user = reactive({
      age: 1
    });

    const age = computed(() => {
      return user.age;
    });

    expect(age.value).tobe(1);
  });
});
```

大家都知道`computed`，它的特点就是通过`.value`来访问，类似于`ref`，还有缓存。

`computed`函数的执行会返回一个对象，这个接口对象的`value`属性是一个访问器属性，只有当读取`value`的值时，才会执行并将其结果作为返回值返回。

### （二）代码实现

既然类似于`ref`，那我们依旧采用同样的处理。
建立`computed.ts`，导出`computed`。

```ts
// src/reactivity/computed.ts

class ComputedRefImpl {
  private _getter: any;

  constructor(getter) {
    this._getter = getter;
  }

  get value() {
    return this._getter();
  }
}


export function computed(getter) {
  return new ComputedRefImpl(getter);
}
```

[//]: # (todo 15_computed happy path单测截图)
