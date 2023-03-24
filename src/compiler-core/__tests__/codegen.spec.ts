import { baseParse } from '../parse';
import { generate } from '../codegen';
import { transform } from '../transform';
import { transformsExpression } from '../transforms/transformsExpression';

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
});
