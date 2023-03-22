import { baseParse } from '../parse';
import { NodeTypes } from '../ast';

describe('Parse', () => {
	// * 插值
	describe('Interpolation', () => {
		it('simple interpolation', () => {
			const ast = baseParse('{{ message }}');

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.INTERPOLATION,
				content: {
					type: NodeTypes.SIMPLE_EXPRESSION,
					content: 'message'
				}
			});
		});
	});

	describe('element', () => {
		it('empty', () => {
			const ast = baseParse('<div></div>');

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.ELEMENT,
				tag: 'div',
				children: []
			});
		});

		it('simple div', () => {
			const ast = baseParse('<div>hello</div>');

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.ELEMENT,
				tag: 'div',
				children: [
					{
						type: NodeTypes.TEXT,
						content: 'hello'
					}
				]
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
		});
	});

	describe('joint', () => {
		it('hello world', () => {
			const ast = baseParse('<div>hi, {{ message }}</div>');

			// * root -> element -> text
			// *                 -> 插值
			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.ELEMENT,
				tag: 'div',
				children: [
					{
						type: NodeTypes.TEXT,
						content: 'hi, '
					},
					{
						type: NodeTypes.INTERPOLATION,
						content: {
							type: NodeTypes.SIMPLE_EXPRESSION,
							content: 'message'
						}
					}
				]
			});
		});

		it('p', () => {
			const ast = baseParse('<p>{{ name }}, haha!</p>');

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.ELEMENT,
				tag: 'p',
				children: [
					{
						type: NodeTypes.INTERPOLATION,
						content: {
							type: NodeTypes.SIMPLE_EXPRESSION,
							content: 'name'
						}
					},
					{
						type: NodeTypes.TEXT,
						content: ', haha!'
					},
				]
			});
		});
	});
});
