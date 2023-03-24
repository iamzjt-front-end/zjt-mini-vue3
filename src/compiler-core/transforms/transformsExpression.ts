import { NodeTypes } from '../ast';

export function transformsExpression(node) {
	if(node.type === NodeTypes.INTERPOLATION) {
		node.content = processExpression(node.content);
	}
}

function processExpression(node) {
	node.content = `_ctx.${ node.content }`
	return node;
}
