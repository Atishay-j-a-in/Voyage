import * as THREE from "three/webgpu";
import type { CreateRendererOptions } from "./createRenderer.types";

export interface CreateWebGPURendererResult {
  renderer: THREE.WebGPURenderer;
  initPromise: Promise<void>;
}

export function createWebGPURenderer(
  canvas: HTMLCanvasElement,
  opts: CreateRendererOptions = {},
): CreateWebGPURendererResult {
  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  return {
    renderer,
    initPromise: renderer.init().then(() => {
      const dpr = Math.min(
        typeof window !== "undefined" ? window.devicePixelRatio : 1,
        opts.maxPixelRatio ?? 2,
      );
      renderer.setPixelRatio(dpr);
    }),
  };
}

interface NavigatorWithGPU extends Navigator {
  gpu?: {
    requestAdapter(): Promise<unknown>;
  };
}

/** Detects whether the browser supports a WebGPU adapter. */
export async function hasWebGPU(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorWithGPU;
  if (!nav.gpu) return false;
  try {
    const adapter = await nav.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}
