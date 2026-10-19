const SKIN = ['#f2d1b3', '#e8b98f', '#cf9a6c', '#a8714a', '#7d4e32', '#5a3624'];
const HAIR = ['#1b1b1b', '#3a2414', '#6b4423', '#b07a3a', '#d8b46a', '#8a8a8a'];

function rnd(seed: number, i: number): number {
  let x = (seed ^ (i * 2654435761)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
  return ((x ^ (x >>> 13)) >>> 0) / 4294967296;
}

const SKIN_BIAS: Record<string, number> = {
  NG: 4, CD: 4, GH: 4, SN: 4, KE: 4, ET: 3, BR: 2, CO: 2, MX: 2, AR: 1, UY: 1, IN: 3, PK: 3, BD: 3, EG: 2, MA: 2, SA: 2, IR: 1, TR: 1, ID: 2, PH: 2, VN: 1, CN: 0, JP: 0, KR: 0, US: 1, GB: 0, DE: 0, FR: 1, IT: 1, ES: 1, NL: 0, PT: 1, HR: 0
};

export function drawAvatar(g: CanvasRenderingContext2D, size: number, age: number, seed: number, country: string, shirt: string): void {
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, size, size);
  const u = size / 16;
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x * u), Math.round(y * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u)));
  };
  const bias = SKIN_BIAS[country] ?? 1;
  const skin = SKIN[Math.min(5, Math.max(0, bias + Math.floor(rnd(seed, 1) * 2) - (bias > 2 ? 0 : 0)))];
  let hair = HAIR[Math.floor(rnd(seed, 2) * 4)];
  if (['NG', 'CD', 'GH', 'SN', 'KE', 'ET'].includes(country)) hair = HAIR[0];
  if (['KR', 'JP', 'CN', 'VN'].includes(country)) hair = HAIR[rnd(seed, 3) > 0.15 ? 0 : 1];
  if (age >= 55) hair = HAIR[5];
  const grow = Math.min(1, Math.max(0, (age - 8) / 16));
  const yOff = Math.round((1 - grow) * 3);
  const head = 5 + Math.round(grow * 1);
  const bodyH = 5 + Math.round(grow * 2);
  px(8 - head / 2, 3 + yOff, head, head, skin);
  const style = Math.floor(rnd(seed, 4) * 4);
  if (age < 70 || rnd(seed, 5) > 0.5) {
    px(8 - head / 2, 2.5 + yOff, head, 2, hair);
    if (style === 1) px(8 - head / 2 - 0.5, 3 + yOff, 1, 3, hair);
    if (style === 2) { px(8 - head / 2, 2 + yOff, head, 1, hair); }
    if (style === 3 && age >= 20) px(8 - head / 2 + 0.5, 6 + yOff + head - 3, head - 1, 1, hair);
  }
  px(6.2, 5 + yOff, 1, 1, '#1b1b1b');
  px(8.8, 5 + yOff, 1, 1, '#1b1b1b');
  px(7.2, 7.2 + yOff, 1.6, 0.8, '#7a2f2f');
  px(5, 3 + yOff + head, 6, bodyH, shirt);
  px(4, 4 + yOff + head, 1, bodyH - 1, shirt);
  px(11, 4 + yOff + head, 1, bodyH - 1, shirt);
  px(5.5, 3 + yOff + head + bodyH, 2, 3, '#2c3347');
  px(8.5, 3 + yOff + head + bodyH, 2, 3, '#2c3347');
  px(5, 6 + yOff + head + bodyH, 3, 1, '#ffffff');
  px(8, 6 + yOff + head + bodyH, 3, 1, '#ffffff');
}
