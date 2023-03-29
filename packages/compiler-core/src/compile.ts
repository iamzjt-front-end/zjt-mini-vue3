import { baseParse } from './parse';
import { transform } from './transform';
import { transformsExpression } from './transforms/transformsExpression';
import { transformElement } from './transforms/transformElement';
import { transformText } from './transforms/transformText';
import { generate } from './codegen';

export function baseCompile(template: string) {
	const ast = baseParse(template);
	transform(ast, {
		nodeTransforms: [transformsExpression, transformElement, transformText]
	});

	return generate(ast);
}
