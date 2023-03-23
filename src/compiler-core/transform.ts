function createNodeTransformContext(root, options) {
	const context = {
		root,
		nodeTransforms: options.nodeTransforms || []
	};

	return context;
}

export function transform(root, options) {
	const context = createNodeTransformContext(root, options);

	// * 1. 遍历 - 深度优先搜索
	traverseNode(root, context);
}

function traverseNode(node: any, context: any) {
	// * 2. 修改 text content
	const { nodeTransforms } = context;
	for (let i = 0; i < nodeTransforms.length; i++) {
		const nodeTransform = nodeTransforms[i];
		nodeTransform(node, context);
	}

	traverseChildren(node, context);
}

function traverseChildren(node: any, context: any) {
	const children = node.children;
	if (children) {
		for (let i = 0; i < children.length; i++) {
			const node = children[i];
			traverseNode(node, context);
		}
	}
}
