# 03_02_理解Proxy和Reflect

### 一、开始之前:

为什么还会有这一篇文章呢？  
不是手写`mini-vue`吗？其实可以理解成支线任务、番外篇，是对主线内容的补充。

这一篇文章可能文字比较多，理论知识比较多，参考了4本书相关的章节写的。  
可以泡杯咖啡或者喝杯茶，坐下来慢慢看哦。☕️

### 二、为什么使用Proxy？

众所周知，`vue3`的响应式是靠`Proxy`代理对象实现的。

代理是使用`Proxy`构造函数创建的。  
这个构造函数接收两个参数：目标对象`target`和处理程序对象`handler`。  
缺少其中任何一个参数都会抛出`TypeError`。

使用代理的主要目的是可以定义捕获器（`trap`）。  
捕获器就是在处理程序对象中定义的“`基本操作`的拦截器”。

每个处理程序对象可以包含零个或多个捕获器，每个捕获器都对应一种基本操作，可以直接或间接在代理对象上调用。例如：get和set都知道就不说了，`apply`可以用来捕获函数的调用操作。

每次在`代理对象`上调用这些基本操作时，代理可以在这些操作传播到目标对象之前先调用捕获器函数，从而拦截并修改相应的行为。大致可以理解为`代理对象`在`目标对象`前设置了一层“拦截”层。

那这样，对于对象属性的读取和设置，我们就可以感知到，只有在这个基础之上，我们才能去实现响应式。

既然我们知道了为什么用`Proxy`，那接下来就来看看`Proxy`到底是什么？

### 三、Proxy是什么？

> 《JavaScript高级程序设计（第4版）》
>
> ECMAScript 6
> 新增的代理和反射为开发者提供了拦截并向基本操作嵌入额外行为的能力。具体地说，可以给目标对象定义一个关联的代理对象，而这个代理对象可以作为抽象的目标对象来使用。在对目标对象的各种操作影响目标对象之前，可以在代理对象中对这些操作加以控制。
>
> 从很多方面看，代理类似 C++指针，因为它可以用作目标对象的替身，但又完全独立于目标对象。目标对象既可以直接被操作，也可以通过代理来操作。
> 但直接操作会绕过代理施予的行为。
>

> 《ES6标准入门》
>
> Proxy 用于修改某些操作的默认行为，等同于在语言层面做出修改，所以属于 种“元编程”（ meta programming ），即对编程语言进行编程。
>
> Proxy 可以理解成在目标对象前架设 个“拦截”层 ，外界对该对象的访问都必须先通过 这层拦截，因此提供了一种机制可以对外界的访问进行过滤和改写。
>
> Proxy 这个词的原意是代理，用在这里表示由它来“代理”某些操作，可以译为“代理器”。

> 《深入理解ES6》
>
> 通过调用 new Proxy() ，你可以创建一个代理用来替代另一个对象（被称为目标），这个代理对目标对象进行了虚拟，因此该代理与该目标对象表面上可以被当作同一个对象来对待。
>
> 代理允许你拦截在目标对象上的底层操作，而这原本是 JS 引擎的内部能力。拦截行为使用了一个能够响应特定操作的函数（被称为陷阱）。


#### （一）概述

从以上书籍中的描述，我们可以大概总结一下：  
使用 `Proxy` 可以`创建`一个代理对象，它能够实现对 `其他对象` 的代理。

这里的关键词有两个：

1. **“创建”** ： 意为代理对象这是一个新对象。
2. **“其他对象”** ： 只能代理对象，无法代理非对象值，例如：数字、字符串、布尔类型。

那么，代理指的是什么呢？

所谓代理，指的是对一个对象基本语义的代理。它允许我们拦截并重新定义对一个对象的基本操作。  
这句话的关键词比较多，我们逐一解释。

#### （二）基本操作

前文也提到了基本操作，这里又说到了基本语义，那么什么样的才是基本的呢？

```ts
const obj = { foo: 1 };

obj.foo; // 读取属性 foo 的值
obj.foo++; // 读取和设置属性 foo 的值
```

给出一个对象，我们可以读取某个属性的值，同样也可以设置某个属性的值。

类似这种读取、设置属性值的操作，就属于基本语义的操作，即`基本操作`。当然，勿6！  
可以理解成`单步最简动作`，而不是`复合动作`。

既然是`基本操作`，那么它就可以使用`Proxy`拦截：

```ts
const p = new Proxy(obj, {
  // 拦截读取属性操作
  get() { /*...*/ },
  // 拦截设置属性操作
  set() { /*...*/ }
})
```

