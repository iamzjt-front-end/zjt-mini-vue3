import { isReadonly, shallowReadonly } from '../src/reactive';
import { vi } from 'vitest';

describe('shallowReadonly', () => {
  it('should not make non-reactive properties reactive', () => {
    const props = shallowReadonly({ n: { foo: 1 } });

    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });

  it('should make root level properties readonly', () => {
    console.warn = vi.fn();

    const user = shallowReadonly({ age: 10 });

    user.age = 11;
    expect(console.warn).toBeCalled();
  });

  it('should NOT make nested properties readonly', () => {
    console.warn = vi.fn();

    const props = shallowReadonly({ n: { foo: 1 } });
    props.n.foo = 2;

    expect(props.n.foo).toBe(2);
    expect(console.warn).not.toBeCalled();
  });
});
