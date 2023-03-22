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

		it('text with interpolation', () => {
			const ast = baseParse('some {{ foo + bar }} text');
			const text1 = ast.children[0];
			const text2 = ast.children[2];

			expect(text1).toStrictEqual({
				type: NodeTypes.TEXT,
				content: 'some '
			});
			expect(text2).toStrictEqual({
				type: NodeTypes.TEXT,
				content: ' text'
			});
		});
	});

	describe('integratedCase', () => {
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

		it('text in tag end', () => {
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
					}
				]
			});
		});

		it('nested element', () => {
			const ast = baseParse('<div><p>hi</p>{{ message }}</div>');

			expect(ast.children[0]).toStrictEqual({
				type: NodeTypes.ELEMENT,
				tag: 'div',
				children: [
					{
						type: NodeTypes.ELEMENT,
						tag: 'p',
						children: [
							{
								type: NodeTypes.TEXT,
								content: 'hi'
							}
						]
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

		it('should throw error when lack end tag', () => {
			// * 缺少结束标签 </div>
			expect(() => {
				baseParse('<div><p>hi</p>{{ message }}');
			}).toThrow('Element is missing end tag: div');
		});
	});
});
