# 04_实现effect返回runner

### 一、 runner 单测

首先介绍一下`runner`的功能，分以下几点:

1. `effect(fn)`执行会返回一个`runner`函数；
2. 执行`runner`，相当于重新执行一遍`effect`里面传入的`fn`（原始依赖）；
3. 最后`runner`的返回值就是`fn`的返回值。

至于`runner`的作用，可以看做是对外暴露`ReactiveEffect`实例的`run`方法。

- 一方面是为了可以手动调用触发依赖；
- 另一方面，也是为了和`stop`结合使用，来手动控制响应式的生效与失效；  
  具体点就是：使用者可以手动执行`runner()`来控制`副作用函数`的生效 和 执行`stop(runner)`也就是`runner.effect.stop()`
  使之失效，具体`stop`的实现实现后面再说。

还是先来看一下单测吧，单测用例如下：

```ts
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

具体实现较为简单，上述代码中也有相应注释，这里就不再赘述了。  
再次完整跑一遍effect单测，保证新功能的增加对以往实现功能不造成影响。

单测结果如下：

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c7d6b81e10514032a244deccf1171d13~tplv-k3u1fbpfcp-zoom-1.image" width="666" alt="04_实现effect返回runner"/>