import { trackEffects, triggerEffects, isTracking } from './effect';
import { hasChanged, isObject } from '@zjt-mini-vue3/shared';
import { reactive } from './reactive';

class RefImpl {
  private _value: any;
  public dep;
  public __v_isRef = true;

  constructor(value: any) {
    this._value = isObject(value) ? reactive(value) : value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal: any) {
    if (hasChanged(newVal, this._value)) {
      this._value = newVal;
      triggerEffects(this.dep);
    }
  }
}

export function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}

export function isRef(ref) {
  return !!ref?.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    // * get: age (ref) -> return .value
    // * get: not ref -> return value
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    // * set ref -> .value
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return target[key].value = value;
      } else {
        return Reflect.set(target, key, value);
      }
    }
  });
}
