import { decode } from 'jpeg-js';

export type TaskType = 'sky' | 'math' | 'steps';

export const STEPS_GOAL = 30;
export const MATH_COUNT = 3;
/** Средняя яркость фото (0–255), начиная с которой считаем, что человек у окна или при свете. */
export const MIN_BRIGHTNESS = 60;

export type MathProblem = { text: string; answer: number };

// Детерминированный генератор, чтобы примеры не менялись при каждом рендере.
function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Три примера: сложение, вычитание, умножение. Достаточно, чтобы проснуться, но без стресса. */
export function mathProblems(seed: number): MathProblem[] {
  const r = rng(seed);
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const a1 = int(12, 49);
  const b1 = int(11, 39);
  const a2 = int(40, 90);
  const b2 = int(11, a2 - 10);
  const a3 = int(3, 9);
  const b3 = int(4, 9);
  return [
    { text: `${a1} + ${b1}`, answer: a1 + b1 },
    { text: `${a2} − ${b2}`, answer: a2 - b2 },
    { text: `${a3} × ${b3}`, answer: a3 * b3 },
  ];
}

function base64ToBytes(b64: string) {
  const clean = b64.replace(/^data:[^,]+,/, '');
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Средняя яркость маленького JPEG (base64) по формуле яркости Rec. 601. */
export function jpegBrightness(base64: string) {
  const img = decode(base64ToBytes(base64), { useTArray: true, formatAsRGBA: true });
  let sum = 0;
  const px = img.width * img.height;
  for (let i = 0; i < px; i++) {
    const o = i * 4;
    sum += 0.299 * img.data[o] + 0.587 * img.data[o + 1] + 0.114 * img.data[o + 2];
  }
  return px ? sum / px : 0;
}
