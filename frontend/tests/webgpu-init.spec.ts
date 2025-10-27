// frontend/tests/webgpu-init.spec.ts
// This stub just asserts the environment exposes navigator.gpu (or we skip).
describe('WebGPU presence', () => {
  it('exposes navigator.gpu or skips', () => {
    if (typeof navigator === 'undefined') return; // ignore in node
    expect('gpu' in navigator).toBe(true);
  });
});
