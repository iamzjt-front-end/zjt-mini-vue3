// + Array -> Array

import { ref, h } from '../../lib/zjt-mini-vue.esm.js';

// ! diff 双端对比

// * 1. 左侧的对比
// * (a b) c
// * (a b) d e
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'E' }, 'E'),
// ];

// * 2. 右侧的对比
// * a (b c)
// * d e (b c)
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C'),
// ];

// * 3. 新的比老的长 ->> 创建新的
// * 3.1 左侧开始对比
// * (a, b)
// * (a, b) c
// + i = 2, e1 = 1, e2 = 2
const prevChildren = [
	h('p', { key: 'A' }, 'A'),
	h('p', { key: 'B' }, 'B')
];
const nextChildren = [
	h('p', { key: 'A' }, 'A'),
	h('p', { key: 'B' }, 'B'),
	h('p', { key: 'C' }, 'C')
];
// * 3.2 右侧开始对比
// * (a, b)
// * c (a, b)
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B')
// ];
// const nextChildren = [
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B')
// ];


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
