import { toHandlerKey, camelize } from '@zjt-mini-vue3/shared';

export function emit(instance, event, ...args) {
  // instance.props -> event
  const { props } = instance;

  // TPP
  // 先实现特定场景下行为 -> 重构成通用
  // event add -> onAdd
  // add-foo -> addFoo

  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}
