import { baseParse } from '../parse';
import { NodeTypes } from '../ast';

describe('Parse', () => {
	// * 插值
	describe('Interpolation', () => {
		it('simple interpolation', () => {
			const ast = baseParse('{{ message }}');

			// root
			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.INTERPOLATION,
				content: {
					type: NodeTypes.SIMPLE_EXPRESSION,
					content: 'message'
				}
			});
		});
	});

	describe('text', () => {
		it('simple text', () => {
			const ast = baseParse('some text');

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.TEXT,
				content: 'some text'
			});
		})
	})
});
