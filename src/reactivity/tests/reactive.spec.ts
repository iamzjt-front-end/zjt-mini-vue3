import { reactive, isReactive } from '../reactive';

describe('reactive', function () {
  it('happy path', function () {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(original.foo);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });

  it('reactive params type must be object', () => {
    // 传入的不是一个对象
    const original = reactive(1);

    console.warn = jest.fn();
    expect(console.warn).toBeCalled();
    expect(original).toBe(1);
  });
});