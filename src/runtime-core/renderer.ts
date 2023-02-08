import { createComponentInstance, setupComponent } from './component';
import { isObject, isArray } from '../shared';
import { ShapeFlags } from '../shared/ShapeFlags';

export function render(vnode, container) {
  // patch
  patch(vnode, container);
}

function patch(vnode, container) {
  const { shapeFlag } = vnode;

  // 获取shapeFlag，并通过与运算判断节点类型
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
    el.setAttribute(key, val);
  }

  // 判断子节点类型
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
