import { ref } from '../../lib/zjt-mini-vue.esm.js';

export const App = {
	name: 'App',
	template: `<div>hi, {{ msg }} {{ count }}</div>`,
	setup() {
		const count = (window.count = ref(0));
		return {
			msg: 'zjt-mini-vue',
			count
		};
	}
};
