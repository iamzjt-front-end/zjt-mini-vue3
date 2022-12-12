export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal);
};

export const isArray = Array.isArray