import { createRenderer } from '../runtime-core';
import { isOn } from '../shared';

function createElement(type) {
	return document.createElement(type);
}

function patchProp(el, key, val) {
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
