import { reactive, isReactive, isProxy } from '../reactive';

describe('reactive', function () {
  it('happy path', function () {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(original.foo);

    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isProxy(observed)).toBe(true);
  });

  it('reactive params type must be object', () => {
    console.warn = jest.fn();
    // 传入的不是一个对象
    const original = reactive(1);

    expect(console.warn).toBeCalled();
    expect(original).toBe(1);
  });

  it('nested reactive', () => {
    const original = {
      nested: { foo: 1 },
      array: [{ bar: 2 }]
    };

    const observed = reactive(original);

    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});