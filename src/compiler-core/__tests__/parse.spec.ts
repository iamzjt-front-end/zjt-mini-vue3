import { baseParse } from '../parse';

describe('Parse', () => {
	// * 插值
	describe('Interpolation', () => {
		it('simple interpolation', () => {
			const ast = baseParse('{{ message }}');

			// root
			expect(ast.children[0]).toStrictEqual({
				type: 'interpolation',
				content: {
					type: 'simple_expression',
					content: 'message'
				}
			});
		});
	});
});
