describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    // 触发
    let nextAge;
    // 通过 effect 收集依赖
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // 更新
    user.age++;
    expect(nextAge).toBe(12);
  });
});
