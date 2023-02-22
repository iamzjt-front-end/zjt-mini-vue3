// + Array -> Array

import { ref, h } from '../../lib/zjt-mini-vue.esm.js';

const prevChildren = [
	h('div', {}, 'A'),
	h('div', {}, 'B')
];
const nextChildren = [
	h('div', {}, 'C'),
	h('div', {}, 'D')
];

export default {
	name: 'ArrayToArray',
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
