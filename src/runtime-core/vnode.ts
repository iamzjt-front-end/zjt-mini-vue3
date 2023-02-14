import { ShapeFlags } from '../shared/ShapeFlags';
import { isArray, isString, isObject } from '../shared';

export const Fragment = Symbol('Fragment');

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: undefined
  };

  // 判断子节点类型并加上
  if (isString(vnode.children)) {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (isArray(vnode.children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  // slot -> type: component + children: object
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }

  return vnode;
}

function getShapeFlag(type) {
  return isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}
