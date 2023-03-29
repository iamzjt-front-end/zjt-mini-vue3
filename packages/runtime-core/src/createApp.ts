import { createVNode } from './vnode';

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 先转换成 vNode
        // 所有的逻辑操作都会给予 vNode 做处理
        // 首先 rootComponent -> vNode
        const vnode = createVNode(rootComponent);

        render(vnode, rootContainer);
      }
    };
  }
}
