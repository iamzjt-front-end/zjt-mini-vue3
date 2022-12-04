# 11_实现shallowReadonly和isProxy功能

### 一、实现shallowReadonly

#### （一）单元测试

```ts
// src/reactivity/tests/shallowReadonly.spec.ts

import { isReadonly, shallowReadonly } from '../reactive';

describe('shallowReadonly', () => {
  it('should not make non-reactive properties reactive', () => {
    const props = shallowReadonly({ n: { foo: 1 } });

    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });
});
```

`shallowReadonly`，浅层只读，从单测也很容易看出来。一般的应用场景，可能就是用于项目的优化，避免将深层全部转为readonly。

### （二）代码实现

```ts
// src/reactivity/reactive.ts

import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers';

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyHandlers);
}
```

```ts
// src/reactivity/baseHandlers.ts

import { isObject, extend } from '../shared';

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    // + shallow，直接返回，深层不转响应式
    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}

const shallowReadonlyGet = createGetter(true, true);

// + 其实可见shallowReadonly的set逻辑同readonly，所以从readonly那继承过来，然后改写get逻辑即可
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
});
```

最基本的逻辑，这就完成了，单测一下。

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211160559917.png" width="777" alt="11_01_shallowReadonly单测结果"/>

#### （三）额外的单测

当然为了严谨一些，我们还是测试一下，浅层和深层的`set`操作的结果，是否是我们期望的。

```ts
it('should make root level properties readonly', () => {
  console.warn = jest.fn();

  const user = shallowReadonly({ age: 10 });

  user.age = 11;
  expect(console.warn).toBeCalled();
});

it('should NOT make nested properties readonly', () => {
  console.warn = jest.fn();

  const props = shallowReadonly({ n: { foo: 1 } });
  props.n.foo = 2;

  expect(props.n.foo).toBe(2);
  expect(console.warn).not.toBeCalled();
});
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211160613565.png" width="666" alt="11_02_shallowReadonly额外补充单测"/>


### 二、实现isProxy

这里贴上官网对`isProxy`的描述。

> Checks if an object is a proxy created by reactive or readonly

#### （一）单元测试

我们只需要在之前的用例中补充断言即可。

```ts
// src/reactivity/tests/reactive.spec.ts

import { reactive, isReactive, isProxy } from '../reactive';

// reactive -> happy path

expect(isProxy(observed)).toBe(true);
```

```ts
// src/reactivity/tests/readonly.spec.ts

import { readonly, isReadonly, isProxy } from '../reactive';

// readonly -> happy path

expect(isProxy(wrapped)).toBe(true);
```

#### （二）代码实现

其实实现起来，我们只要复用之前的`isReactive`和`isProxy`即可。

```ts
// src/reactivity/reactive.ts

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211160625974.png" width="666" alt="11_03_isProxy单测结果"/>