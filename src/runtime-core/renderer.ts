import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from '../shared/ShapeFlags';
import { Fragment, Text } from './vnode';
import { createAppAPI } from './createApp';
import { effect } from '../reactivity/effect';

export function createRenderer(options) {
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert
	} = options;

	function render(vnode, container, parentComponent?) {
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
				if (shapeFlag & ShapeFlags.ELEMENT) {
					processElement(n1, n2, container, parentComponent);
				} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
		} else {
			patchElement(n1, n2, container);
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
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			el.textContent = children;
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(vnode, el, parentComponent);
		}

		hostInsert(el, container);
	}

	function patchElement(n1, n2, container) {
		console.log('patchElement');
		console.log('n1:', n1);
		console.log('n2:', n2);

		const oldProps = n1.props || {};
		const newProps = n1.props || {};
		patchProps(oldProps, newProps);
	}

	function patchProps(oldProps, newProps) {
		for (const key in newProps) {
			const prevProp = oldProps[key];
			const nextProp = newProps[key];
			if (prevProp !== nextProp) {

			}
		}
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
			} else {
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
