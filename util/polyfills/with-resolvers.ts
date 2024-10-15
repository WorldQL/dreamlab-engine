Promise.withResolvers ??= function withResolvers<T>() {
  let resolve!: PromiseWithResolvers<T>["resolve"], reject!: PromiseWithResolvers<T>["reject"];
  const promise = new this<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
};
