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
    // user.age++;
    // expect(nextAge).toBe(12);
  });
});
