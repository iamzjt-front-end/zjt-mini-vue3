import { effect } from '../effect';
import { ref } from '../ref';

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

  it.skip('should make nested properties reactive', () => {
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
});