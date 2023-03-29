export { ShapeFlags } from './ShapeFlags';
export * from './toDisplayString';

export const extend = Object.assign;

export const EMPTY_OBJ = {};

export const isObject = (val) => {
	return val !== null && typeof val === 'object';
};

export const hasChanged = (val, newVal) => {
	return !Object.is(val, newVal);
};

export const isArray = Array.isArray;

export const isString = (val) => typeof val === 'string';

export const isFunction = (val) => typeof val === 'function';

const onRE = /^on[^a-z]/;
export const isOn = (key: string) => onRE.test(key);

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

// 转成驼峰命名
export const camelize = (str: string) => {
	return str.replace(/-(\w)/g, (_, c: string) => {
		return c ? c.toUpperCase() : '';
	});
};

// 首字母大写
export const capitalize = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

// 转成on开头
export const toHandlerKey = (str: string) => {
	return str ? 'on' + capitalize(str) : '';
};
