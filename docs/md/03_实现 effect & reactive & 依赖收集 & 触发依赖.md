# 03_实现 effect & reactive & 依赖收集 & 触发依赖

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
两个api，所以此处 it.skip，先跳过这个测试用例，我们先来实现`reactive`。

---------------------------------------------------------------------------------------

那在实现`reactive`之前，依旧先来写`reactive`核心逻辑的单测。

```js
import { reactive } from '../reactive';

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

至此，`reactive`的`happy path`实现完毕，至于如何进行依赖收集和触发依赖，我们放到后面再去慢慢考虑。那现在，先来看一下单测有没有通过。

```shell
yarn test reactive
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211050559517.png" width="666" alt="03_reactive核心逻辑单测"/>

好，那么至此，`reactive`的`happy path`测试通过，那么接下来，我们继续完善`reactive`的逻辑代码。

---------------------------------------------------------------------------------------

