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

	push('return ');

	const functionName = 'render';
	const args = ['_ctx', '_cache'];
	const signature = args.join(', ');

	push(`function ${ functionName } (${ signature }) {`);
	push('return ');

	genCode(ast.codegenNode, context);
	push(`}`);

	return {
		code: context.code
	};
}

function genCode(node, { push }) {
	push(`'${ node.content }'`);
}
