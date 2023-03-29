// + Array -> Array

import { ref, h } from '../../dist/zjt-mini-vue.esm.js';

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
// * (a, b) c d
// + i = 2, e1 = 1, e2 = 3
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B')
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'D' }, 'D'),
// ];
// * 3.2 右侧开始对比
// * (a, b)
// * c d (a, b)
// + i = 0, e1 = -1, e2 = 1
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B')
// ];
// const nextChildren = [
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B')
// ];

// * 4. 老的比新的长 ->> 删除老的
// * 4.1 左侧开始对比
// * (a, b, c)
// * (a, b)
// + i = 2, e1 = 2, e2 = 1
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C')
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B')
// ];
// * 4.2 右侧开始对比
// * (a, b, c)
// * (b, c)
// + i = 0, e1 = 0, e2 = -1
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C')
// ];
// const nextChildren = [
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C')
// ];

// * 5. 对比中间的部分
// * 删除老的（在老的里面存在，新的里面不存在）
// * 5.1
// * a, b, (c, d), f, g
// * a, b, (e, c), f, g
// * D 节点在新的里面是没有的 -> 需要被删除掉
// * C 节点 props 也发生了变化
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C', id: 'c-prev' }, 'C'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'C', id: 'c-next' }, 'C'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];

// * 5.1.1
// * a, b, (c, e, d, h), f, g
// * a, b, (e, c), f, g
// * 中间部分，老的比新的多。那么当新的全部patch以后，多出来的直接就可以被干掉（优化删除逻辑）
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C', id: 'c-prev' }, 'C'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'H' }, 'H'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'C', id: 'c-next' }, 'C'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];

// * 5.2 移动 (节点存在于新的和老的里面，但是位置变了)
// * 5.2.1
// * a, b, (c, d, e), f, g
// * a, b, (e, c, d), f, g
// * 最长子序列: [1, 2]
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];

// * 5.3 创建新的节点
// * a, b, (c, e), f, g
// * a, b, (e, c, d), f, g
// * d 节点在老的节点中不存在，新的里面存在，所以需要创建
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];

// * 综合例子
// * a, b, (c, d, e, z), f, g
// * a, b, (d, c, y, e), f, g
// + 大致步骤如下：
// + 1. 双端对比确定中间乱序部分
// + 2. 老序列中发现z节点在新序列中不存在，则删除z
// + 3. 老序列中间部分 (c, d, e) 和 新序列中间部分 (d, c, y, e) 进行对比，发现老节点在新序列中为非递增序列，则去取得最长递增子序列
// + 4. 遍历新序列，发现新节点y，则创建y
// + 5. 与最长递增子序列倒序对比，依次插入老节点来进行位置的移动
// const prevChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'Z' }, 'Z'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
// 	h('p', { key: 'A' }, 'A'),
// 	h('p', { key: 'B' }, 'B'),
// 	h('p', { key: 'D' }, 'D'),
// 	h('p', { key: 'C' }, 'C'),
// 	h('p', { key: 'Y' }, 'Y'),
// 	h('p', { key: 'E' }, 'E'),
// 	h('p', { key: 'F' }, 'F'),
// 	h('p', { key: 'G' }, 'G'),
// ];

// ! fix
const prevChildren = [
	h('p', { key: 'A' }, 'A'),
	h('p', {}, 'C'),
	h('p', { key: 'B' }, 'B'),
	h('p', { key: 'D' }, 'D')
];
const nextChildren = [
	h('p', { key: 'A' }, 'A'),
	h('p', { key: 'B' }, 'B'),
	h('p', {}, 'C'),
	h('p', { key: 'D' }, 'D')
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
