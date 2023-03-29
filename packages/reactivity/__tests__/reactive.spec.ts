import { reactive, isReactive, isProxy } from '../src/reactive';

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

  it('reactive params type must be object', () => {
    console.warn = vi.fn();
    // 传入的不是一个对象
    const original = reactive(1);

    expect(console.warn).toBeCalled();
    expect(original).toBe(1);
  });

  it('observing already observed value should return same Proxy', () => {
    const original = { foo: 1 };

    const observed = reactive(original);
    const observed2 = reactive(observed);

    expect(observed2).toBe(observed);
  });

  it('observing the same value multiple times should return same Proxy', () => {
    const original = { foo: 1 };

    const observed = reactive(original);
    const observed2 = reactive(original);

    expect(observed2).toBe(observed);
  });
});
