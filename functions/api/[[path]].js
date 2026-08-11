export async function onRequest(context) {
  const worker = (await import("../../src/index.js")).default;
  return worker.fetch(context.request, context.env, context);
}
