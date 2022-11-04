# 03_实现 effect & reactive & 依赖收集 & 触发依赖

### 一、reactivity happy path

那我们先来编写第一个测试案例，删掉之前的`index.spec.ts`，建立`effect.spec.ts`，实现`reactivity`的`happy path`(核心逻辑)。

```js
describe('effect', function () {
  it.skip('happy path', function () {
    // * 首先定义一个响应式对象
    const user = reactive({
      age: 10
    })

    // * get -> 收集依赖
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    })

    // * effect默认会执行一次
    expect(nextAge).toBe(11);

    // * set -> 触发依赖
    user.age++;
    expect(nextAge).toBe(12);
  });
});
```

那么`reactivity`的`happy path`的单测书写完毕，因为核心逻辑的单测需要依赖于`reactive`和`effect`
两个api，所以此处 **it.skip**，先跳过这个测试用例，我们先来实现`reactive`。

---------------------------------------------------------------------------------------

### 二、reactive happy path

那在实现`reactive`之前，依旧先来写`reactive`核心逻辑的单测。

```js
describe('reactive', function () {
  it('happy path', function () {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(original.foo);
  });
});
```

接着建立`reactive.ts`，实现核心逻辑。

```js
export function reactive(raw) {
  return new Proxy(raw, {
    // 此处使用proxy报错的话，需要进tsconfig.json中，配置"lib": ["DOM", "ES6"]。
    get(target, key) {
      const res = Reflect.get(target, key);

      // todo 依赖收集
      return res;
    },

    set(target, key, value) {
      const res = Reflect.set(target, key, value);

      // todo 触发依赖
      return res;
    }
  })
}
```

至此，`reactive`的`happy path`实现完毕，至于如何进行`依赖收集`和`触发依赖`，我们放到后面再去慢慢考虑。那现在，先来看一下单测有没有通过。

```shell
yarn test reactive
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211050559517.png" width="666" alt="03_reactive核心逻辑单测"/>

测试通过，那么接下来，我们继续完善`reactive`的逻辑代码。  
接着，再去`reactive.spec.ts`和`effect.spec.ts`中引入`reactive`。

```js
import { reactive } from '../reactive';
```

**ps**: 至于上述代码中采用`Reflect.get`而不是`target[key]`返回属性值，将在下一篇文章中详细做出阐述。

---------------------------------------------------------------------------------------

### 三、effect happy path

那只要再把`effect`完善，那`reactivity`的`happy path`的单测就不会报错了，那么，现在，咱就去完善`effect`。  
建立`effect.ts`文件，并完善基础逻辑。

```js
class ReactiveEffect {
  private _fn: any;

  constructor(fn) {
    this._fn = fn;
  }

  run() {
    this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  _effect.run();
}
```

[//]: # (todo 此处为何封装ReactiveEffect？)

此时，去掉`effect` `happy path`中`it`的`skip`，然后注释掉`set -> 触发依赖`后的两行，先不看`update`的过程，运行一下测试。

```shell
yarn test
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211050708340.png" width="666" alt="03_effect部分逻辑单测"/>

---------------------------------------------------------------------------------------

### 四、重中之重 依赖收集和触发依赖

那现在的难点就来了，如何让 **`user.age++`** 的时候，`nextAge`也自动更新。  
这其实就已经到了响应式系统的核心逻辑了，也就是 **`依赖收集`** 和 **`触发依赖`**，也就是`track`和`trigger`的实现。