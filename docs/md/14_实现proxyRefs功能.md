# 14_实现proxyRefs功能

### （一）单元测试

```ts
// src/reactivity/tests/ref.spec.ts

it('proxyRefs', () => {
  const user = {
    age: ref(10),
    name: 'iamzjt'
  };

  const proxyUser = proxyRefs(user);

  expect(user.age.value).toBe(10);
  expect(proxyUser.age).toBe(10);
  expect(proxyUser.name).toBe('iamzjt');

  // proxyUser.age = 20;
  // expect(proxyUser.age).toBe(20);
  // expect(user.age.value).toBe(20);

  // proxyUser.age = ref(10);
  // expect(proxyUser.age).toBe(10);
  // expect(user.age.value).toBe(10);
});
```

先看上面没有被注释的部分，可以看到`proxyRefs`会处理响应式对象并返回一个新对象，而这个新对象访问原先的`ref`
变量时，就不用写`.value`了。

这是不是就跟`template`中写变量一样。

---------------------------------------------------------------------------------------

### （二）代码实现

分析一下可以看出，实际上就是获取属性值的时候，判断一下是否是`ref`，是的话返回`.value`
，不是的话，就返回本身。转头一想，这不就是之前实现的`unRef`
吗？现在只要拦截`get`操作即可。

```ts
// src/reactivity/ref.ts

export function proxyRefs(objectWithRefs) {
  // * get: age (ref) -> return .value
  // * get: not ref -> return value
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    }
  });
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211220644285.png" width="666" alt="14_01_proxyRefs第一次单测结果"/>

那接下来我们放开下面两段单测，来看一下。

```ts
proxyUser.age = 20;
expect(proxyUser.age).toBe(20);
expect(user.age.value).toBe(20);

proxyUser.age = ref(10);
expect(proxyUser.age).toBe(10);
expect(user.age.value).toBe(10);
```

当`proxyUser.age`发生变化后，可以看到处理后的对象的`age`值和原来的`user`的`age`
也发生了变化。即：一次性改了两个值，这意味着我们要拦截`set`操作。

并且，不论新设置的值是不是`ref`，都能一起改变两个值。

那接下来就来实现一下。

```ts
// * set ref -> .value

set(target, key, value)
{
  if (isRef(target[key]) && !isRef(value)) {
    return target[key].value = value;
  } else {
    return Reflect.set(target, key, value);
  }
}
```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211220647056.png" width="666" alt="14_02_proxyRefs完整单测"/>