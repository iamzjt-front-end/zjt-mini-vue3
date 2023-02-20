import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from '../shared/ShapeFlags';
import { Fragment, Text } from './vnode';

export function createRenderer(options) {
	const { createElement, patchProp, insert } = options;

	function render(vnode, container, parentComponent?) {
		// patch
		patch(vnode, container, parentComponent);
	}

	function patch(vnode, container, parentComponent) {
		const { type, shapeFlag } = vnode;

		// Fragment -> 只渲染children
		switch (type) {
			case Fragment:
				processFragment(vnode, container, parentComponent);
				break;
			case Text:
				processText(vnode, container);
				break;
			default:
				// 获取shapeFlag，并通过与运算判断节点类型
				if (shapeFlag & ShapeFlags.ELEMENT) {
					processElement(vnode, container, parentComponent);
				} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					processComponent(vnode, container, parentComponent);
				}
				break;
		}
	}

	function processFragment(vnode, container, parentComponent) {
		mountChildren(vnode, container, parentComponent);
	}

	function processText(vnode, container) {
		const { children } = vnode;
		const textNode = (vnode.el = document.createTextNode(children));
		container.append(textNode);
	}

	function processElement(vnode, container, parentComponent) {
		mountElement(vnode, container, parentComponent);
	}

	function mountElement(vnode, container, parentComponent) {
		const { type, props, children, shapeFlag } = vnode;

		//canvas
		// new Element()
		const el = (vnode.el = createElement(type));

		for (const key in props) {
			const val = props[key];
			// 实现注册事件
			// if (isOn(key)) {
			//   const name = key.slice(2).toLowerCase();
			//   el.addEventListener(name, val);
			// } else {
			//   el.setAttribute(key, val);
			// }
			patchProp(el, key, val);
		}
		// canvas
		// el.x = 10

		// 判断子节点类型
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			el.textContent = children;
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(vnode, el, parentComponent);
		}

		// container.append(el);
		// addChild()
		insert(el, container);
	}

	function mountChildren(vnode, container, parentComponent) {
		vnode.children.forEach(v => patch(v, container, parentComponent));
	}

	function processComponent(vnode, container, parentComponent) {
		mountComponent(vnode, container, parentComponent);
	}

	function mountComponent(initialVnode, container, parentComponent) {
		const instance = createComponentInstance(initialVnode, parentComponent);

		setupComponent(instance);
		setupRenderEffect(instance, initialVnode, container);
	}

	function setupRenderEffect(instance, initialVnode, container) {
		const { proxy } = instance;
		const subTree = instance.render.call(proxy);

		patch(subTree, container, instance);

		initialVnode.el = subTree.el;
	}
}
