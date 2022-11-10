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
});