import { readonly, isReadonly, isProxy } from '../src/reactive';
import { vi } from 'vitest';

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);

    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);

    // ! 不能被set
    wrapped.foo = 2;
    expect(wrapped.foo).toBe(1);

    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    expect(isProxy(wrapped)).toBe(true);
  });

  it('nested readonly', () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);

    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(wrapped.bar)).toBe(true);
  });

  it('should call console.warn when set', () => {
    // console.warn()
    // mock
    // ps: vi.fn() 用于创建一个 Mock 函数，可以设置该函数的返回值、监听该函数的调用、改变函数的内部实现等等。通过 vi.fn() 创建的函数有一个特殊的 .mock 属性，该属性保存了每一次调用情况
    console.warn = vi.fn();

    const user = readonly({ age: 10 });

    user.age = 11;
    expect(console.warn).toBeCalled();
  });
});
