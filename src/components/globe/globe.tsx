"use client";

import { hub } from "@/lib/data";
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
import type { GlobeMarker } from "@/lib/official/geo";
import { readPaintedTheme, useResolvedTheme, type ResolvedTheme } from "@/lib/theme-store";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Node = {
  id: string;
  marker: GlobeMarker | null;
  vec: Vec3;
  lon: number;
  /** Dot scale from the number of institutions the node stands for. */
  weight: number;
};

const ARC_SAMPLES = 42;
/** Arcs shown together while idle; the groups take turns. */
const ARC_GROUP_SIZE = 6;
const ARC_GROUP_MS = 5200;

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export function markerTitle(marker: GlobeMarker) {
  return marker.precision === "city" ? marker.name : marker.country;
}

export function markerSummary(marker: GlobeMarker) {
  if (marker.precision === "city") {
    return `${marker.city}, ${marker.country} · ${plural(marker.agreementRows, "agreement record", "agreement records")}`;
  }
  return `${plural(marker.institutions, "institution", "institutions")} · ${plural(marker.agreementRows, "agreement record", "agreement records")}`;
}

function markerDescription(marker: GlobeMarker) {
  const placement =
    marker.precision === "city" ? "City-level placement" : "Country-level placement, not a campus location";
  const also =
    marker.precision === "country" && marker.alsoListedUnder.length
      ? `; also listed under ${marker.alsoListedUnder.join(", ")}`
      : "";
  return `${markerTitle(marker)}, ${marker.region}${also}: ${markerSummary(marker)}. ${placement}. Official MUJ source.`;
}

function buildScene(markers: readonly GlobeMarker[]) {
  const hubNode: Node = {
    id: hub.id,
    marker: null,
    vec: latLonToVec(hub.lat, hub.lon),
    lon: hub.lon,
    weight: 1,
  };
  const partnerNodes: Node[] = markers.map((marker) => ({
    id: marker.id,
    marker,
    vec: latLonToVec(marker.lat, marker.lon),
    lon: marker.lon,
    weight:
      marker.precision === "country"
        ? 1 + Math.min(0.7, Math.log2(marker.institutions) * 0.18)
        : 1,
  }));
  const groups = Math.max(1, Math.ceil(partnerNodes.length / ARC_GROUP_SIZE));
  const arcs = partnerNodes.map((node, index) => {
    const arcPoints: Vec3[] = [];
    for (let i = 0; i <= ARC_SAMPLES; i += 1) {
      arcPoints.push(slerpLift(hubNode.vec, node.vec, i / ARC_SAMPLES));
    }
    // Interleaved so each group spans several regions.
    return { id: node.id, points: arcPoints, group: index % groups };
  });
  return { nodes: [hubNode, ...partnerNodes], partnerNodes, arcs, groups };
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

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
};

const INITIAL_ROTATION = rotationForLongitude(hub.lon);

type Palette = {
  atmosphere: [string, string, string];
  sphere: [string, string, string];
  land: (t: number) => string;
  particle: (depth: number) => string;
  graticule: string;
  rim: string;
  hubLabel: string;
  hubSubLabel: string;
  arc: { emphasized: string; quiet: string; idle: string };
  pulse: { emphasized: string; idle: string };
  hub: { ring: string; inner: string; core: string };
  node: { ring: string; emphasized: string; idle: string };
};

