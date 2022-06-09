describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    // trigger
    let nextAge;
    // 依赖收集
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });
});
