const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
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
function getShapeFlag(type) {
    return isString(type) ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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
// * ============================== ↓ 依赖收集 track ↓ ============================== * //
// * targetMap: target -> key
const targetMap = new WeakMap();
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
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
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function object
    // todo function
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
function patch(vnode, container) {
    const { shapeFlag } = vnode;
    // 获取shapeFlag，并通过与运算判断节点类型
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = document.createElement(type));
    for (const key in props) {
        const val = props[key];
        // 实现注册事件
        if (isOn(key)) {
            const name = key.slice(2).toLowerCase();
            el.addEventListener(name, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    // 判断子节点类型
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el);
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach(v => patch(v, container));
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    initialVnode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转换成 vNode
            // 所有的逻辑操作都会给予 vNode 做处理
            // 首先 rootComponent -> vNode
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (isFunction(slot)) {
            return createVNode('div', {}, slot(props));
        }
        else {
            return createVNode('div', {}, slot);
        }
    }
}

export { createApp, h, renderSlots };
