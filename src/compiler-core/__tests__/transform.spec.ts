import { baseParse } from '../parse';
import { transform } from '../transform';

describe('transform', () => {
	it('happy path', () => {
		const ast = baseParse('<div>hi, {{ message }}</div>');

		transform(ast);

		const nodeText = ast.children[0].children[0].content;
		expect(nodeText).toBe('hi, IamZJT');
	});
});
