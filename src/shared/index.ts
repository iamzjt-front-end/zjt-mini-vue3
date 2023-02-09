export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
};

export const isArray = Array.isArray;

const onRE = /^on[^a-z]/;
export const isOn = (key: string) => onRE.test(key);

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
