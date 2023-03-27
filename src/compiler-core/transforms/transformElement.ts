import { NodeTypes, createVNodeCall } from '../ast';

export function transformElement(node, context) {
	if (node.type === NodeTypes.ELEMENT) {
		return () => {
			const vnodeTag = `'${ node.tag }'`;
			let vnodeProps;

			const { children } = node;
			let vnodeChildren = children[0];

			node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
		};
	}
}