const PALETTES: Record<ResolvedTheme, Palette> = {
  dark: {
    atmosphere: ["rgba(126, 168, 214, 0)", "rgba(126, 168, 214, 0.05)", "rgba(126, 168, 214, 0)"],
    sphere: ["#1a2a44", "#10192c", "#070c16"],
    land: (t) =>
      `rgba(${170 + Math.round(50 * t)}, ${196 + Math.round(36 * t)}, ${220 + Math.round(24 * t)}, ${0.22 + t * 0.62})`,
    particle: (depth) => `rgba(176, 198, 220, ${0.05 + depth * 0.12})`,
    graticule: "rgba(168, 196, 226, 0.09)",
    rim: "rgba(186, 210, 236, 0.38)",
    hubLabel: "rgba(232, 240, 248, 0.94)",
    hubSubLabel: "rgba(168, 186, 208, 0.88)",
    arc: {
      emphasized: "rgba(214, 228, 244, 0.9)",
      quiet: "rgba(142, 176, 204, 0.07)",
      idle: "rgba(150, 186, 214, 0.2)",
    },
    pulse: { emphasized: "rgba(232, 240, 252, 0.95)", idle: "rgba(186, 220, 232, 0.8)" },
    hub: { ring: "rgba(198, 228, 234, 0.82)", inner: "rgba(198, 228, 234, 0.35)", core: "#f3fafb" },
    node: { ring: "rgba(215, 228, 244, 0.7)", emphasized: "#f4f7fb", idle: "rgba(198, 214, 232, 0.9)" },
  },
  light: {
    // Fades out before the canvas edge; a mid-ring peak shows as a clipped square on paper.
    atmosphere: ["rgba(45, 95, 158, 0.07)", "rgba(45, 95, 158, 0)", "rgba(45, 95, 158, 0)"],
    sphere: ["#ffffff", "#eef2f7", "#dde5ef"],
    land: (t) =>
      `rgba(${64 - Math.round(36 * t)}, ${96 - Math.round(44 * t)}, ${142 - Math.round(38 * t)}, ${0.28 + t * 0.6})`,
    particle: (depth) => `rgba(45, 80, 130, ${0.05 + depth * 0.12})`,
    graticule: "rgba(28, 53, 94, 0.09)",
    rim: "rgba(28, 53, 94, 0.3)",
    hubLabel: "rgba(13, 21, 38, 0.94)",
    hubSubLabel: "rgba(69, 83, 107, 0.92)",
    arc: {
      emphasized: "rgba(28, 53, 94, 0.9)",
      quiet: "rgba(45, 95, 158, 0.08)",
      idle: "rgba(45, 95, 158, 0.3)",
    },
    pulse: { emphasized: "rgba(13, 21, 38, 0.95)", idle: "rgba(29, 103, 118, 0.8)" },
    hub: { ring: "rgba(29, 103, 118, 0.85)", inner: "rgba(29, 103, 118, 0.35)", core: "#1d6776" },
    node: { ring: "rgba(28, 53, 94, 0.65)", emphasized: "#1c355e", idle: "rgba(38, 66, 110, 0.85)" },
  },
};

