# 实现 getCurrentInstance

我们可以在 `setup` 中通过 `getCurrentInstance()` 来获取当前的组件实例

首先，我们需要在 `components` 中导出一个函数 `getCurrentInstance()`

```ts
// 将 currentInstance 作为一个全局变量
let currentInstance

export function getCurrentInstance() {
  return currentInstance
}
```

在调用组件 `setup` 函数的时候将 setupInstance 赋值

```ts
function setupStatefulComponent(instance) {
  if (setup) {
    // 赋值
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    // 重置
    setCurrentInstance(null)
    handleSetupResult(instance, setupResult)
  }
}
```

现在我们就已经实现了 `getCurrentInstance` 了。