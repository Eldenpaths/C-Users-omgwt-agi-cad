// frontend/src/lib/renderer/initWebGPU.ts
// Phase 8B: Minimal WebGPU bootstrap (clear-screen + render loop)

export type WebGPUInitResult = {
  canvas: HTMLCanvasElement;
  context: GPUCanvasContext;
  device: GPUDevice;
  format: GPUTextureFormat;
  pipeline: GPURenderPipeline;
  frame: () => void;
};

const WGSL = /* wgsl */`
@vertex
fn vmain(@builtin(vertex_index) vidx:u32) -> @builtin(position) vec4f {
  // Fullscreen triangle
  var pos = array<vec2f,3>(
    vec2f(-1.0,-1.0),
    vec2f( 3.0,-1.0),
    vec2f(-1.0, 3.0)
  );
  return vec4f(pos[vidx], 0.0, 1.0);
}

@fragment
fn fmain() -> @location(0) vec4f {
  // Soft gold default (Parchment vibe). Theme can tint via CSS filter.
  return vec4f(0.96, 0.78, 0.45, 1.0);
}
`;

export async function initWebGPU(canvas: HTMLCanvasElement): Promise<WebGPUInitResult> {
  if (!('gpu' in navigator)) {
    throw new Error('WEBGPU_UNSUPPORTED');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('NO_GPU_ADAPTER');
  const device = await adapter.requestDevice();

  const context = canvas.getContext('webgpu') as unknown as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'premultiplied' });

  const module = device.createShaderModule({ code: WGSL });

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vmain' },
    fragment: { module, entryPoint: 'fmain', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });

  const frame = () => {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        // background clear slightly darker than fragment for subtle rim
        clearValue: { r: 0.06, g: 0.05, b: 0.03, a: 1 },
        storeOp: 'store',
      }],
    });

    pass.setPipeline(pipeline);
    pass.draw(3, 1, 0, 0);
    pass.end();

    device.queue.submit([encoder.finish()]);
  };

  return { canvas, context, device, format, pipeline, frame };
}
