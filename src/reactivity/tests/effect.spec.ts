import { reactive } from '../reactive';
import { effect, stop } from '../effect';

describe('effect', () => {
  it('happy path', () => {
    // * 首先定义一个响应式对象
    const user = reactive({
      age: 10
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

  it('should discover new branches while running automatically', () => {
    let dummy;
    const obj = reactive({ prop: 'value', run: false });

    const conditionalSpy = jest.fn(() => {
      dummy = obj.run ? obj.prop : 'other';
    });
    effect(conditionalSpy);

    expect(dummy).toBe('other');
    expect(conditionalSpy).toHaveBeenCalledTimes(1);

    obj.prop = 'Hi';
    expect(dummy).toBe('other');
    expect(conditionalSpy).toHaveBeenCalledTimes(1);

    obj.run = true;
    expect(dummy).toBe('Hi');
    expect(conditionalSpy).toHaveBeenCalledTimes(2);

    obj.prop = 'World';
    expect(dummy).toBe('World');
    expect(conditionalSpy).toHaveBeenCalledTimes(3);
  });

  it.skip('should allow nested effects', () => {
    const nums = reactive({ num1: 0, num2: 1, num3: 2 });
    const dummy: any = {};

    const childSpy = jest.fn(() => (dummy.num1 = nums.num1));
    const childEffect = effect(childSpy);
    const parentSpy = jest.fn(() => {
      dummy.num2 = nums.num2;
      childEffect();
      dummy.num3 = nums.num3;
    });
    effect(parentSpy);

    expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(2);

    // * 应该只触发childEffect
    nums.num1 = 4;
    expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(3);

    // * 触发parentEffect，触发一次childEffect
    nums.num2 = 10;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(2);
    expect(childSpy).toHaveBeenCalledTimes(4);

    // * 触发parentEffect，触发一次childEffect
    nums.num3 = 7;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
    expect(parentSpy).toHaveBeenCalledTimes(3);
    expect(childSpy).toHaveBeenCalledTimes(5);
  });

  it.skip('should handle multiple effects', () => {
    let dummy1, dummy2;
    const counter = reactive({ num: 0 });
    effect(() => (dummy1 = counter.num));
    effect(() => (dummy2 = counter.num));

    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);
    counter.num++;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(1);
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
      { scheduler }
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
      // todo 需reactive完善相关逻辑后进行验证
      // obj.prop++;
      dummy = obj.prop;
    });

    obj.prop = 2;
    expect(dummy).toBe(2);

    stop(runner);
    obj.prop = 3;
    // get set
    // todo ++的情况依旧会触发数据的变化，并未停止响应式
    // obj.prop++;
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);

    // todo runner完以后还是丢失响应式
    // obj.prop++;
    // expect(dummy).toBe(4);
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
        onStop
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});