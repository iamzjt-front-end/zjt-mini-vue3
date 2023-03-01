import { createComponentInstance, setupComponent } from './component';
import { ShapeFlags } from '../shared/ShapeFlags';
import { Fragment, Text } from './vnode';
import { createAppAPI } from './createApp';
import { effect } from '../reactivity/effect';
import { EMPTY_OBJ } from '../shared';

export function createRenderer(options) {
	const {
		createElement: hostCreateElement,
		patchProp: hostPatchProp,
		insert: hostInsert,
		remove: hostRemove,
		setElementText: hostSetElementText
	} = options;

	function render(vnode, container) {
		patch(null, vnode, container, null, null);
	}

	// * n1 -> 老的
	// * n2 -> 新的
	function patch(n1, n2, container, parentComponent, anchor) {
		const { type, shapeFlag } = n2;

		// Fragment -> 只渲染children
		switch (type) {
			case Fragment:
				processFragment(n1, n2, container, parentComponent, anchor);
				break;
			case Text:
				processText(n1, n2, container);
				break;
			default:
				// 获取shapeFlag，并通过与运算判断节点类型
				if (shapeFlag & ShapeFlags.ELEMENT) {
					processElement(n1, n2, container, parentComponent, anchor);
				} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
					processComponent(n1, n2, container, parentComponent, anchor);
				}
				break;
		}
	}

	function processFragment(n1, n2, container, parentComponent, anchor) {
		mountChildren(n2.children, container, parentComponent, anchor);
	}

	function processText(n1, n2, container) {
		const { children } = n2;
		const textNode = (n2.el = document.createTextNode(children));
		container.append(textNode);
	}

	function processElement(n1, n2, container, parentComponent, anchor) {
		if (!n1) {
			// 初次加载
			mountElement(n2, container, parentComponent, anchor);
		} else {
			// 更新
			patchElement(n1, n2, container, parentComponent, anchor);
		}
	}

	function mountElement(vnode, container, parentComponent, anchor) {
		const { type, props, children, shapeFlag } = vnode;

		const el = (vnode.el = hostCreateElement(type));

		for (const key in props) {
			const val = props[key];
			hostPatchProp(el, key, null, val);
		}

		// 判断子节点类型
		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			el.textContent = children;
		} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(vnode.children, el, parentComponent, anchor);
		}

		hostInsert(el, container, anchor);
	}

	function patchElement(n1, n2, container, parentComponent, anchor) {
		const oldProps = n1.props || EMPTY_OBJ;
		const newProps = n2.props || EMPTY_OBJ;

		const el = (n2.el = n1.el);

		patchChildren(n1, n2, el, parentComponent, anchor);
		patchProps(el, oldProps, newProps);
	}

	function patchChildren(n1, n2, container, parentComponent, anchor) {
		const prevShapeFlag = n1.shapeFlag;
		const c1 = n1.children;
		const { shapeFlag } = n2;
		const c2 = n2.children;

		if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
			// ! 新的节点是 Text
			if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
				// * 1. Array -> Text
				unmountChildren(n1.children);
			}
			if (c1 !== c2) {
				// * 2. Text -> Text
				hostSetElementText(container, c2);
			}
		} else {
			// ! 新的节点是 Array
			if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
				// * 3. Text -> Array
				hostSetElementText(container, '');
				mountChildren(c2, container, parentComponent, anchor);
			} else {
				// * 4. Array -> Array diff
				patchKeyedChildren(c1, c2, container, parentComponent, anchor);
			}
		}
	}

	// ! diff
	function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
	  let i = 0;
		let e1 = c1.length - 1;
		let e2 = c2.length - 1;

		function isSameVNodeType(n1, n2) {
			// 基于type key判断
			return n1.type === n2.type && n1.key === n2.key;
		}

		// * 1. 左侧的对比
		// * (a b) c
		// * (a b) d e
		while (i <= e1 && i <= e2) {
			const n1 = c1[i];
			const n2 = c2[i];

			if (isSameVNodeType(n1, n2)) {
				patch(n1, n2, container, parentComponent, anchor);
			} else {
				break;
			}

			i++;
		}

		// * 2. 右侧的对比
		// * a (b c)
		// * d e (b c)
		while(i <= e1 && i <= e2) {
			const n1 = c1[e1];
			const n2 = c2[e2];

			if (isSameVNodeType(n1, n2)) {
				patch(n1, n2, container, parentComponent, anchor);
			} else {
				break;
			}

			e1--;
			e2--;
		}

		// * 3. 新的比老的长 ->> 创建新的
		// * 3.1 左侧开始对比
		// * (a, b)
		// * (a, b) c
		if (i > e1) {
			if (i <= e2) {
				const nextPos = i - 1;
				const anchor = nextPos < c1.length ? null : c2[nextPos];
				patch(null, c2[i], container, parentComponent, anchor);
			}
		}
	}

	function unmountChildren(children) {
		for (let i = 0; i < children.length; i++) {
			const el = children[i].el;
			hostRemove(el);
		}
	}

	function patchProps(el, oldProps, newProps) {
		if (oldProps !== newProps) {
			for (const key in newProps) {
				const prevProp = oldProps[key];
				const nextProp = newProps[key];

				if (prevProp !== nextProp) {
					// 更新
					hostPatchProp(el, key, prevProp, nextProp);
				}
			}

			if (oldProps !== EMPTY_OBJ) {
				for (const key in oldProps) {
					if (!(key in newProps)) {
						hostPatchProp(el, key, oldProps[key], null);
					}
				}
			}
		}
	}

	function mountChildren(children, container, parentComponent, anchor) {
		children.forEach(v => patch(null, v, container, parentComponent, anchor));
	}

	function processComponent(n1, n2, container, parentComponent, anchor) {
		mountComponent(n2, container, parentComponent, anchor);
	}

	function mountComponent(initialVnode, container, parentComponent, anchor) {
		const instance = createComponentInstance(initialVnode, parentComponent);

		setupComponent(instance);
		setupRenderEffect(instance, initialVnode, container, anchor);
	}

	function setupRenderEffect(instance, initialVnode, container, anchor) {
		effect(() => {
			if (!instance.isMounted) {
				console.log('init');
				const { proxy } = instance;
				const subTree = (instance.subtree = instance.render.call(proxy));

				patch(null, subTree, container, instance, anchor);

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

				patch(prevSubTree, subTree, container, instance, anchor);
			}
		});
	}

	return {
		createApp: createAppAPI(render)
	};
}
