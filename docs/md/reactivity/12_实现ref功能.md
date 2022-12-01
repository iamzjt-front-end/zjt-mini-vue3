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

我们在`class`顶层定义一个`_value`来存储传进来的`value`，然后后续操作这个`_value`就够了，可以看到`happy path`的实现是比较简单的。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211170649496.png" width="666" alt="12_01_ref happy path单测"/>

---------------------------------------------------------------------------------------

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
  // a.value = 2;
  // expect(calls).toBe(2);
});
```

先运行一下单测，看看哪里会出问题，然后针对性的去结局问题。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180745600.png" width="888" alt="12_02_用例2单测失败"/>

可以看到第二个用例测试失败，我们期望`calls`为`2`，实际值为`1`，说明`effect`没有调用第二次，也就是当`a`的值发生变化后，依赖没有被重新触发。这很容易理解，因为我们根本就没去收集依赖。

那接下来，我们就来完善这部分内容？其实也不难，回去看`effect`就能知道，我们已经做过相关的内容了。只需要抽离封装部分代码，然后复用即可。

```ts
// src/reactivity/effect.ts

// + 抽离dep的收集逻辑
export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

// + 抽离dep的触发逻辑
export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      // ps: effect._fn 为了让scheduler能拿到原始依赖
      effect.scheduler(effect._fn);
    } else {
      effect.run();
    }
  }
}
```

再回到`ref.ts`，将`effect`中抽离的`trackEffects`和`triggerEffects`集成进来。

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

再跑一遍单测。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180821267.png" width="888" alt="12_03_依赖收集后happy path单测失败"/>

白给，用例1出现了错误，`activeEffect`没了，是`undefined`。

分析一下，大概就是两个问题：

1. 为什么`activeEffect`会是`undefined`？

   `activeEffect`是在`run`的时候去赋值的，也就是必须要有相关的`effect`。在第一个测试用例中，可以看出我们并没有相关的依赖，所以也就不存在依赖收集的情况。

2. 该怎么解决这个问题？
   那这么说，我们此时并不需要去收集依赖。实际上，我们之前的`isTracking`就是用来判断，是否应该收集依赖。加上即可。

```ts
if (isTracking()) {
  trackEffects(this.dep);
}
return this._value;
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180826227.png" width="666" alt="12_04_依赖收集后单测结果"/>

可以看到，用例1通过了。

那我们继续放开下面两行，继续完善用例2最后的逻辑。那还是老样子，先跑一下单测，确定一下问题所在。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180829757.png" width="888" alt="12_05_设置同样value继续触发单测结果"/>

依旧很轻松可以看出，设置同样的值，`calls`加一，意思是`effect`还是被触发了一遍，这跟我们预想的并不一致。

那我们就需要在`triggerEffects`前判断，新设置的值是否有变化。

```ts
if (Object.is(newVal, this._value)) {
  this._value = newVal;
  triggerEffects(this.dep);
}
```

可能后续会经常用到这类函数，所以我们考虑封装一下进`shared`里面。

```ts
// src/shared/index.ts

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
};
```

那继续回去用起来。

```ts
if (hasChanged(newVal, this._value)) {
  this._value = newVal;
  triggerEffects(this.dep);
}
```

逻辑差不多完善，跑一下单测。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211180832626.png" width="666" alt="12_06_前2用例单测通过"/>

通过，美滋滋。

---------------------------------------------------------------------------------------

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

至此，三个单元测试全部通过，`ref`的基本实现也已经完成，喝彩！！！
