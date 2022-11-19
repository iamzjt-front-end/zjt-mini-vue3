import { effect } from '../effect';
import { isRef, ref, unRef } from '../ref';
import { reactive } from '../reactive';

describe('ref', function () {
  it('happy path', () => {
    const a = ref(1);
    expect(a.value).toBe(1);

    a.value = 2;
    expect(a.value).toBe(2);
  });

  it('should be reactive', () => {
    const a = ref(1);
    let dummy;
    let calls = 0; // + 用于记录次数

    effect(() => {
      calls++;
      dummy = a.value;
    });
    // + 首次运行一次
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    // + 响应式
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // + 设置同样的value不应该再次触发更新
    a.value = 2;
    expect(calls).toBe(2);
  });

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it('isRef', function () {
    const a = ref(1);
    const user = reactive({
      age: 1
    });

    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it('unRef', function () {
    const a = ref(1);

    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });
});