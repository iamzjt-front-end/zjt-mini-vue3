import { NodeTypes } from '../ast';
import { isText } from '../util';

export function transformText(node) {
	if (node.type === NodeTypes.ELEMENT) {
		return () => {
			const { children } = node;

			let currentContainer;
			for (let i = 0; i < children.length; i++) {
				const child = children[i];

				if (child.type === NodeTypes.TEXT) {
					if (isText(child)) {
						for (let j = i + 1; j < children.length; j++) {
							const next = children[j];

							if (isText(next)) {
								if (!currentContainer) {
									// 创建一个COMPOUND_EXPRESSION类型的节点，存放 TEXT 和 INTERPOLATION
									currentContainer = children[i] = {
										type: NodeTypes.COMPOUND_EXPRESSION,
										children: [child]
									};
								}
								currentContainer.children.push(' + ', next);
								children.splice(j, 1);
								// 回退一位，因为删除了一个元素
								j--;
							} else {
								currentContainer = undefined;
								break;
							}
						}
					}
				}
			}
		};
	}
}
