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

分析单测，我们可以看出，主要就是两个关注点：

1. 通过`ref`声明的响应式变量可以通过`.value`的形式来读取，也就是`get`操作
2. 同时也可以设置值，也就是`set`操作

### 二、代码实现 happy path

建立`ref.ts`。

```ts
// src/reactivity/ref.ts

// + 这里同样封装一个类来实现各种操作
class RefImpl {
  private _value: any;

  constructor(value: any) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  set value(newVal: any) {
    this._value = newVal;
  }
}

export function ref(value) {
  return new RefImpl(value);
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211170649496.png" width="666" alt="12_01_ref happy path单测"/>

### 三、完善逻辑 v2

首先来看第一个单测的逻辑。

```ts
// src/reactivity/tests/ref.spec.ts

it('should be reactive', () => {
  const a = ref(1);
  let dummy;
  let calls = 0; // + 用于记录次数

  effect(() => {
    calls++;
    dummy = a.value;
  });
  // + 首次运行一次
  expect(calls).toBe(1);
  expect(dummy).toBe(1);
  // + 响应式
  a.value = 2;
  expect(calls).toBe(2);
  expect(dummy).toBe(2);
  // + 设置同样的value不应该再次触发更新
  a.value = 2;
  expect(calls).toBe(2);
});
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180745600.png" width="888" alt="12_02_用例2单测失败"/>

[//]: # (todo 分析)


```ts
// src/reactivity/ref.ts

import { triggerEffects, trackEffects } from './effect';

class RefImpl {
  private _value: any;
  public dep;

  constructor(value: any) {
    this._value = value;
    this.dep = new Set();
  }

  get value() {
    trackEffects(this.dep);
    return this._value;
  }

  set value(newVal: any) {
    this._value = newVal;
    triggerEffects(this.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180821267.png" width="888" alt="12_03_依赖收集后happy path单测失败"/>

[//]: # (todo 分析)

```ts
if (isTracking()) {
  trackEffects(this.dep);
}
return this._value;
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180826227.png" width="666" alt="12_04_依赖收集后单测结果"/>

放开下面两行，继续完善。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180829757.png" width="888" alt="12_05_设置同样value继续触发单测结果"/>

```ts
if (hasChanged(newVal, this._value)) {
  this._value = newVal;
  triggerEffects(this.dep);
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180832626.png" width="666" alt="12_06_前2用例单测通过"/>

### 四、完善逻辑 v3

```ts
// src/reactivity/tests/ref.spec.ts

it('should make nested properties reactive', () => {
  // + 可以接收一个对象，并且也具备响应式
  const a = ref({
    count: 1
  });
  let dummy;
  effect(() => {
    dummy = a.value.count;
  });
  expect(dummy).toBe(1);
  a.value.count = 2;
  expect(dummy).toBe(2);
});
```

其实这里的处理就很简单了，当我们用`_value`去存储`value`的时候，只需要先判断一下是否是对象，如果是对象，就用`reactive`包裹即可。

```ts
class RefImpl {
  private _value: any;
  public dep;

  constructor(value: any) {
    // + 复用isObject
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
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180833819.png" width="666" alt="12_07_单测全部通过"/>