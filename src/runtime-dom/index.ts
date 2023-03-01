import { createRenderer } from '../runtime-core';
import { isOn } from '../shared';

function createElement(type) {
	return document.createElement(type);
}

function patchProp(el, key, prevVal, nextVal) {
	// 实现注册事件
	if (isOn(key)) {
	  const name = key.slice(2).toLowerCase();
	  el.addEventListener(name, nextVal);
	} else {
		if (nextVal === null || nextVal === undefined) {
			// 删除属性
			el.removeAttribute(key);
		} else {
			// 设置属性
			el.setAttribute(key, nextVal);
		}
	}
}

function insert(child, parent, anchor) {
	// parent.append(el);
	// 当anchor为null时，会默认添加到最后
	parent.insertBefore(child, anchor ?? null);
}

function remove(child) {
  const parent = child.parentNode;
	if (parent) {
		parent.removeChild(child);
	}
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
	createElement,
	patchProp,
	insert,
	remove,
	setElementText
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from '../runtime-core';
