import { extend } from '../shared';

let activeEffect;
let shouldTrack = false;

export class ReactiveEffect {
  private _fn: any;
  deps: any[] = [];
  active = true; // 是否已经 stop 过，true 为 未stop
  onStop?: () => void;

  // 在构造函数的参数上使用public等同于创建了同名的成员变量
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    // 已经被stop，那就直接返回结果
    if (!this.active) {
      return this._fn();
    }
    // 未stop，继续往下走
    // 此时应该被收集依赖，可以给activeEffect赋值，去运行原始依赖
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    // 由于运行原始依赖的时候，会触发代理对象的get操作，会重复进行依赖收集，所以调用完以后就关上开关，不允许再次收集依赖
    shouldTrack = false;

    return result;
  }

  stop() {
    // 要从收集到当前依赖的dep中删除当前依赖activeEffect
    // 但是我们根本不知道activeEffect存在于哪些dep中，所以就要用activeEffect反向收集dep
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}


// * ============================== ↓ 依赖收集 track ↓ ============================== * //
// * targetMap: target -> key
const targetMap = new WeakMap();

// * target -> key -> dep
export function track(target, key) {
  if (!isTracking()) return;

  // * depsMap: key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // * dep
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  trackEffects(dep);
}

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}


// * ============================== ↓ 触发依赖 trigger ↓ ============================== * //
export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      // ps: effect._fn 为了让scheduler能拿到原始依赖
      effect.scheduler(effect._fn);
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}