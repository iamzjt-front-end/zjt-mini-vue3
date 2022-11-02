# 实现 template 编译为 render

在本小节，我们将实现从 template 编译为 render，并跑通一个 demo

## 1. 例子

[查看例子](https://github.com/zx-projects/mini-vue/tree/main/example/compileBase)

## 2. 实现

前几个小节我们已经实现了零零散散的编译，下面我们需要将这些编译组合起来。

首先，创建 `compile.ts`

```ts
import { codegen } from './codegen'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformExpression } from './transforms/transformExpression'
import { transformText } from './transforms/transformText'

// 大概就是这么个过程
export function baseCompile(template: string) {
  const ast = baseParse(template)
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  })
  const code = codegen(ast)
  return {
    code,
  }
}
```

然后在 `compiler-core` 模块的 `index` 中将这个导出

```ts
// 作为 compiler-core 的出口
export * from './compile'
```

那么我们该如何调用这个函数作为组件的 render 方法呢？早前我们写的是在 `runtime-core/component.ts` 中直接调用 `component.render` ，显然在这种情况下是不适用的，因为用户现在已经不提供 render 函数了。但是我们能直接在 `runtime-core` 中调用 `compiler-core` 中的函数吗？

在 vue 的角度看来，这显然是万万不可取的，如果说 `runtime-core` 强依赖 `compiler-core` 中的代码，会有两大缺陷：

- 不利于低耦合
- 用户若手写 render 函数，打包后的代码将会携带无用的 compiler 相关的代码

Vue 的贡献者文档里给出这么一个解决方案：

> 如果你实在想在 runtime 中使用 compiler 的代码，或者反之，你需要将其代码提取到 `@vue/shared` 中

那么在 mini-vue 中，我们就不用提取到 `@vue/shared` 了，我们可以直接在所有模块的最外层进行使用。

```ts
// src/index.ts

// other code..

import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom'

// 在这里对 compile 进行包装，通过编译出来的 code 来创建一个 render 函数
function compileToFunction(template: string) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  return render
}
```

那么下个问题就是，怎么在 component 的地方用到这里的 render 函数。我们可以在 component 的地方也导出一个函数，用于将这里的 render 传递到 component 内部。

```ts
// runtime-core/component.ts

let compiler

export function registerCompiler(_compiler) {
  compiler = _compiler
}
```

层层导出，最终会在 `src/index` 中用到

```ts
import { registerCompiler } from './runtime-dom'

function compileToFunction(template: string) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  return render
}

// 在这里将 compiler 传入到 component 内部中
registerCompiler(compileToFunction)
```

现在，我们就可以在 `component` 中来调用 `compileToFunction` 了！这里也有一个小细节：

- 如果用户同时提供了 render 和 template，那么会执行 render

```ts
function finishComponentSetup(instance) {
  const component = instance.type
  // 在这里如果说有 compiler，而且 component 没有提供 render 的话
  if (!component.render && compiler) {
    if (component.template) {
      // 我们再将 template 编译成为 render
      component.render = compiler(component.template)
    }
  }
  if (!instance.render) {
    instance.render = component.render
  }
}
```

现在我们的 demo 是跑不通的，会报一个 bug，那就是在调用 instance.render 的时候传入的参数问题，这是因为我们编译好的是这样的：

```ts
return function render($ctx) {
  return $ctx.context
}
```

由于这里的 render 需要接受一个参数，所以我们还需要传入参数

```ts
// render.ts

function setupEffect(instance, ...) {
  // other code ..
  // 传入参数
  // 下面还有一个调用 instance.render 也要传入一个参数
  const subTree = instance.render.call(instance.proxy, instance.proxy)
}
```

现在我们的代码也已经解决了一个报错，现在报了另一个错误，那就是找不到 `toDisplayString` 函数。由于我们在生成 code string 的时候导出的两个函数 `toDisplayString` 和 `createElementVNode` ，所以我们需要实现这两个函数

```ts
// shared/toDisplayString.ts
export function toDisplayString(str) {
  return String(str)
}
```

然后再 `runtime-core` 中

```ts
export { h } from './h'
export { renderSlots } from './helpers/renderSlots'
// 将 createVNode 作为 createElementVNode 导出
export { createTextVNode, createVNode as createElementVNode } from './vnode'
export { getCurrentInstance, registerCompiler } from './component'
export { provide, inject } from './apiInject'
export { createRenderer } from './render'
export { nextTick } from './scheduler'
// 导出 toDisplayString
export { toDisplayString } from '../shared'
```

那么现在我们再跑一下 demo，恭喜你！已经成功实现了 template 编译为 render！

## 3. 重构

我们发现代码中存在一些坏味道，例如我们再调用 render 的时候，我们直接是把第二个参数给了 `instance.proxy`，这是因为我们的编译代码需要一些参数。

抽离函数

```ts
// componentRenderUtils
export function renderComponentRoot(instance) {
  const { render, proxy } = instance
  const result = render.call(proxy, proxy)
  return result
}
```

```ts
// 修改代码

// render.ts

function setupEffect(instance, ...) {
  // other code ..
  // 下面还有一个调用 instance.render 也要修改
  const subTree = renderComponentRoot(instance)
}
```

