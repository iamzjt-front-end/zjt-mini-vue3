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
  // value.foo = 2;
  // expect(getter).toHaveBeenCalledTimes(1);

  // now it should compute
  // expect(cValue.value).toBe(2);
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

那就来实现一下，首先需要有一个标识确定是否需要重新计算，那就定义一个`_dirty`
，还需要一个变量去存储一下首次计算得来的值，那就再定义一个`_value`。

```ts
// src/reactivity/computed.ts

class ComputedRefImpl {
  private _getter: any;
  // + 增加是否需要重新缓存标识和缓存变量
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

```ts
// should not compute until needed
value.foo = 2;
expect(getter).toHaveBeenCalledTimes(1);
```

当`value.foo`发生变化后，`getter`依旧只会被调用一次。

那是什么意思呢？我们可以理解为，无论`computed`依赖的值有没有发生变化，我们只有在用到`computed`的时候，才会去重新判断是否需要重新计算和重新更新缓存值。

那先来跑一下单测看一下，看看是不是如我们所想。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211250724145.png" width="888" alt="15_05_computed依赖值更新无depsMap"/>

这里报`target`是`undefined`，这是什么原因呢？

让我们回到`effect.ts`，分析一下：

1. 首先看出来是触发了`trigger`，那就是触发依赖了，因为此处肯定也触发`set`了，然后看到`value.foo`进行赋值了，所以触发依赖也很正常。
2. 但是此处并没有`effect`去收集依赖，所以自然也就没有`depsMap`，因为`depsMap`的初始化是在`track`
   里面。那这么看来，现在的问题就是：没法儿触发`track`。

继续往下看下一段单测：

```ts
// now it should compute
expect(cValue.value).toBe(2);
expect(getter).toHaveBeenCalledTimes(2);
```

在下一段单测中，我们也能看到，当`value`的值发生变化以后，`getter`需要被再次调用一遍。

总结一下：

1. `computed`是懒执行的，只有在用到的时候，才会调用`getter`去计算；
2. 计算结果会进行缓存，当依赖值并未发生变化的时候，并不会重新计算。

所以，我们需要在适时的时候重新进行计算并更新缓存值。

那就意味着，当`computed`依赖的原始值发生变化时，我们是需要被感知到的。

那既然如此，我们就进行依赖收集，收集一下`getter`。

但是这里呢，又不太好使用`effect`，那我们就引入`class ReactiveEffect`，是我们的老伙计了，好久不见。

当然，在用之前，记得回到`effect.ts`中导出一下。

那再改写一下`computed`的原有逻辑。

```ts
// src/reactivity/computed.ts

import { ReactiveEffect } from './effect';

class ComputedRefImpl {
  private _dirty: Boolean = true;
  private _value: any;
  private _effect: ReactiveEffect;

  constructor(getter) {
    // + 构造_effect
    this._effect = new ReactiveEffect(getter);
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      // + 注意此处需要用run去调用
      this._value = this._effect.run();
    }
    return this._value;
  }
}
```

那再跑一下单测看下。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211260638879.png" width="888" alt="15_06_computed依赖值更新getter调用两次"/>

报了另外一个错，`jest.fn()`也就是`getter`调用了2次，我们期望是1次。

重新报错也是在预期内，因为当依赖值发生变化，会重新触发依赖，就会重新调用`effect.run()`。

此时，一方面，我们并不需要实时触发依赖；

另一方面，我们也需要在依赖值发生时，将`_dirty`的值重新初始化`true`，以便于可以在需要是进行重新计算。

基于上述需要，`scheduler`此时站出来了。

```ts
this._effect = new ReactiveEffect(getter, () => {
  if (!this._dirty) {
    this._dirty = true;
  }
});
```

这样的话，就基本实现了。我们打开下面的所有单测，重新跑一下。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211260711318.png" width="666" alt="15_07_computed完成"/>

全部通过！`剃刀党`最喜欢看的就是这绿色`PASS`和一堆✅。