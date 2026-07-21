"use client";

import { memo, useEffect, useRef } from "react";

import "./DotField.css";

const TWO_PI = Math.PI * 2;

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
}

const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)",
  glowColor = "#120F17",
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Array<{ ax: number; ay: number; sx: number; sy: number; vx: number; vy: number }>>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const propsRef = useRef({ dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo });
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const rebuildRef = useRef<(() => void) | null>(null);
  const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);

  propsRef.current = { dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo };

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowElement = glowRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrame = 0;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let glowOpacity = 0;
    let engagement = 0;
    let frameCount = 0;

    const buildDots = (width: number, height: number) => {
      const { dotRadius: radius, dotSpacing: spacing } = propsRef.current;
      const step = radius + spacing;
      const columns = Math.floor(width / step);
      const rows = Math.floor(height / step);
      const padX = (width % step) / 2;
      const padY = (height % step) / 2;
      const dots = new Array(rows * columns);
      let index = 0;

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const ax = padX + column * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[index] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0 };
          index += 1;
        }
      }
      dotsRef.current = dots;
    };

    const resize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        sizeRef.current = { w: rect.width, h: rect.height, offsetX: rect.left, offsetY: rect.top };
        buildDots(rect.width, rect.height);
      }, 100);
    };

    const onMouseMove = (event: MouseEvent) => {
      const size = sizeRef.current;
      mouseRef.current.x = event.clientX - size.offsetX;
      mouseRef.current.y = event.clientY - size.offsetY;
    };

    const updateMouseSpeed = () => {
      const mouse = mouseRef.current;
      const distance = Math.hypot(mouse.prevX - mouse.x, mouse.prevY - mouse.y);
      mouse.speed += (distance - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) mouse.speed = 0;
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    };

    const tick = () => {
      frameCount += 1;
      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const { w, h } = sizeRef.current;
      const settings = propsRef.current;
      const targetEngagement = Math.min(mouse.speed / 5, 1);
      engagement += (targetEngagement - engagement) * 0.06;
      if (engagement < 0.001) engagement = 0;
      glowOpacity += (engagement - glowOpacity) * 0.08;

      if (glowElement) {
        glowElement.setAttribute("cx", String(mouse.x));
        glowElement.setAttribute("cy", String(mouse.y));
        glowElement.style.opacity = String(glowOpacity);
      }

      context.clearRect(0, 0, w, h);
      const gradient = context.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, settings.gradientFrom);
      gradient.addColorStop(1, settings.gradientTo);
      context.fillStyle = gradient;
      context.beginPath();

      const cursorRadiusSquared = settings.cursorRadius * settings.cursorRadius;
      const radius = settings.dotRadius / 2;
      const time = frameCount * 0.02;

      dots.forEach((dot, index) => {
        const dx = mouse.x - dot.ax;
        const dy = mouse.y - dot.ay;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < cursorRadiusSquared && engagement > 0.01) {
          const distance = Math.sqrt(distanceSquared) || 1;
          const angle = Math.atan2(dy, dx);
          if (settings.bulgeOnly) {
            const strength = (1 - distance / settings.cursorRadius) ** 2 * settings.bulgeStrength * engagement;
            dot.sx += (dot.ax - Math.cos(angle) * strength - dot.sx) * 0.15;
            dot.sy += (dot.ay - Math.sin(angle) * strength - dot.sy) * 0.15;
          } else {
            const movement = (500 / distance) * (mouse.speed * settings.cursorForce);
            dot.vx += Math.cos(angle) * -movement;
            dot.vy += Math.sin(angle) * -movement;
          }
        } else if (settings.bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1;
          dot.sy += (dot.ay - dot.sy) * 0.1;
        }

        if (!settings.bulgeOnly) {
          dot.vx *= 0.9;
          dot.vy *= 0.9;
          dot.sx += (dot.ax + dot.vx - dot.sx) * 0.1;
          dot.sy += (dot.ay + dot.vy - dot.sy) * 0.1;
        }

        let drawX = dot.sx;
        let drawY = dot.sy;
        if (settings.waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + time) * settings.waveAmplitude;
          drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * settings.waveAmplitude * 0.5;
        }

        const sparkleRadius = settings.sparkle && (((index * 2654435761) ^ (frameCount >> 3)) >>> 0) % 100 < 3 ? radius * 1.8 : radius;
        context.moveTo(drawX + sparkleRadius, drawY);
        context.arc(drawX, drawY, sparkleRadius, 0, TWO_PI);
      });

      context.fill();
      animationFrame = requestAnimationFrame(tick);
    };

    resize();
    const speedInterval = window.setInterval(updateMouseSpeed, 20);
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    animationFrame = requestAnimationFrame(tick);
    rebuildRef.current = () => buildDots(sizeRef.current.w, sizeRef.current.h);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearInterval(speedInterval);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  return (
    <div className="dot-field-container">
      <canvas ref={canvasRef} />
      <svg aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={glowIdRef.current}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle ref={glowRef} cx="-9999" cy="-9999" r={glowRadius} fill={`url(#${glowIdRef.current})`} />
      </svg>
    </div>
  );
});

export default DotField;
