# 配置 rollup

我们上一节已经写好了具体的逻辑，但是页面中要想使用到我们的代码，就需要去配置打包工具。这里使用 rollup 作为打包工具，这是因为 rollup 更多用于库的打包，webpack 更多用于应用的打包。

## 1. 安装 rollup

```bash
pnpm i -D rollup
```

```bash
# 安装 typescript 插件
# https://npmjs.com/package/@rollup/plugin-typescript
pnpm i -D @rollup/plugin-typescript
```

## 2. 配置 rollup

根目录创建 `rollup.config.js`

```js
import typescript from '@rollup/plugin-typescript'

export default {
  // 入口文件
  input: './src/index.ts',
  // 出口文件，可以配多个
  // 例如 esm、cjs 规范
  output: [
    {
      format: 'cjs',
      file: './lib/mini-vue.cjs.js',
    },
    {
      format: 'esm',
      file: './lib/mini-vue.esm.js',
    },
  ],
  plugins: [typescript()],
}
```

`src` 创建 `index.ts` 作为整个 mini-vue 库的出口文件

配置完成之后我们就可以试一下打包了，可以配置一个 npm script `"build": "rollup -c rollup.config.js"`，这里打包的时候可能会有一个 warning，让你把你的 tsconfig.json 中的 `module` 改为 `esnext`

## 3. 处理一下入口文件

我们已经创建了一个入口文件，下面就是将每个模块导入到入口文件当中

首先，进入 `runtime-core/index.ts`，将 `createApp` 和 `h` 导出

```ts
export { createApp } from './createApp'
export { h } from './h'
```

然后在 入口文件中 直接导出 runtime-core 即可

```ts
export * from './runtime-core/index'
```

处理完成之后，我们就可以再次打包尝试一下了

## 4. h

现在我们还没有 h 函数，需要创建一下 h 函数

```ts
// h.ts
import { createVNode } from './vnode'

export function h(type, props, children) {
  return createVNode(type, props, children)
}
```

最后，我们就可以进行测试了