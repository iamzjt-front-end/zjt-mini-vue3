<h1 align="center">
  zjt-mini-vue3
</h1>

<p align="center">
  <a href="https://github.com/iamzjt-front-end/zjt-mini-vue3">
    <img src="https://img.shields.io/badge/IamZJT-zjt--mini--vue3-blue" alt="IamZJT" />
  </a>&emsp;
  <a href="https://github.com/vuejs/core">
    <!-- <img src="https://img.shields.io/badge/-Vue.js-%232c3e50?style=flat-square&logo=vuedotjs"> -->
    <img width="26" src="https://vuejs.org/images/logo.png" alt="Vue logo" />
  </a>&emsp;
  <a href="https://github.com/iamzjt-front-end">
    <img src="https://komarev.com/ghpvc/?username=iamzjt-front-end&label=++访客统计++&color=lightgrey" alt="访客统计" />
  </a>&emsp;
</p>

<h3 align="center">
  简体中文 | <a href='./README_EN.md'>English</a>
</h3>


## 介绍

🙋 此仓库为`vue3`源码学习记录，手写完成`vue3`的三大模块，`reactivity`（响应式）、`runtime`（运行时）及`compiler`
（编译），通过实现最简`vue3`模型，来深入学习理解`vue3`源码，仅仅用于学习哦！

> ✨ [Upcoming challenges](https://github.com/type-challenges/type-challenges/issues?q=is%3Aissue+is%3Aopen+label%3Anew-challenge)

> 🔥 Start the challenge in [TypeScript Playground](https://www.typescriptlang.org/play?install-plugin=%40type-challenges%2Fplayground-plugin)

> 🚀 Start the challenge locally in [your IDE or text editor with TypeScript language support](#play-locally)

> ⚡️ Start the challenge in [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=YRM.type-challenges)

## 系列文章

下面为此项目同步更新的系列文章：

<a href="https://juejin.cn/column/7168612212133593095"><img src="https://img.shields.io/badge/juejin-掘金专栏-487DF8"></a>

#### 一、reactivity篇

[01_vue3源码的介绍](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/01_vue3源码的介绍.md)

[02_TDD开发环境搭建](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/02_TDD开发环境搭建.md)

[03_01_实现effect&reactive&依赖收集&触发依赖](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/03_01_实现effect&reactive&依赖收集&触发依赖.md)

[03_02_理解Proxy和Reflect](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/03_02_理解Proxy和Reflect.md)

[03_03_实现相对完善的reactive和effect](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/03_03_实现相对完善的reactive和effect.md)

[04_实现effect返回runner](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/04_实现effect返回runner.md)

[05_实现effect的scheduler功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/05_实现effect的scheduler功能.md)

[06_实现effect的stop和onStop功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/06_实现effect的stop和onStop功能.md)

[07_实现readonly功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/07_实现readonly功能.md)

[08_实现isReactive和isReadonly](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/08_实现isReactive和isReadonly.md)

[09_优化stop功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/09_优化stop功能.md)

[10_实现reactive和readonly的嵌套对象转换功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/10_实现reactive和readonly的嵌套对象转换功能.md)

[11_实现shallowReadonly和isProxy功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/11_实现shallowReadonly和isProxy功能.md)

[12_实现ref功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/12_实现ref功能.md)

[13_实现isRef和unRef功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/13_实现isRef和unRef功能.md)

[14_实现proxyRefs功能](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/14_实现proxyRefs功能.md)

[15_实现computed计算属性](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/15_实现computed计算属性.md)

[16_实现相对完善的reactive](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/16_实现相对完善的reactive.md)

[17_实现相对完善的effect](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/17_实现相对完善的effect.md)

[18_一些未曾注意到的细节](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/reactivity/18_一些未曾注意到的细节.md)


#### 二、runtime-core篇

[01_实现初始化component流程](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/runtime-core/01_实现初始化component主流程.md)


#### 三、compiler篇

[01_编译模块概述.md](https://github.com/iamzjt-front-end/zjt-mini-vue3/blob/main/docs/md/compiler/01_编译模块概述.md)


待续...

## 勘误

如果发现错误，可以在相应的 issues 进行勘误或者 <a href="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/IamZJT-WeChat.jpg">微信：IamZJT_</a> 联系我。

如果喜欢或者有所启发，欢迎 star，对作者也是一种鼓励。

## License

所有内容均采用 [MIT](https://spdx.org/licenses/MIT) 进行许可。

