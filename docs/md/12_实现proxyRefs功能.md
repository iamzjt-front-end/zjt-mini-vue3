# 12_实现proxyRefs功能

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

[//]: # (todo 单测截图)

---------------------------------------------------------------------------------------

### 二、实现unRef
