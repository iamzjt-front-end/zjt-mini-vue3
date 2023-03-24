import { NodeTypes } from './ast';

function createCodegenContext() {
	const context = {
		code: '',
		push(source) {
			context.code += source;
		}
	};

	return context;
}

export function generate(ast) {
	const context = createCodegenContext();
	const { push } = context;

	getFunctionPreamble(push, ast);
	const functionName = 'render';
	const args = ['_ctx', '_cache'];
	const signature = args.join(', ');

	push(`function ${ functionName } (${ signature }) {`);
	push('return ');
	genNode(ast.codegenNode, context);
	push(`}`);

	return {
		code: context.code
	};
}

function getFunctionPreamble(push: (source) => void, ast) {
	const VueBinding = 'Vue';
	const aliasHelper = (s) => `${ s }: _${ s }`;
	if (ast.helpers.length > 0) {
		push(`const { ${ ast.helpers.map(aliasHelper).join(', ') } } = ${ VueBinding }`);
		push('\n');
	}
	push('return ');
}

function genNode(node, context) {
	switch (node.type) {
		case NodeTypes.TEXT:
			genText(node, context);
			break;
		case NodeTypes.INTERPOLATION:
			genInterpolation(node, context);
			break;
		case NodeTypes.SIMPLE_EXPRESSION:
			genExpression(node, context);
			break;
		default:
			break;
	}
}

function genText(node, context) {
	const { push } = context;
	push(`'${ node.content }'`);
}

function genInterpolation(node, context) {
	const { push } = context;
	push(`_toDisplayString(`);
	genNode(node.content, context);
	push(')');
}

function genExpression(node, context) {
	const { push } = context;
	push(`${ node.content }`);
}
