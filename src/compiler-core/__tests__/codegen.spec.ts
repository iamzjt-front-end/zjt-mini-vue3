import { baseParse } from '../parse';
import { generate } from '../codegen';
import { transform } from '../transform';
import { transformsExpression } from '../transforms/transformsExpression';
import { transformElement } from '../transforms/transformElement';
import { transformText } from '../transforms/transformText';

describe('codegen', () => {
	it('string', () => {
		const ast = baseParse('hi');
		transform(ast);
		const { code } = generate(ast);
		expect(code).toMatchInlineSnapshot(`"return function render (_ctx, _cache) {return 'hi'}"`);
	});

	it('interpolation', () => {
		const ast = baseParse('{{ message }}');
		transform(ast, {
			nodeTransforms: [transformsExpression]
		});
		const { code } = generate(ast);
		expect(code).toMatchInlineSnapshot(`
"const { toDisplayString: _toDisplayString } = Vue
return function render (_ctx, _cache) {return _toDisplayString(_ctx.message)}"
`);
	});

	it('element', () => {
		const ast = baseParse('<div></div>');
		transform(ast, {
			nodeTransforms: [transformElement]
		});
		const { code } = generate(ast);
		expect(code).toMatchInlineSnapshot(`
"const { createElementVNode: _createElementVNode } = Vue
return function render (_ctx, _cache) {return (_createElementVNode)('div')}"
`);
	});

	it('integrated case', () => {
		const ast: any = baseParse('<div>hi, {{ message }}</div>');
		transform(ast, {
			nodeTransforms: [transformsExpression, transformElement, transformText]
		});

		const { code } = generate(ast);
		expect(code).toMatchInlineSnapshot(`
"const { toDisplayString: _toDisplayString, createElementVNode: _createElementVNode } = Vue
return function render (_ctx, _cache) {return (_createElementVNode)('div', null, 'hi, ' + _toDisplayString(_ctx.message))}"
`);
	});
});
