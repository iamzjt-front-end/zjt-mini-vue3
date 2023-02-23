import { h } from '../../lib/zjt-mini-vue.esm.js';

import ArrayToText from './ArrayToText.js';
import TextToText from './TextToText.js';
import TextToArray from './TextToArray.js';
import ArrayToArray from './ArrayToArray.js';

export const App = {
	name: 'App',
	setup() {},
	render() {
		return h(
			'div',
			{ tId: 1 },
			[
				h('p', {}, '主页'),
				// 1. array -> text
				h(ArrayToText),

				// 2. text -> text
				// h(TextToText),

				// 3. text -> array
				// h(TextToArray),

				// 4. array -> array
				// h(ArrayToArray),
			]
		);
	}
};