export function Globe({
  markers,
  chipIds,
}: {
  /** Derived from the official data layer (src/lib/official/geo). */
  markers: readonly GlobeMarker[];
  /** Markers offered as buttons under the globe; every marker stays selectable on the canvas. */
  chipIds: readonly string[];
}) {
  const [scene] = useState(() => buildScene(markers));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(INITIAL_ROTATION);
  const targetRef = useRef<number | null>(null);
  const activeRef = useRef<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; rot: number; moved: boolean } | null>(null);
  const radiusRef = useRef(180);
  const reduceRef = useRef(false);
  const paintRef = useRef<(() => void) | null>(null);
  const projectedRef = useRef<Projected[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const theme = useResolvedTheme();
  const reduced = useReducedMotion();
  const activeMarker = scene.partnerNodes.find((node) => node.id === activeId)?.marker ?? null;

  useEffect(() => {
    paintRef.current?.();
  }, [theme]);

  useEffect(() => {
    activeRef.current = activeId;
    if (reduceRef.current) paintRef.current?.();
  }, [activeId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const media = window.matchMedia(reducedMotionQuery);
    const applyMotion = () => {
      reduceRef.current = media.matches;
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
      const palette = PALETTES[readPaintedTheme()];
      context.clearRect(0, 0, width, height);

      const atmosphere = context.createRadialGradient(
        cx,
        cy,
        radius * 0.86,
        cx,
        cy,
        radius * 1.28,
      );
      atmosphere.addColorStop(0, palette.atmosphere[0]);
      atmosphere.addColorStop(0.72, palette.atmosphere[1]);
      atmosphere.addColorStop(1, palette.atmosphere[2]);
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
      sphere.addColorStop(0, palette.sphere[0]);
      sphere.addColorStop(0.45, palette.sphere[1]);
      sphere.addColorStop(1, palette.sphere[2]);
      context.fillStyle = sphere;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();

      drawGraticule(context, cx, cy, radius, rot, palette);

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
        context.fillStyle = palette.land(t);
        const size = 1.05 + t * 1.15;
        for (let i = 0; i < count; i += 1) {
          context.fillRect(bucketX[bucket][i], bucketY[bucket][i], size, size);
        }
      }

      const active = activeRef.current;
      const reduce = reduceRef.current;
      const cycle = now / ARC_GROUP_MS + 0.2;
      const currentGroup = Math.floor(cycle) % scene.groups;
      const phase = cycle - Math.floor(cycle);
      const fade = Math.min(1, phase / 0.16, (1 - phase) / 0.16);
      scene.arcs.forEach((arc) => {
        const emphasized = active === arc.id;
        let style: ArcStyle;
        if (emphasized) style = { kind: "emphasized", alpha: 1, pulse: reduce ? null : (now * 0.00007) % 1 };
        else if (active) style = { kind: "quiet", alpha: 1, pulse: null };
        else if (reduce) style = { kind: "idle", alpha: 1, pulse: null };
        else style = { kind: "idle", alpha: 0.45, pulse: null };
        drawArc(context, arc.points, cx, cy, radius, rot, style, palette);
        if (!active && !reduce && arc.group === currentGroup && fade > 0.01) {
          drawArc(context, arc.points, cx, cy, radius, rot, { kind: "idle", alpha: fade, pulse: phase }, palette);
        }
      });

      if (!reduceRef.current && !active) {
        for (const particle of PARTICLES) {
          const lon = particle.lon + now * 0.001 * particle.speed;
          const [x, y, z] = latLonToVec(particle.lat, lon);
          const projected = projectVec(x, y, z, rot);
          if (projected.z < 0.35) continue;
          context.fillStyle = palette.particle(projected.z);
          context.fillRect(
            cx + projected.x * radius,
            cy - projected.y * radius,
            particle.size,
            particle.size,
          );
        }
      }

      const projectedNodes: Projected[] = [];
      for (const node of scene.nodes) {
        const projected = projectVec(node.vec[0], node.vec[1], node.vec[2], rot);
        const point = {
          id: node.id,
          x: cx + projected.x * radius,
          y: cy - projected.y * radius,
          z: projected.z,
        };
        projectedNodes.push(point);
        if (projected.z < 0.02) continue;
        const isHub = node.id === hub.id;
        const emphasized = isHub || active === node.id;
        drawNode(
          context,
          point.x,
          point.y,
          emphasized,
          isHub,
          node.marker?.precision === "city",
          projected.z,
          node.weight,
          palette,
        );
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
        context.fillStyle = palette.hubLabel;
        context.fillText("MUJ", labelX, hubPoint.y - 1);
        context.font = "10px ui-sans-serif, system-ui, sans-serif";
        context.fillStyle = palette.hubSubLabel;
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
      context.strokeStyle = palette.rim;
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
  }, [scene]);

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
    const node = scene.partnerNodes.find((item) => item.id === id);
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
        Globe centred on Manipal University Jaipur. Each point is a country of
        institutions listed on MUJ&apos;s official partner page, placed at a
        country-level reference point rather than a campus location, with a
        curved link back to Jaipur.
      </p>
      <ul aria-label="Partner countries shown on the globe" className="sr-only">
        {scene.partnerNodes.map((node) =>
          node.marker ? <li key={node.id}>{markerDescription(node.marker)}</li> : null,
        )}
      </ul>
      <div
        ref={wrapRef}
        className="relative mx-auto aspect-square w-full max-w-[20.5rem] sm:max-w-[26rem] lg:max-w-[34rem] xl:max-w-[38rem]"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          data-globe-markers={scene.partnerNodes.length}
          className="size-full cursor-grab touch-pan-y active:cursor-grabbing"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              x: event.clientX,
              y: event.clientY,
              rot: rotationRef.current,
              moved: false,
            };
            targetRef.current = null;
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (drag) {
              const dx = event.clientX - drag.x;
              if (Math.abs(dx) > 5 || Math.abs(event.clientY - drag.y) > 5) drag.moved = true;
              rotationRef.current = drag.rot + dx / Math.max(80, radiusRef.current);
              if (reduceRef.current) paintRef.current?.();
              return;
            }
            const hit = hitTest(event);
            if (hit !== activeRef.current) setActiveId(hit);
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current;
            dragRef.current = null;
            if (drag && !drag.moved) setActiveId(hitTest(event));
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse" && !dragRef.current) setActiveId(null);
          }}
        />
        <div
          ref={labelRef}
          className="pointer-events-none absolute top-0 left-0 z-10 opacity-0 transition-opacity duration-200"
        >
          {activeMarker ? (
            <div className="rounded-md border border-line-strong bg-surface/90 px-2.5 py-1.5 text-left whitespace-nowrap shadow-none backdrop-blur-sm">
              <p className="text-[10px] tracking-[0.14em] text-cyan uppercase">
                {activeMarker.precision === "city" ? "City-level" : "Country-level"} ·{" "}
                {activeMarker.region}
              </p>
              <p className="mt-0.5 text-sm text-foreground">{markerTitle(activeMarker)}</p>
              <p className="text-[12px] text-fg-soft">{markerSummary(activeMarker)}</p>
              <p className="mt-1 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                Official MUJ source
              </p>
            </div>
          ) : null}
        </div>
      </div>
      <p
        aria-live="polite"
        className="mt-1 min-h-[1.25rem] text-center text-[12px] tracking-[0.04em] text-muted-foreground"
      >
        {activeMarker
          ? `${markerTitle(activeMarker)}: ${markerSummary(activeMarker)} · ${
              activeMarker.precision === "city" ? "city-level" : "country-level"
            } placement`
          : reduced
            ? "Still view. Select a country to bring its link to Jaipur forward."
            : "Drag to turn the globe. Hover or tap a point to trace its link to Jaipur."}
      </p>
      <ul
        aria-label="Countries with the most listed partner institutions"
        aria-describedby="globe-desc"
        className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap lg:justify-center lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {scene.partnerNodes
          .filter((node) => node.marker && chipIds.includes(node.id))
          .map((node) => {
            const marker = node.marker!;
            const selected = activeId === node.id;
            return (
              <li key={node.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={markerDescription(marker)}
                  onMouseEnter={() => focusPartner(node.id, false)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => focusPartner(node.id, true)}
                  onClick={() => focusPartner(node.id, true)}
                  onBlur={() => {
                    setActiveId(null);
                    targetRef.current = null;
                  }}
                  className={cn(
                    "flex items-baseline gap-1.5 border px-2.5 py-1 text-[12px] tracking-[0.01em] whitespace-nowrap transition-colors duration-200",
                    selected
                      ? "border-cyan/70 bg-line text-foreground"
                      : "border-line text-muted-foreground hover:border-line-bold hover:text-foreground",
                  )}
                >
                  {markerTitle(marker)}
                  {marker.precision === "country" ? (
                    <span className="text-[11px] text-fg-dim tabular-nums">{marker.institutions}</span>
                  ) : null}
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
  palette: Palette,
) {
  context.lineWidth = 1;
  context.strokeStyle = palette.graticule;
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

type ArcStyle = {
  kind: "emphasized" | "idle" | "quiet";
  alpha: number;
  /** Position of the travelling pulse along the arc (0–1), or null for none. */
  pulse: number | null;
};

function drawArc(
  context: CanvasRenderingContext2D,
  points: Vec3[],
  cx: number,
  cy: number,
  radius: number,
  rot: number,
  style: ArcStyle,
  palette: Palette,
) {
  const emphasized = style.kind === "emphasized";
  context.globalAlpha = style.alpha;
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
  context.strokeStyle = palette.arc[style.kind];
  context.lineWidth = emphasized ? 1.35 : 0.85;
  context.stroke();

  const t = style.pulse;
  const pulse =
    t === null ? null : screen[Math.min(screen.length - 1, Math.floor(t * (screen.length - 1)))];
  if (pulse && pulse.z >= 0.05) {
    context.fillStyle = emphasized ? palette.pulse.emphasized : palette.pulse.idle;
    context.beginPath();
    context.arc(pulse.x, pulse.y, emphasized ? 2.4 : 1.7, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawNode(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  emphasized: boolean,
  isHub: boolean,
  isCity: boolean,
  depth: number,
  weight: number,
  palette: Palette,
) {
  const scale = 0.82 + depth * 0.22;
  if (isHub) {
    context.beginPath();
    context.arc(x, y, 6.2 * scale, 0, Math.PI * 2);
    context.strokeStyle = palette.hub.ring;
    context.lineWidth = 1;
    context.stroke();
    context.beginPath();
    context.arc(x, y, 3.4 * scale, 0, Math.PI * 2);
    context.strokeStyle = palette.hub.inner;
    context.stroke();
    context.beginPath();
    context.arc(x, y, 1.7 * scale, 0, Math.PI * 2);
    context.fillStyle = palette.hub.core;
    context.fill();
    return;
  }
  if (emphasized || isCity) {
    context.beginPath();
    context.arc(x, y, (emphasized ? 6.2 : 3.6) * scale, 0, Math.PI * 2);
    context.strokeStyle = palette.node.ring;
    context.lineWidth = 1;
    context.stroke();
  }
  context.beginPath();
  context.arc(x, y, (emphasized ? 2.5 : 1.9) * scale * weight, 0, Math.PI * 2);
  context.fillStyle = emphasized ? palette.node.emphasized : palette.node.idle;
  context.fill();
}
