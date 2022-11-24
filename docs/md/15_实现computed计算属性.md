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

既然类似于`ref`，那我们依旧采用同样地处理。
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

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211250540003.png" width="666" alt="15_01_computed happy path单测结果"/>

那接下来，就开始下一个单测。

```ts
// src/reactivity/tests/computed.spec.ts

it('should compute lazily', () => {
  const value = reactive({
    foo: 1
  });
  const getter = jest.fn(() => value.foo);
  const cValue = computed(getter);

  // lazy
  expect(getter).not.toHaveBeenCalled();

  // expect(cValue.value).toBe(1);
  // expect(getter).toHaveBeenCalledTimes(1);

  // should not compute again
  // cValue.value;
  // expect(getter).toHaveBeenCalledTimes(1);

  // should not compute until needed
  // value.foo = 1;
  // expect(getter).toHaveBeenCalledTimes(1);

  // now it should compute
  // expect(cValue.value).toBe(1);
  // expect(getter).toHaveBeenCalledTimes(2);

  // should not compute again
  // cValue.value;
  // expect(getter).toHaveBeenCalledTimes(2);
});
```

根据单测呢，能看出，首先，`computed`是懒执行的，当我们不去读取`cValue.value`的时候，`getter`
不会执行。其实我们现在应该已经实现了啊，因为不读取，就不会调用访问器属性`value`的`getter`方法，自然也就不会调用`_getter`。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211250555318.png" width="666" alt="15_02_computed lazily第一次单测结果"/>

那再次放开下面两行。

```ts
expect(cValue.value).toBe(1);
expect(getter).toHaveBeenCalledTimes(1);
```

其实同上，应该也是通过的，那我们继续往下。

```ts
// should not compute again
cValue.value;
expect(getter).toHaveBeenCalledTimes(1);
```

当再次读取`computed`的值时，`getter`并不会被重新调用，那这里要验证的就是`computed`的一大特点了，那就是会被缓存。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211250614122.png" width="888" alt="15_03_computed缓存单测结果"/>

从单测结果可以看出，我们现在的代码，没有通过，getter被调用了两次。

那就来实现一下，首先需要有一个标识确定是否需要缓存，那就定义一个`_dirty`
，还需要一个变量去存储一下首次计算得来的值，那就再定义一个`_value`。

```ts
// src/reactivity/computed.ts

class ComputedRefImpl {
  private _getter: any;
  // + 增加是否需要缓存标识和缓存变量
  private _dirty: Boolean = true;
  private _value: any;

  constructor(getter) {
    this._getter = getter;
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._getter();
    }
    return this._value;
  }
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211250705246.png" width="666" alt="15_04_computed缓存第二次单测结果"/>

通过，继续下一段。