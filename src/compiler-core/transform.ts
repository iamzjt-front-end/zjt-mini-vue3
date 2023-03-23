import { NodeTypes } from './ast';

export function transform(root) {
	// * 1. 遍历 - 深度优先搜索
	traverseNode(root);

	// * 2. 修改 text content

}

function traverseNode(node: any) {
	if (node.type === NodeTypes.TEXT) {
		console.log(node);
		node.content += 'IamZJT';
	}

	const children = node.children;
	if (children) {
		for (let i = 0; i < children.length; i++) {
			const node = children[i];
			traverseNode(node);
		}
	}
}
