import { NodeTypes } from '../ast';

export function transformsExpression(node) {
	if(node.type === NodeTypes.INTERPOLATION) {
		const rawContent = node.content.content;
		node.content.content = '_ctx.' + rawContent;
	}
}
