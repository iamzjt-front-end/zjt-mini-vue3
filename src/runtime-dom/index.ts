import { createRenderer } from '../runtime-core';
import { isOn } from '../shared';

function createElement(type) {
	console.log('---------createElement---------');
	return document.createElement(type);
}

function patchProp(el, key, val) {
	console.log('---------patchProp---------');
	// 实现注册事件
	if (isOn(key)) {
	  const name = key.slice(2).toLowerCase();
	  el.addEventListener(name, val);
	} else {
		// 设置属性
	  el.setAttribute(key, val);
	}
}

function insert(el, parent) {
	console.log('---------insert---------');
	parent.append(el);
}

const renderer: any = createRenderer({
	createElement,
	patchProp,
	insert
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from '../runtime-core';
