import { hasOwn } from '../shared';

const publicPropertiesMap = {
  $el: i => i.vnode.el,
  $slots: i => i.slots
};

export const PublicInstanceHandlers = {
  get({ _: instance }, key) {
    // setupState: setup return出来的
    const { setupState, props } = instance;

    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  }
};
