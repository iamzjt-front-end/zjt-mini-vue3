// + Text -> Text

import { ref, h } from '../../dist/zjt-mini-vue.esm.js';

const prevChildren = 'oldChildren';
const nextChildren = 'newChildren';

export default {
	name: 'TextToText',
	setup() {
		const isChange = ref(false);
		window.isChange = isChange;

		return {
			isChange
		};
	},
	render() {
		const self = this;
		return self.isChange === true
			? h('div', {}, nextChildren)
			: h('div', {}, prevChildren);
	}
};
