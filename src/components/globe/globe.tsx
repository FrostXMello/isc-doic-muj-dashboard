"use client";

import { hub, partners } from "@/lib/data";
import {
  LAND_COUNT,
  LAND_VECS,
  latLonToVec,
  projectVec,
  rotationForLongitude,
  shortestAngle,
  slerpLift,
  type Vec3,
} from "@/lib/globe-geometry";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Node = {
  id: string;
  city: string;
  country: string;
  vec: Vec3;
  lon: number;
};

const NODES: Node[] = [
  {
    id: hub.id,
    city: hub.city,
    country: hub.country,
    vec: latLonToVec(hub.lat, hub.lon),
    lon: hub.lon,
  },
  ...partners.map((partner) => ({
    id: partner.id,
    city: partner.city,
    country: partner.country,
    vec: latLonToVec(partner.lat, partner.lon),
    lon: partner.lon,
  })),
];

const HUB = NODES[0];
const PARTNER_NODES = NODES.slice(1);

const ARC_SAMPLES = 42;
const ARCS = PARTNER_NODES.map((node) => {
  const points: Vec3[] = [];
  for (let i = 0; i <= ARC_SAMPLES; i += 1) {
    points.push(slerpLift(HUB.vec, node.vec, i / ARC_SAMPLES));
  }
  return { id: node.id, points };
});

type Particle = { lat: number; lon: number; speed: number; size: number };

const PARTICLES: Particle[] = Array.from({ length: 26 }, (_, index) => {
  const a = Math.sin(index * 12.9898) * 43758.5453;
  const b = Math.sin(index * 78.233) * 24634.6345;
  const c = Math.sin(index * 39.425) * 12873.1;
  const frac = (value: number) => value - Math.floor(value);
  return {
    lat: (frac(a) - 0.5) * 150,
    lon: frac(b) * 360 - 180,
    speed: 4 + frac(c) * 10,
    size: 0.7 + frac(a + b) * 1.1,
  };
});

const BUCKETS = 8;

type Projected = {
  id: string;
  x: number;
  y: number;
  z: number;
  city: string;
  country: string;
};

