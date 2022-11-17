class RefImpl {
  private _value: any;

  constructor(value: any) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  set value(newVal: any) {
    this._value = newVal;
  }
}

export function ref(value) {
  return new RefImpl(value);
}