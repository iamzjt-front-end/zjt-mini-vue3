import { reactive } from '../reactive';
import { effect, stop } from '../effect';

describe('effect', () => {
  it('happy path', () => {
    // * 首先定义一个响应式对象
    const user = reactive({
      age: 10,
    });

    // * get -> 收集依赖
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    // * effect默认会执行一次
    expect(nextAge).toBe(11);

    // * set -> 触发依赖
    user.age++;
    expect(nextAge).toBe(12);
  });

  it('runner', () => {
    // effect(fn) -> return runner -> runner() == fn() -> return
    // effect(fn)执行会返回一个runner, 执行runner, 相当于重新执行一遍effect里面传入的fn, 同时也会将fn的返回值返回。
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

  it('scheduler', () => {
    // + 1. 通过 effect 的第二个参数给定的一个对象 { scheduler: () => {} }, 属性是上scheduler, 值是一个函数;
    // + 2. effect 第一次执行的时候, 还是会执行 fn;
    // + 3. 当响应式对象被 set，也就是数据 update时, 如果scheduler存在, 则不会执行 fn, 而是执行 scheduler;
    // + 4. 当再次执行 runner 的时候, 才会再次的执行 fn.
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler },
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  it('stop', () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);
    runner();
    expect(dummy).toBe(3);
  });

  it('onStop', () => {
    const obj = reactive({ prop: 1 });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      },
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
