import { baseParse } from '../parse';
import { generate } from '../codegen';
import { transform } from '../transform';

describe('codegen', () => {
	it('string', () => {
		const ast = baseParse('hi');
		transform(ast);
		const { code } = generate(ast);
		expect(code).toMatchInlineSnapshot(`"return function render (_ctx, _cache) {return 'hi'}"`);
	});

	it('interpolation', () => {
		const ast = baseParse('{{ message }}');
		transform(ast);
		const { code } = generate(ast);
		expect(code).toMatchInlineSnapshot(`"const { toDisplayString: _toDisplayString } = Vuereturn function render (_ctx, _cache) {return '[object Object]'}"`);
	});
});
