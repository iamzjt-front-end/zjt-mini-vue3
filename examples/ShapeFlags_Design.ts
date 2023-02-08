const ShapeFlags = {
  ELEMENT: 0,
  STATEFUL_COMPONENT: 0,
  TEXT_CHILDREN: 0,
  ARRAY_CHILDREN: 0
};

// vnode -> stateful_component
// 1. 可以设置值
// ShapeFlags.STATEFUL_COMPONENT = 1;
// ShapeFlags.ARRAY_CHILDREN = 1;

// 2. 可以查询并判断
// if (ShapeFlags.STATEFUL_COMPONENT)
// if (ShapeFlags.ARRAY_CHILDREN)

// 不够高效 -> 位运算处理
// 0000
// 0001 -> ELEMENT
// 0010 -> STATEFUL_COMPONENT
// 0100 -> TEXT_CHILDREN
// 1000 -> ARRAY_CHILDREN

// 修改:
// 0001    0010    1000
// 0010    0111    0111
// ----    ----    ----
// 0011    0111    1111

// 查找:
// 0001    0011    0010
// 0010    0011    1010
// ----    ----    ----
// 0000    0011    0010
