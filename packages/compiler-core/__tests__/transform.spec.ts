import { baseParse } from '../src/parse';
import { transform } from '../src/transform';
import { NodeTypes } from '../src/ast';

describe('transform', () => {
	it('happy path', () => {
		const ast = baseParse('<div>hi, {{ message }}</div>');

		const plugin = node => {
			if (node.type === NodeTypes.TEXT) {
				node.content += 'IamZJT';
			}
		};

		transform(ast, {
			nodeTransforms: [plugin]
		});

		const nodeText = ast.children[0].children[0].content;
		expect(nodeText).toBe('hi, IamZJT');
	});
});
