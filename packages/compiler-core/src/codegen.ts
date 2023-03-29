import { NodeTypes } from './ast';
import { helperNameMap, TO_DISPLAY_STRING, CREATE_ELEMENT_VNODE } from './runtimeHelpers';
import { isString } from '@zjt-mini-vue3/shared';

function createCodegenContext() {
	const context = {
		code: '',
		push(source) {
			context.code += source;
		},
		helper(key) {
			return `_${ helperNameMap[key] }`;
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
	const aliasHelper = (s) => `${ helperNameMap[s] }: _${ helperNameMap[s] }`;
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
		case NodeTypes.ELEMENT:
			genElement(node, context);
			break;
		case NodeTypes.COMPOUND_EXPRESSION:
			genCompoundExpression(node, context);
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
	const { push, helper } = context;
	push(`${ helper(TO_DISPLAY_STRING) }(`);
	genNode(node.content, context);
	push(')');
}

function genExpression(node, context) {
	const { push } = context;
	push(`${ node.content }`);
}

function genElement(node, context) {
	const { push, helper } = context;
	const { tag, props, children } = node;

	push(`(${ helper(CREATE_ELEMENT_VNODE) })(`);

	genNodeList(getNullable([tag, props, children]), context);
	push(')');
}

function genNodeList(nodes, context) {
	const { push } = context;
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (isString(node)) {
			push(node);
		} else {
			genNode(node, context);
		}

		if (i < nodes.length - 1) {
			push(', ');
		}
	}
}

function getNullable(args) {
	return args.map((arg) => arg || 'null');
}

function genCompoundExpression(node, context) {
	const { push } = context;
	const { children } = node;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (isString(child)) {
			push(child);
		} else {
			genNode(child, context);
		}
	}
}