const INITIAL_ROTATION = rotationForLongitude(hub.lon);

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLParagraphElement>(null);
  const countryRef = useRef<HTMLParagraphElement>(null);
  const rotationRef = useRef(INITIAL_ROTATION);
  const targetRef = useRef<number | null>(null);
  const activeRef = useRef<string | null>(null);
  const dragRef = useRef<{ x: number; rot: number } | null>(null);
  const radiusRef = useRef(180);
  const reduceRef = useRef(false);
  const paintRef = useRef<(() => void) | null>(null);
  const projectedRef = useRef<Projected[]>([]);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = activeId;
    const node = PARTNER_NODES.find((item) => item.id === activeId);
    if (cityRef.current && countryRef.current) {
      cityRef.current.textContent = node?.city ?? "";
      countryRef.current.textContent = node?.country ?? "";
    }
    if (reduceRef.current) paintRef.current?.();
  }, [activeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      reduceRef.current = media.matches;
      if (hintRef.current) {
        hintRef.current.textContent = media.matches
          ? "Still view. Select a city to bring its link to Jaipur forward."
          : "Drag to turn the globe. Hover a city to trace its link to Jaipur.";
      }
      if (media.matches) {
        rotationRef.current = INITIAL_ROTATION;
        targetRef.current = null;
      }
    };
    applyMotion();
    const onMedia = () => {
      applyMotion();
      paint();
    };
    media.addEventListener("change", onMedia);

    const bucketX = Array.from({ length: BUCKETS }, () => new Float32Array(LAND_COUNT));
    const bucketY = Array.from({ length: BUCKETS }, () => new Float32Array(LAND_COUNT));
    const bucketN = new Uint16Array(BUCKETS);
    let frame = 0;
    let running = true;
    let visible = true;
    let last = performance.now();
    let cssWidth = 1;
    let cssHeight = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      radiusRef.current = Math.min(cssWidth, cssHeight) * 0.44;
      paint();
    };

    const paint = () => {
      const width = cssWidth;
      const height = cssHeight;
      const cx = width / 2;
      const cy = height / 2 + height * 0.01;
      const radius = radiusRef.current;
      const rot = rotationRef.current;
      const now = performance.now();
      context.clearRect(0, 0, width, height);

      const atmosphere = context.createRadialGradient(
        cx,
        cy,
        radius * 0.86,
        cx,
        cy,
        radius * 1.28,
      );
      atmosphere.addColorStop(0, "rgba(126, 168, 214, 0)");
      atmosphere.addColorStop(0.72, "rgba(126, 168, 214, 0.05)");
      atmosphere.addColorStop(1, "rgba(126, 168, 214, 0)");
      context.fillStyle = atmosphere;
      context.beginPath();
      context.arc(cx, cy, radius * 1.28, 0, Math.PI * 2);
      context.fill();

      const sphere = context.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.38,
        radius * 0.15,
        cx,
        cy,
        radius,
      );
      sphere.addColorStop(0, "#1a2a44");
      sphere.addColorStop(0.45, "#10192c");
      sphere.addColorStop(1, "#070c16");
      context.fillStyle = sphere;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();

      drawGraticule(context, cx, cy, radius, rot);

      bucketN.fill(0);
      for (let i = 0; i < LAND_COUNT; i += 1) {
        const o = i * 3;
        const projected = projectVec(LAND_VECS[o], LAND_VECS[o + 1], LAND_VECS[o + 2], rot);
        if (projected.z < 0.04) continue;
        const bucket = Math.min(BUCKETS - 1, Math.floor(projected.z * BUCKETS));
        const n = bucketN[bucket];
        bucketX[bucket][n] = cx + projected.x * radius;
        bucketY[bucket][n] = cy - projected.y * radius;
        bucketN[bucket] = n + 1;
      }

      for (let bucket = 0; bucket < BUCKETS; bucket += 1) {
        const count = bucketN[bucket];
        if (!count) continue;
        const t = (bucket + 1) / BUCKETS;
        context.fillStyle = `rgba(${170 + Math.round(50 * t)}, ${196 + Math.round(36 * t)}, ${220 + Math.round(24 * t)}, ${0.22 + t * 0.62})`;
        const size = 1.05 + t * 1.15;
        for (let i = 0; i < count; i += 1) {
          context.fillRect(bucketX[bucket][i], bucketY[bucket][i], size, size);
        }
      }

      const active = activeRef.current;
      ARCS.forEach((arc, index) => {
        const emphasized = active === arc.id;
        drawArc(
          context,
          arc.points,
          cx,
          cy,
          radius,
          rot,
          emphasized,
          Boolean(active) && !emphasized,
          now,
          index,
          reduceRef.current,
        );
      });

      if (!reduceRef.current && !active) {
        for (const particle of PARTICLES) {
          const lon = particle.lon + now * 0.001 * particle.speed;
          const [x, y, z] = latLonToVec(particle.lat, lon);
          const projected = projectVec(x, y, z, rot);
          if (projected.z < 0.35) continue;
          context.fillStyle = `rgba(176, 198, 220, ${0.05 + projected.z * 0.12})`;
          context.fillRect(
            cx + projected.x * radius,
            cy - projected.y * radius,
            particle.size,
            particle.size,
          );
        }
      }

      const projectedNodes: Projected[] = [];
      for (const node of NODES) {
        const projected = projectVec(node.vec[0], node.vec[1], node.vec[2], rot);
        const point = {
          id: node.id,
          x: cx + projected.x * radius,
          y: cy - projected.y * radius,
          z: projected.z,
          city: node.city,
          country: node.country,
        };
        projectedNodes.push(point);
        if (projected.z < 0.02) continue;
        const isHub = node.id === hub.id;
        const emphasized = isHub || active === node.id;
        drawNode(context, point.x, point.y, emphasized, isHub, projected.z);
      }
      projectedRef.current = projectedNodes;

      const hubPoint = projectedNodes[0];
      if (hubPoint && hubPoint.z > 0.05) {
        context.font = "600 10px ui-sans-serif, system-ui, sans-serif";
        const labelWidth = Math.max(
          context.measureText("MUJ").width,
          context.measureText("Jaipur").width,
        );
        const pad = 9;
        const placeRight = hubPoint.x + pad + labelWidth < width - 6;
        context.textAlign = placeRight ? "left" : "right";
        const labelX = placeRight ? hubPoint.x + pad : hubPoint.x - pad;
        context.fillStyle = "rgba(232, 240, 248, 0.94)";
        context.fillText("MUJ", labelX, hubPoint.y - 1);
        context.font = "10px ui-sans-serif, system-ui, sans-serif";
        context.fillStyle = "rgba(168, 186, 208, 0.88)";
        context.fillText("Jaipur", labelX, hubPoint.y + 12);
      }

      const label = labelRef.current;
      const focus = projectedNodes.find((point) => point.id === active);
      if (label) {
        if (focus && focus.z > 0.02) {
          label.style.opacity = "1";
          label.style.transform = `translate(${focus.x}px, ${focus.y}px) translate(-50%, calc(-100% - 12px))`;
        } else {
          label.style.opacity = "0";
        }
      }

      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.strokeStyle = "rgba(186, 210, 236, 0.38)";
      context.lineWidth = 1.15;
      context.stroke();
    };

    paintRef.current = paint;

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!dragRef.current && visible) {
        const target = targetRef.current;
        if (target !== null) {
          const delta = shortestAngle(rotationRef.current, target);
          if (Math.abs(delta) < 0.004) rotationRef.current = target;
          else rotationRef.current += delta * Math.min(1, dt * 2.6);
        } else if (!reduceRef.current) {
          const speed = activeRef.current ? 0.035 : 0.085;
          rotationRef.current += speed * dt;
        }
      }
      paint();
      if (visible && (!reduceRef.current || targetRef.current !== null || dragRef.current)) {
        frame = requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (!visible) return;
        last = performance.now();
        cancelAnimationFrame(frame);
        if (reduceRef.current && targetRef.current === null) paint();
        else frame = requestAnimationFrame(tick);
      },
      { threshold: 0.08 },
    );
    io.observe(wrap);

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && visible) {
        last = performance.now();
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      media.removeEventListener("change", onMedia);
      document.removeEventListener("visibilitychange", onVisibility);
      paintRef.current = null;
    };
  }, []);

  const hitTest = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let best: string | null = null;
    let bestDist = 24;
    for (const point of projectedRef.current) {
      if (point.id === hub.id || point.z < 0.05) continue;
      const dist = Math.hypot(point.x - x, point.y - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = point.id;
      }
    }
    return best;
  };

  const focusPartner = (id: string | null, pin: boolean) => {
    setActiveId(id);
    if (!id) {
      if (pin) targetRef.current = null;
      return;
    }
    const node = PARTNER_NODES.find((item) => item.id === id);
    if (!node) return;
    if (pin || reduceRef.current) {
      targetRef.current = rotationForLongitude(node.lon);
      const canvas = canvasRef.current;
      if (canvas && (reduceRef.current || targetRef.current !== null)) {
        requestAnimationFrame(() => {
          const loop = () => {
            if (targetRef.current === null) return;
            const delta = shortestAngle(rotationRef.current, targetRef.current);
            if (Math.abs(delta) < 0.004) {
              rotationRef.current = targetRef.current;
              targetRef.current = reduceRef.current ? null : targetRef.current;
              paintRef.current?.();
              if (!reduceRef.current) return;
              return;
            }
            rotationRef.current += delta * 0.18;
            paintRef.current?.();
            requestAnimationFrame(loop);
          };
          if (reduceRef.current) loop();
        });
      }
    }
  };

  return (
    <div className="w-full">
      <p id="globe-desc" className="sr-only">
        Decorative globe centred on Manipal University Jaipur. Glowing points
        mark illustrative partner cities, with curved links back to Jaipur.
        Choose a city to highlight its connection. This is not a live map.
      </p>
      <div
        ref={wrapRef}
        className="relative mx-auto aspect-square w-full max-w-[20.5rem] sm:max-w-[26rem] lg:max-w-[34rem] xl:max-w-[38rem]"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="size-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = { x: event.clientX, rot: rotationRef.current };
            targetRef.current = null;
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (drag) {
              const dx = event.clientX - drag.x;
              rotationRef.current = drag.rot + dx / Math.max(80, radiusRef.current);
              if (reduceRef.current) paintRef.current?.();
              return;
            }
            const hit = hitTest(event);
            if (hit !== activeRef.current) setActiveId(hit);
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerLeave={() => {
            if (!dragRef.current) setActiveId(null);
          }}
        />
        <div
          ref={labelRef}
          className="pointer-events-none absolute top-0 left-0 z-10 opacity-0 transition-opacity duration-200"
        >
          <div className="rounded-md border border-white/15 bg-[#0b1220]/90 px-2.5 py-1.5 text-left shadow-none backdrop-blur-sm">
            <p
              ref={cityRef}
              className="text-[11px] tracking-[0.14em] text-cyan uppercase"
            />
            <p ref={countryRef} className="text-sm text-foreground" />
          </div>
        </div>
      </div>
      <p
        ref={hintRef}
        className="mt-1 text-center text-[12px] tracking-[0.04em] text-muted-foreground"
      >
        Drag to turn the globe. Hover a city to trace its link to Jaipur.
      </p>
      <ul
        aria-label="Illustrative partner cities"
        aria-describedby="globe-desc"
        className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap lg:justify-center lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {partners.map((partner) => {
          const selected = activeId === partner.id;
          return (
            <li key={partner.id}>
              <button
                type="button"
                aria-pressed={selected}
                onMouseEnter={() => focusPartner(partner.id, false)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => focusPartner(partner.id, true)}
                onBlur={() => {
                  setActiveId(null);
                  targetRef.current = null;
                }}
                className={cn(
                  "border px-2.5 py-1 text-[12px] tracking-[0.01em] transition-colors duration-200",
                  selected
                    ? "border-[#9ec9d4]/70 bg-white/10 text-foreground"
                    : "border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground",
                )}
              >
                {partner.city}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function drawGraticule(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
) {
  context.lineWidth = 1;
  context.strokeStyle = "rgba(168, 196, 226, 0.09)";
  for (let lon = -150; lon <= 180; lon += 30) {
    traceRing(context, cx, cy, radius, rot, (step) => {
      const lat = -80 + step * 160;
      return latLonToVec(lat, lon);
    }, 48);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    traceRing(context, cx, cy, radius, rot, (step) => {
      const lon = -180 + step * 360;
      return latLonToVec(lat, lon);
    }, 64);
  }
}

function traceRing(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  at: (t: number) => Vec3,
  steps: number,
) {
  let drawing = false;
  context.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const [x, y, z] = at(i / steps);
    const projected = projectVec(x, y, z, rot);
    if (projected.z <= 0.02) {
      drawing = false;
      continue;
    }
    const sx = cx + projected.x * radius;
    const sy = cy - projected.y * radius;
    if (!drawing) {
      context.moveTo(sx, sy);
      drawing = true;
    } else {
      context.lineTo(sx, sy);
    }
  }
  context.stroke();
}

function drawArc(
  context: CanvasRenderingContext2D,
  points: Vec3[],
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  emphasized: boolean,
  quiet: boolean,
  now: number,
  index: number,
  reduced: boolean,
) {
  context.beginPath();
  let drawing = false;
  const screen: { x: number; y: number; z: number }[] = [];
  for (const point of points) {
    const projected = projectVec(point[0], point[1], point[2], rot);
    screen.push({
      x: cx + projected.x * radius,
      y: cy - projected.y * radius,
      z: projected.z,
    });
    if (projected.z <= 0.01) {
      drawing = false;
      continue;
    }
    if (!drawing) {
      context.moveTo(cx + projected.x * radius, cy - projected.y * radius);
      drawing = true;
    } else {
      context.lineTo(cx + projected.x * radius, cy - projected.y * radius);
    }
  }
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = emphasized
    ? "rgba(214, 228, 244, 0.9)"
    : quiet
      ? "rgba(142, 176, 204, 0.07)"
      : "rgba(150, 186, 214, 0.2)";
  context.lineWidth = emphasized ? 1.35 : 0.85;
  context.stroke();

  if (reduced || quiet || !emphasized) return;
  const t = (now * 0.00007 + index * 0.137) % 1;
  const pulseIndex = Math.min(screen.length - 1, Math.floor(t * (screen.length - 1)));
  const pulse = screen[pulseIndex];
  if (!pulse || pulse.z < 0.05) return;
  context.fillStyle = emphasized
    ? "rgba(232, 240, 252, 0.95)"
    : "rgba(186, 220, 232, 0.8)";
  context.beginPath();
  context.arc(pulse.x, pulse.y, emphasized ? 2.4 : 1.7, 0, Math.PI * 2);
  context.fill();
}

function drawNode(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  emphasized: boolean,
  isHub: boolean,
  depth: number,
) {
  const scale = 0.82 + depth * 0.22;
  if (isHub) {
    context.beginPath();
    context.arc(x, y, 6.2 * scale, 0, Math.PI * 2);
    context.strokeStyle = "rgba(198, 228, 234, 0.82)";
    context.lineWidth = 1;
    context.stroke();
    context.beginPath();
    context.arc(x, y, 3.4 * scale, 0, Math.PI * 2);
    context.strokeStyle = "rgba(198, 228, 234, 0.35)";
    context.stroke();
    context.beginPath();
    context.arc(x, y, 1.7 * scale, 0, Math.PI * 2);
    context.fillStyle = "#f3fafb";
    context.fill();
    return;
  }
  if (emphasized) {
    context.beginPath();
    context.arc(x, y, 6.2 * scale, 0, Math.PI * 2);
    context.strokeStyle = "rgba(215, 228, 244, 0.7)";
    context.lineWidth = 1;
    context.stroke();
  }
  context.beginPath();
  context.arc(x, y, (emphasized ? 2.5 : 1.9) * scale, 0, Math.PI * 2);
  context.fillStyle = emphasized ? "#f4f7fb" : "rgba(198, 214, 232, 0.9)";
  context.fill();
}
