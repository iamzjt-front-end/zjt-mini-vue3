# 04_实现effect返回runner

### 一、 runner 单测

首先介绍一下`runner`的功能，分以下几点:

1. `effect(fn)`执行会返回一个`runner`函数；
2. 执行`runner`，相当于重新执行一遍`effect`里面传入的`fn`（原始依赖）；
3. 最后`runner`的返回值就是`fn`的返回值。

至于`runner`的作用，是为了让使用者可以手动执行`runner()`来控制副作用函数的生效 和 执行`runner.effect.stop()`
使之不生效，具体实现后面再说。

单测用例如下：

```js
it('runner', function () {
  // effect(fn) -> return runner -> runner() == fn() -> return
  let foo = 10;

  const runner = effect(() => {
    foo++;
    return 'foo';
  });

  expect(foo).toBe(11);

  const r = runner();
  expect(foo).toBe(12);
  expect(r).toBe('foo');
});
```

---------------------------------------------------------------------------------------

### 二、 核心逻辑实现

**// +** 为新增加的代码。

```ts
class ReactiveEffect {
  private _fn: any;

  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    // + 返回fn的返回值
    return this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  _effect.run();

  // + 涉及到run()中this指向的问题，所以需要bind处理一下。
  return _effect.run.bind(_effect);
}
```

完整跑一遍effect单测，保证新功能的增加对以往实现功能不造成影响。

单测结果如下：

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211060647135.png" width="666" alt="04_实现effect返回runner"/>