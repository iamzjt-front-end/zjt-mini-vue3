// import { createRenderer } from '../../lib/zjt-mini-vue.esm.js';
// import { App } from './App.js';

console.log(PIXI);

const game = new PIXI.Application({
	width: 500,
	height: 500
});

document.body.append(game.view);

// const renderer = createRenderer({
// 	createElement(type) {
//
// 	},
// 	patchProp(el, key, value) {
//
// 	},
// 	insert(el, parent) {
//
// 	}
// });
//
// const rootContainer = document.querySelector('#app');
//
// renderer.createApp(App).mount(rootContainer);
