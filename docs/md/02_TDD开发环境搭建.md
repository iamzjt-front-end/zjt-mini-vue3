# 02_TDD开发环境搭建

从现在开始，正式的进行 `mini-vue`的开发。
首先搭建 `TDD`（测试驱动开发）开发环境，本项目采用 `jest`作为单元测试框架，采用 `typescript`作为主要开发语言，采用 `yarn`作为包管理工具。

### 一、环境搭建

1. 初始化项目

   ```shell
   # 生成默认的package.json
   yarn init -y
   ```
   
2. 安装和配置 `typescript`

   ```shell
   # 安装typescript
   yarn add typescript -D
   # 生成配置文件tsconfig.json
   npx tsc --init
   ```
   
3. 引入 `jest`

   ```shell
   yarn add jest @types/jest -D
   ```
   
4. 配置 `tsconfig.json`（要包含的类型声明文件名列表，也就是上面安装的@types/jest）

   ```json
   {
      "types": ["jest"]  
   }
   ```

### 二、定义一下目录结构

zjt-mini-vue3  
│  
├── docs // 笔记  
│   ├── images  
│   └── md  
├── node_modules  
├── src  
│   └── reactivity  
│       ├── tests  
│       │   └── index.spec.ts // jest单测  
│       └── index.ts  
├── .gitignore  
├── babel.config.js  
├── LICENSE  
├── package.json  
├── README.md  
├── tsconfig.json  
└── yarn.lock  

1. index.ts编写一个方法用于测试

   ```js
   export function add(a, b) {
      return a + b;
   }
   ```

2. index.spec.ts编写第一个测试用例

   ```js
   import { add } from '../index';

   it('init', function () {
      expect(add(1, 1)).toBe(2);
   });
   ```

3. 配置package.json的script

   ```json
   {
      "scripts": {
         "test": "jest"
      }
   }
   ```

### 三、测试

   ```shell
   yarn test
   ```

<img src="https://iamzjt-1256754140.cos.ap-nanjing.myqcloud.com/images/202211030753632.png" width="666" alt="02_jest第一个测试用例测四结果"/>