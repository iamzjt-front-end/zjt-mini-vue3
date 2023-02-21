const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
};
const isArray = Array.isArray;
const isString = (val) => typeof val === 'string';
const isFunction = (val) => typeof val === 'function';
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// 转成驼峰命名
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
// 首字母大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// 转成on开头
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: undefined
    };
    // 判断子节点类型并加上
    if (isString(vnode.children)) {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (isArray(vnode.children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // slot -> type: component + children: object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return isString(type) ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (isFunction(slot)) {
            return createVNode(Fragment, {}, slot(props));
        }
        else {
            return createVNode(Fragment, {}, slot);
        }
    }
}

const publicPropertiesMap = {
    $el: i => i.vnode.el,
    $slots: i => i.slots
};
const PublicInstanceHandlers = {
    get({ _: instance }, key) {
        // setupState: setup return出来的
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

// const effectStack: any = [];
let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    scheduler;
    _fn;
    deps = [];
    active = true; // 是否已经 stop 过，true 为 未stop
    parent = undefined;
    onStop;
    // 在构造函数的参数上使用public等同于创建了同名的成员变量
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this._fn = fn;
    }
    run() {
        // 已经被stop，那就直接返回结果
        if (!this.active) {
            return this._fn();
        }
        let parent = activeEffect;
        let lastShouldTrack = shouldTrack;
        while (parent) {
            if (parent === this) {
                return;
            }
            parent = parent.parent;
        }
        try {
            this.parent = activeEffect;
            // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
            activeEffect = this;
            shouldTrack = true;
            cleanupEffect(this);
            return this._fn();
        }
        finally {
            // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集
            // 调用完以后就恢复上次的状态
            activeEffect = this.parent;
            shouldTrack = lastShouldTrack;
            this.parent = undefined;
        }
        // if (!effectStack.includes(this)) {
        //   cleanupEffect(this);
        //   let lastShouldTrack = shouldTrack;
        //   try {
        //     // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
        //     shouldTrack = true;
        //     // 入栈
        //     effectStack.push(this);
        //     activeEffect = this;
        //     return this._fn();
        //   } finally {
        //     // 出栈
        //     effectStack.pop();
        //     // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
        //     // 恢复 shouldTrack 开启之前的状态
        //     shouldTrack = lastShouldTrack;
        //     activeEffect = effectStack[effectStack.length - 1];
        //   }
        // }
    }
    stop() {
        // 要从收集到当前依赖的dep中删除当前依赖activeEffect
        // 但是我们根本不知道activeEffect存在于哪些dep中，所以就要用activeEffect反向收集dep
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    const { deps } = effect;
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0;
    }
}
// * ============================== ↓ 依赖收集 track ↓ ============================== * //
// * targetMap: target -> key
const targetMap = new WeakMap();
// * target -> key -> dep
function track(target, key) {
    if (!isTracking())
        return;
    // * depsMap: key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    // * dep
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
// * ============================== ↓ 触发依赖 trigger ↓ ============================== * //
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    if (!dep)
        return;
    triggerEffects(dep);
}
function triggerEffects(dep) {
    const effects = new Set();
    // + 如果trigger触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
    dep && dep.forEach(effect => {
        if (effect !== activeEffect) {
            effects.add(effect);
        }
    });
    for (const effect of effects) {
        if (effect.scheduler) {
            // ps: effect._fn 为了让scheduler能拿到原始依赖
            effect.scheduler(effect._fn);
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        else if (key === "__v_raw" /* ReactiveFlags.RAW */) {
            return target;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// * reactive
const mutableHandlers = {
    get,
    set
};
// * readonly
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        // ! 抛出警告⚠️ 不可以被set
        console.warn(`key: ${key} set value: ${value} failed, because the target is readonly!`, target);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
function createReactiveObject(target, baseHandlers, proxyMap) {
    if (!isObject(target)) {
        console.warn(`value cannot be made reactive: ${String(target)}`);
        return target;
    }
    if (target["__v_raw" /* ReactiveFlags.RAW */]) {
        return target;
    }
    const existingProxy = proxyMap.get(target);
    // + 这里解决的是reactive多层嵌套的问题
    if (existingProxy) {
        return existingProxy;
    }
    const proxy = new Proxy(target, baseHandlers);
    // + 缓存一下已经被代理的对象
    proxyMap.set(target, proxy);
    return proxy;
}
function reactive(target) {
    return createReactiveObject(target, mutableHandlers, reactiveMap);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers, readonlyMap);
}
function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyHandlers, shallowReadonlyMap);
}

function emit(instance, event, ...args) {
    // instance.props -> event
    const { props } = instance;
    // TPP
    // 先实现特定场景下行为 -> 重构成通用
    // event add -> onAdd
    // add-foo -> addFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlot(children, instance.slots);
    }
}
function normalizeObjectSlot(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = isFunction(value)
            ? (props) => normalizeSlotValue(value(props))
            : normalizeSlotValue(value);
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}

class RefImpl {
    _value;
    dep;
    __v_isRef = true;
    constructor(value) {
        this._value = isObject(value) ? reactive(value) : value;
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        if (hasChanged(newVal, this._value)) {
            this._value = newVal;
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref?.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        // * get: age (ref) -> return .value
        // * get: not ref -> return value
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        // * set ref -> .value
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function object
    // todo function
    if (isObject(setupResult)) {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 存
    // 存在哪里 -> 当前组件实例对象
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { provides } = currentInstance;
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            return isFunction(defaultValue) ? defaultValue() : defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转换成 vNode
                // 所有的逻辑操作都会给予 vNode 做处理
                // 首先 rootComponent -> vNode
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;
    function render(vnode, container, parentComponent) {
        // patch
        patch(null, vnode, container, parentComponent);
    }
    // n1 -> 老的
    // n2 -> 新的
    function patch(n1, n2, container, parentComponent) {
        const { type, shapeFlag } = n2;
        // Fragment -> 只渲染children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // 获取shapeFlag，并通过与运算判断节点类型
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, val);
        }
        // 判断子节点类型
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function patchElement(n1, n2, container) {
        console.log('patchElement');
        console.log('n1:', n1);
        console.log('n2:', n2);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach(v => patch(null, v, container, parentComponent));
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        effect(() => {
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                const subTree = (instance.subtree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                const { proxy } = instance;
                // 生成新的subTree
                const subTree = instance.render.call(proxy);
                // 拿到之前的subTree
                const prevSubTree = instance.subtree;
                // 重新保存新的subTree
                instance.subtree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    // 实现注册事件
    if (isOn(key)) {
        const name = key.slice(2).toLowerCase();
        el.addEventListener(name, val);
    }
    else {
        // 设置属性
        el.setAttribute(key, val);
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
