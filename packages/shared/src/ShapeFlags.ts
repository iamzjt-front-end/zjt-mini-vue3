export const enum ShapeFlags {
  ELEMENT = 1, // 1 -> HTML 或 SVG 标签 普通 DOM 元素
  STATEFUL_COMPONENT = 1 << 1, // 10 -> 普通有状态组件
  TEXT_CHILDREN = 1 << 2, // 100 -> 子节点是纯文本
  ARRAY_CHILDREN = 1 << 3, // 1000 -> 子节点是数组
  SLOT_CHILDREN = 1 << 4, // 10000 -> 子节点是插槽
}
