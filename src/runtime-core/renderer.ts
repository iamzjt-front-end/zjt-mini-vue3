import { createComponentInstance, setupComponent } from './component';
import { isObject, isArray } from '../shared';

export function render(vnode, container) {
  // patch
  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  // todo 判断 是不是 element
  // 是 element 的话，那么就应该处理 element
  // 如何区分 element 还是 component 类型？ -> type

  if (typeof vnode.type === 'string') {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  const { type, props, children } = vnode;

  const el = document.createElement(type);

  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  if (typeof children === 'string') {
    el.textContent = children;
  } else if (isArray(children)) {
    children.forEach(v => patch(v, el));
  }

  container.append(el);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();

  // vnode -> patch
  // vnode -> element -> mountElement

  patch(subTree, container);
}