在`JavaScript`中，**万物皆对象**。

那么函数自然也不例外，例如一个函数也是一个对象，所以`调用函数`也是对一个对象的`基本操作`：

```ts
const fn = (name) => {
  console.log('我是：', name)
}

// 调用函数是对对象的基本操作
fn()
```

因此，我们可以用 `Proxy` 来拦截函数的调用操作，这里我们使用 `apply` 拦截函数的调用：

```js
const p2 = new Proxy(fn, {
  // 使用 apply 拦截函数调用
  apply(target, thisArg, ...argumentsList) {
    return Reflect.apply(...arguments);
  }
})

p2('IamZJT') // 输出：'我是：IamZJT'
```

#### （三）复合操作

既然有`基本操作`，那对应的就有`复合操作`。

调用一个对象下的方法就是典型的`复合操作`。

```js
objj.fn();
```

实际上，调用一个对象下的方法，是由两个基本操作组成的。

第一个基本操作是 `get`，即先通过 `get` 操作得到 `obj.fn` 属性。  
第二个基本操作是 `函数调用`，即通过 `get` 得到 `obj.fn` 的值后再调用它，也就是我们上面说到的 `Reflect.apply`。


### 四、Reflect又是什么？

`Reflect`又叫反射，设计的目的主要有以下几个：

（1）将`Object`对象的一些明显属于语言内部的方法（比如`Object.defineProperty`），放到`Reflect`对象上。现阶段，某些方法同时在`Object`和`Reflect`对象上部署，未来的新方法将只部署在`Reflect`对象上。也就是说，从`Reflect`对象上可以拿到语言内部的方法。

（2）修改某些`Object`方法的返回结果，让其变得更合理。比如，`Object.defineProperty(obj, name, desc)` 在无法定义属性时，会抛出一个错误，而`Reflect.defineProperty(obj, name, desc)`则会返回`false`。

```js
// 老写法
try {
  Object.defineProperty(target, property, attributes);
  // success
} catch (e) {
  // failure
}

// 新写法
if (Reflect.defineProperty(target, property, attributes)) {
  // success
} else {
  // failure
}
```

（3）让`Object`操作都变成`函数行为`。某些`Object`操作是`命令式`，比如`name in obj`和`delete obj[name]`，而`Reflect.has(obj, name)`和`Reflect.deleteProperty(obj, name)`让它们变成了函数行为，。

（4）其实可能你已经注意到了，`Reflect`对象的方法与`Proxy`对象的方法一一对应，只要是`Proxy`对象的方法，就能在`Reflect`对象上找到对应的方法。这就让`Proxy`对象可以方便地调用对应的`Reflect`方法，完成默认行为，作为修改行为的基础。`Proxy`可以捕获13种不同的基本操作，这些操作有各自不同的`Reflect API`方法。

这里稍微列举一下：

- `Reflect.get()` → 读取属性
- `Reflect.set()` → 设置属性
- `Reflect.has()` → 属性是否存在，等同于in
- `Reflect.defineProperty()` → 定义属性
- `Reflect.getOwnPropertyDescriptor()` → 获取指定属性的描述对象
- `Reflect.deleteProperty()` → 删除属性，等同于delete
- `Reflect.ownKeys()()` → 返回自身属性的枚举
- `Reflect.getPrototypeOf()` → 用于读取对象的__proto__属性
- `Reflect.setPrototypeOf()` → 设置目标对象的原型（prototype）
- `Reflect.isExtensible()` → 表示当前对象是否可扩展
- `Reflect.preventExtensions()` → 将一个对象变为不可扩展
- `Reflect.apply()` → 调用函数，等同于等同于 Function.prototype.apply.call()，但借用原型方法可读性太差
- `Reflect.construct()`  → 等同于new

到现在，可能有人要说了，你说了这么一大堆七七八八的，看也没怎么看明白。  
上篇文章的坑不还是没填，到现在还是不清楚为什么要用`Reflect.get`和`Reflect.set`。

### 五、vue3中为什么使用Reflect？

不要着急，有了上篇文章的响应式基础和这些前置知识，我们就能知道为什么要使用`Reflect`了。

其实`Reflect.get`还有第三个参数，即指定接收者`receiver`，你可以把它理解为函数调用过程中的 `this`。

```js
const obj = { foo: 1 };

// 输出的是 2 而不是 1
console.log(Reflect.get(obj, 'foo', { foo: 2 }));
```

我们看一下不用`Reflect`的情况：

