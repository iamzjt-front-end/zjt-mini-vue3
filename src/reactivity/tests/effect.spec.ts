import { reactive } from '../reactive';
import { effect } from '../effect';

describe('effect', function () {
  it('happy path', function () {
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

  it('runner', function () {
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
});
