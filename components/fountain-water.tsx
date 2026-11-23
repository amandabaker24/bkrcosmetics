"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { createFountainWater, fountainWaterCrop, fountainWaterSettings, type FountainWaterSettings } from "@/lib/fountain-water";

export function FountainWater({
  artwork,
  settings = fountainWaterSettings,
}: {
  artwork: RefObject<HTMLImageElement | null>;
  settings?: FountainWaterSettings;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const surface = canvas.current;
    const image = artwork.current;
    if (!surface || !image || reduceMotion) return;

    const gl = surface.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: "low-power",
    });
    if (!gl) return;

    let renderer = createFountainWater(gl, settings);
    if (!renderer) return;

    let frame = 0;
    let elapsed = 0;
    let lastTime: number | undefined;
    let uploadedSource = "";
    let visible = false;

    const stop = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = undefined;
    };

    const draw = (timestamp: number) => {
      frame = 0;
      if (!renderer || !uploadedSource || !visible) return;
      if (lastTime !== undefined) elapsed += (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      renderer.draw(elapsed);
      if (!surface.hasAttribute("data-rendering")) surface.dataset.rendering = "";
      frame = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (visible && uploadedSource && renderer && !frame) frame = window.requestAnimationFrame(draw);
    };

    const measure = () => {
      const { width, height } = surface.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 1.5, 960 / Math.max(1, width));
      surface.width = Math.max(1, Math.round(width * scale));
      surface.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, surface.width, surface.height);
      start();
    };

    const upload = () => {
      if (!renderer || !image.complete || !image.naturalWidth || image.currentSrc === uploadedSource) return;
      try {
        uploadedSource = renderer.upload(image) ? image.currentSrc : "";
      } catch {
        uploadedSource = "";
      }
      if (!uploadedSource) {
        delete surface.dataset.rendering;
        stop();
      }
      start();
    };

    const lose = (event: Event) => {
      event.preventDefault();
      stop();
      uploadedSource = "";
      renderer = null;
      delete surface.dataset.rendering;
    };

    const restore = () => {
      renderer = createFountainWater(gl, settings);
      measure();
      upload();
    };

    const size = new ResizeObserver(measure);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    size.observe(surface);
    intersection.observe(surface);
    image.addEventListener("load", upload);
    surface.addEventListener("webglcontextlost", lose);
    surface.addEventListener("webglcontextrestored", restore);
    measure();
    upload();

    return () => {
      stop();
      size.disconnect();
      intersection.disconnect();
      image.removeEventListener("load", upload);
      surface.removeEventListener("webglcontextlost", lose);
      surface.removeEventListener("webglcontextrestored", restore);
      renderer?.dispose();
      delete surface.dataset.rendering;
    };
  }, [artwork, reduceMotion, settings]);

  const { left, top, width, height } = fountainWaterCrop;

  return <canvas
    ref={canvas}
    className="fountain-basin"
    style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${width * 100}%`, height: `${height * 100}%` }}
  />;
}