```js
const obj = { foo: 1 }

const p = new Proxy(obj, { 
  get(target, key) {
    track(target, key);
    // 注意，这里我们没有使用 Reflect.get 完成读取
    return target[key];
  },
  set(target, key, newVal) { 
    // 这里同样没有使用 Reflect.set 完成设置
    target[key] = newVal;
    trigger(target, key);
  }
})
```

那么这么写的问题出在什么地方呢？我们借助`effect`让问题暴露出来。  
首先，我们修改一下`obj`对象，为它添加`bar`属性：

```js
const obj = {
  foo: 1,
  get bar() {
    return this.foo;
  }
}
```

可以看到：`bar`属性是一个访问器属性，它返回了`this.foo`属性的值。接着，我们在`effect`副作用函数中通过代理对象`p`访问`bar`属性：

```js
effect(() => {
  console.log(p.bar);
  // 1
})
```

我们来分析一下这个过程发生了什么。

当`effect`注册的副作用函数执行时，会读取`p.bar`属性，它发现`p.bar`是一个访问器属性，因此执行`getter`函数。  
由于在`getter`函数中通过`this.foo`读取了`foo`属性值，因此我们认为副作用函数与属`foo`之间也会建立联系。  
当我们修改`p.foo`的值时应该能够触发响应，使得副作用函数重新执行才对。  
然而实际并非如此，当我们尝试修改`p.foo`的值时：

```js
p.foo = 2;
```

副作用函数并没有重新执行，问题出在哪里呢？  
实际上，问题就出在`bar`属性的访问器函数`getter`里：

```js
const obj = {
  foo: 1,
  get bar() {
    // 这里的this指向哪里
    return this.foo;
  }
}
```

当我们使用`this.foo`读取`foo`属性值时，这里的`this`指向的是谁呢？  
我们回顾一下整个流程。首先，我们通过代理对象`p`访问`p.bar`，这会触发代理对象的`get`拦截函数执行：

```js
const p = new Proxy(obj, {
  get(target, key) {
    track(target, key)
    // 注意，这里我们没有使用 Reflect.get 完成读取
    return target[key];
   },
   // 省略部分代码
})
```

在`get`拦截函数内，通过`target[key]`返回属性值。  
其中`target`是原始对象`obj`，而`key`就是字符串`'bar'`，所以`target[key]`相当于`obj.bar`。  
因此，当我们使用`p.bar`访问`bar`属性时，它的`getter`函数内的`this`指向的其实是原始对象`obj`，这说明我们最终访问的其实是`obj.foo`。  
很显然，在副作用函数内通过原始对象访问它的某个属性是不会建立响应联系的，这等价于：

```js
effect(() => {
  // obj 是原始数据，不是代理对象，这样的访问不能够建立响应联系
  // 这里也就是上文中开头引用中提到的：直接操作会绕过代理施予的行为。
  obj.foo;
})
```

因为这样做不会建立响应联系，所以出现了无法触发响应的问题。  
那么这个问题应该如何解决呢？这时`Reflect.get`函数就派上用场了。  
先给出解决问题的代码：

```js
const p = new Proxy(obj, {
  // 拦截读取操作，接收第三个参数 receiver
  get(target, key, receiver) {
    track(target, key)
    // 使用 Reflect.get 返回读取到的属性值
    return Reflect.get(target, key, receiver)
  },
  // 省略部分代码
})
```

如上面的代码所示，代理对象的`get`拦截函数接收第三个参数`receiver`，它代表谁在读取属性，例如：

```js
p.bar // 代理对象 p 在读取 bar 属性
```

当我们使用代理对象`p`访问`bar`属性时，那么`receiver`就是`p`，你可以把它简单地理解为函数调用中的`this`。  
接着关键的一步发生了，我们使用`Reflect.get(target, key, receiver)`代替之前的`target[key]`，这里的关键点就是第三个参数`receiver`。  
我们已经知道它就是代理对象`p`，所以访问器属性`bar`的`getter`函数内的`this`指向代理对象`p`：

```js
const obj = {
  foo: 1,
  get bar() {
    // 现在这里的 this 为代理对象 p
    return this.foo;
  }
}
```

可以看到，`this`由原始对象`obj`变成了代理对象`p`。  
很显然，这会在副作用函数与响应式数据之间建立响应联系，从而达到依赖收集的效果。  
如果此时再对`p.foo`进行`set`操作，会发现已经能够触发副作用函数重新执行了。  
正是基于上述原因，后文讲解中将统一使用`Reflect.*`方法。