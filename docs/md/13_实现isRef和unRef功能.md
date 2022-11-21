# 13_实现isRef和unRef功能

### 一、实现isRef

#### （一）单元测试

```ts
// src/reactivity/reactive.ts

it('isRef', function () {
  const a = ref(1);
  const user = reactive({
    age: 1
  });

  expect(isRef(a)).toBe(true);
  expect(isRef(1)).toBe(false);
  expect(isRef(user)).toBe(false);
});
```

先来看一下单测，`isRef`的功能就是判断一个变量是不是一个`ref`响应式变量。

#### （二）代码实现

实现起来也没什么难度，跟之前一样，在初始化的时候，给它一个标识：`__v_isRef`，默认为true。

```ts
// src/reactivity/ref.ts

class RefImpl {
  private _value: any;
  public dep;
  // + 标识
  public __v_isRef = true;

  constructor(value: any) {
    this._value = isObject(value) ? reactive(value) : value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal: any) {
    if (hasChanged(newVal, this._value)) {
      this._value = newVal;
      triggerEffects(this.dep);
    }
  }
}

export function isRef(ref) {
  return !!ref?.__v_isRef;
}
```

单测也是通过。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211201611107.png" width="666" alt="13_01_isRef单测结果"/>

---------------------------------------------------------------------------------------

### 二、实现unRef

`unRef`: 如果参数是一个`ref`则返回它的`value`，否则返回参数本身。

#### （一）单元测试

```ts
it('unRef', function () {
  const a = ref(1);

  expect(unRef(a)).toBe(1);
  expect(unRef(1)).toBe(1);
});
```

可以看到单测也比较简单，我们只需要根据是不是`ref`，然后返回`.value`还是数据本身即可，那就可以复用上面的`isRef`。

#### （二）代码实现

```ts
// src/reactivity/ref.ts

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211201624580.png" width="666" alt="13_02_unRef单测结果"/>

单测也全部通过了。😋