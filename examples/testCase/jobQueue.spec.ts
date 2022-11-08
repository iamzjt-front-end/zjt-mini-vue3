import { reactive } from '../../src/reactivity/reactive';
import { effect } from '../../src/reactivity/effect';

it('job queue', () => {
  // 定义一个任务队列
  const jobQueue = new Set();
  // 使用 Promise.resolve() 创建一个 Promise 实例，我们用它将一个任务添加到微任务队列
  const p = Promise.resolve();

  // 一个标志代表是否正在刷新队列
  let isFlushing = false;

  function flushJob() {
    // 如果队列正在刷新，则什么都不做
    if (isFlushing) return;
    // 设置为true，代表正在刷新
    isFlushing = true;
    // 在微任务队列中刷新 jobQueue 队列
    p.then(() => {
      jobQueue.forEach((job: any) => job());
    }).finally(() => {
      // 结束后重置 isFlushing
      isFlushing = false;
      // 虽然scheduler执行两次，但是由于是Set，所以只有一项
      expect(jobQueue.size).toBe(1);
      // 期望最终结果拿数组存储后进行断言
      expect(logArr).toEqual([1, 3]);
    });
  }

  const obj = reactive({ foo: 1 });
  let logArr: number[] = [];

  effect(
    () => {
      logArr.push(obj.foo);
    },
    {
      scheduler(fn) {
        // 每次调度时，将副作用函数添加到 jobQueue 队列中
        jobQueue.add(fn);
        // 调用 flushJob 刷新队列
        flushJob();
      },
    },
  );

  obj.foo++;
  obj.foo++;

  expect(obj.foo).toBe(3);
});