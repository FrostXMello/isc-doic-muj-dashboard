import { LAND_DOTS } from "@/lib/land-dots";

export type Vec3 = readonly [number, number, number];

const DEG = Math.PI / 180;

export function latLonToVec(lat: number, lon: number): Vec3 {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.sin(lambda), Math.sin(phi), cosPhi * Math.cos(lambda)];
}

/** Unit vectors for land dots, packed xyz. Built once. */
export const LAND_VECS = (() => {
  const out = new Float32Array(LAND_DOTS.length * 3);
  for (let i = 0; i < LAND_DOTS.length; i += 1) {
    const [lat, lon] = LAND_DOTS[i];
    const [x, y, z] = latLonToVec(lat, lon);
    const o = i * 3;
    out[o] = x;
    out[o + 1] = y;
    out[o + 2] = z;
  }
  return out;
})();

export const LAND_COUNT = LAND_DOTS.length;

/** Positive tilt brings the northern hemisphere toward the viewer. */
export const GLOBE_TILT = 0.38;

export function rotateY(x: number, z: number, rot: number) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return {
    x: x * c + z * s,
    z: -x * s + z * c,
  };
}

export function tiltX(y: number, z: number, tilt = GLOBE_TILT) {
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  return {
    y: y * c - z * s,
    z: y * s + z * c,
  };
}

export function projectVec(
  x: number,
  y: number,
  z: number,
  rot: number,
  tilt = GLOBE_TILT,
) {
  const spun = rotateY(x, z, rot);
  const tipped = tiltX(y, spun.z, tilt);
  return { x: spun.x, y: tipped.y, z: tipped.z };
}

/** Rotation that brings a longitude to the front of the globe. */
export function rotationForLongitude(lon: number) {
  return -lon * DEG;
}

export function shortestAngle(from: number, to: number) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export function slerpLift(a: Vec3, b: Vec3, t: number): Vec3 {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.min(1, Math.max(-1, dot));
  const omega = Math.acos(dot);
  let x: number;
  let y: number;
  let z: number;
  if (omega < 1e-3) {
    x = a[0];
    y = a[1];
    z = a[2];
  } else {
    const s = Math.sin(omega);
    const t1 = Math.sin((1 - t) * omega) / s;
    const t2 = Math.sin(t * omega) / s;
    x = a[0] * t1 + b[0] * t2;
    y = a[1] * t1 + b[1] * t2;
    z = a[2] * t1 + b[2] * t2;
  }
  const len = Math.hypot(x, y, z) || 1;
  const lift = 1 + Math.sin(t * Math.PI) * 0.2;
  return [(x / len) * lift, (y / len) * lift, (z / len) * lift];
}
