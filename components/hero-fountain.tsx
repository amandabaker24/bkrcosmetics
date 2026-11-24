"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";

import { FountainWater } from "./fountain-water";

function FountainDrop({ progress, delay = 0 }: { progress: MotionValue<number>; delay?: number }) {
  const phase = useTransform(progress, value => value === 0 || value === 1 ? 0 : (value * 5 + 1 - delay) % 1);
  const y = useTransform(phase, value => `${100 * value ** 1.45}%`);
  const opacity = useTransform(() => {
    const position = phase.get();
    if (progress.get() === 0 || progress.get() === 1) return 0;
    return Math.min(1, position * 10, (1 - position) * 10);
  });

  return <motion.span className="fountain-drop-path" style={{ y, opacity }}>
    <span className={delay ? "fountain-drop fountain-drop-small" : "fountain-drop"} />
  </motion.span>;
}

export function HeroFountain({ children }: { children: ReactNode }) {
  const sequence = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const artwork = useRef<HTMLImageElement>(null);
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const waterHeight = useTransform(progress, [0, .16, 1], ["0%", "0%", "87%"]);
  const waterOpacity = useTransform(progress, [.16, .24], [0, 1]);

  useEffect(() => {
    const track = sequence.current;
    const panel = hero.current;
    if (!track || !panel || reduceMotion) return;

    let frame = 0;
    let pinTop = 0;
    let travel = 1;
    let lastFrame = 0;
    const mobile = window.matchMedia("(max-width: 760px)");
    track.dataset.pinned = "";

    const draw = (now: number) => {
      frame = 0;
      const position = (pinTop - track.getBoundingClientRect().top) / travel;
      if (!mobile.matches || position <= 0 || position >= 1) {
        progress.set(Math.max(0, Math.min(1, position)));
        lastFrame = 0;
        return;
      }

      // Give the water time to settle before the sticky panel reaches its release point.
      const target = Math.min(1, position / .92);
      const elapsed = lastFrame ? Math.min(now - lastFrame, 32) : 16;
      const value = progress.get() + (target - progress.get()) * (1 - Math.exp(-elapsed / 45));
      const settled = Math.abs(target - value) < .001;
      progress.set(settled ? target : value);
      lastFrame = settled ? 0 : now;
      if (!settled) schedule();
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };

    const measure = () => {
      const height = panel.getBoundingClientRect().height;
      // Tall layouts pin once the bottom of the artwork is in view.
      panel.style.setProperty("--fountain-panel-height", `${height}px`);
      pinTop = Number.parseFloat(window.getComputedStyle(panel).top) || 0;
      travel = Math.max(1, track.getBoundingClientRect().height - height);
      schedule();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      delete track.dataset.pinned;
      panel.style.removeProperty("--fountain-panel-height");
    };
  }, [progress, reduceMotion]);

  return <div className="hero-sequence" ref={sequence}>
    <section className="hero" ref={hero}>
      {children}
      <div className="hero-image">
        <div className="fountain-scene">
          <Image
            ref={artwork}
            src="/images/fountain-vial.webp"
            sizes="(max-width: 760px) 100vw, 50vw"
            alt="An open glass vial stands beneath a fountain spout in a copper-lit burgundy alcove."
            fill
            preload
          />
          <div className="fountain-motion" aria-hidden="true">
            <FountainWater artwork={artwork} />
            <div className="fountain-drip-track">
              <FountainDrop progress={progress} />
              <FountainDrop progress={progress} delay={.14} />
            </div>
            <div className="fountain-vial">
              <motion.div className="fountain-vial-water" style={{ height: waterHeight, opacity: waterOpacity }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>;
}
