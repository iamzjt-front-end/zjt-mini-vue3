export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {}
  };

  return component;
}

export function setupComponent(instance) {
  // todo
  // initProps();
  // initSlots();

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  instance.proxy = new Proxy({}, {
    get(target, key) {
      // setupState: setup return出来的
      const { setupState, vnode } = instance;
      if (key in setupState) {
        return setupState[key];
      }

      debugger
      // $el
      if (key === '$el') {
        return vnode.el;
      }
    }
  });

  const { setup } = Component;

  if (setup) {
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  // function object
  // todo function

  if (typeof setupResult === 'object') {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;

  instance.render = Component.render;
}
