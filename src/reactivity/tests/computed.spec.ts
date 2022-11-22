import { reactive } from '../reactive';
import { computed } from '../computed';

describe('computed', function () {
  it('happy path', function () {
    // 特点: ref .value 缓存
    const user = reactive({
      age: 1
    });

    const age = computed(() => {
      return user.age;
    });

    expect(age.value).toBe(1);
  });
});
