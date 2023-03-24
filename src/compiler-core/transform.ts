import { NodeTypes } from './ast';
import { TO_DISPLAY_STRING } from './runtimeHelpers';

export function transform(root, options = {}) {
	const context = createTransformContext(root, options);

	// * 1. 遍历 - 深度优先搜索
	traverseNode(root, context);

	// root.codegenNode
	createRootCodegen(root, context);

	root.helpers = [...context.helpers.keys()];
}

function createTransformContext(root, options) {
	const context = {
		root,
		nodeTransforms: options.nodeTransforms || [],
		helpers: new Map(),
		helper(key) {
			context.helpers.set(key, 1);
		}
	};

	return context;
}

function traverseNode(node: any, context: any) {
	// * 2. 修改 text content
	const { nodeTransforms } = context;
	for (let i = 0; i < nodeTransforms.length; i++) {
		const nodeTransform = nodeTransforms[i];
		nodeTransform(node, context);
	}

	switch (node.type) {
		case NodeTypes.INTERPOLATION:
			context.helper(TO_DISPLAY_STRING);
			break;
		case NodeTypes.ROOT:
		case NodeTypes.ELEMENT:
			traverseChildren(node, context);
			break;
		default:
			break;
	}
}

function traverseChildren(node: any, context: any) {
	const children = node.children;
	for (let i = 0; i < children.length; i++) {
		const node = children[i];
		traverseNode(node, context);
	}
}

function createRootCodegen(root, context) {
	root.codegenNode = root.children[0];
}
