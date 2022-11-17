import { trackEffects, triggerEffects, isTracking } from './effect';
import { hasChanged, isObject } from '../shared';
import { reactive } from './reactive';

class RefImpl {
  private _value: any;
  public dep;

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