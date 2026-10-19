export type SceneKind = 'dorm' | 'field' | 'stadium' | 'home' | 'bench' | 'booth' | 'office' | 'hospital';

export interface SceneInput {
  kind: SceneKind;
  season: number;
  night: number;
  t: number;
  seed: number;
  hue: number;
  car: boolean;
  snow: boolean;
  crowd: number;
}

const W = 160;
const H = 56;

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h} ${s}% ${l}%)`;
}

function mix(a: number[], b: number[], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

function rnd(seed: number, i: number): number {
  let x = (seed ^ (i * 374761393)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

const SKY_DAY: number[][] = [[132, 190, 245], [150, 205, 255], [170, 200, 235], [180, 205, 225]];
const SKY_NIGHT = [18, 24, 54];
const GROUND: string[] = ['#5aa64a', '#3f9a3f', '#b97a3c', '#dfe7ee'];
const TREE: string[] = ['#3e8f3a', '#2d7d32', '#c8651b', '#cfd8dc'];

export function drawScene(g: CanvasRenderingContext2D, inp: SceneInput): void {
  g.imageSmoothingEnabled = false;
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const n = inp.night;
  const day = SKY_DAY[inp.season % 4];
  const top = mix(day, SKY_NIGHT, n);
  const bot = mix([day[0] + 25, day[1] + 20, Math.min(255, day[2] + 10)], [40, 40, 90], n);
  for (let y = 0; y < 34; y++) px(0, y, W, 1, mix(top.match(/\d+/g)!.map(Number), bot.match(/\d+/g)!.map(Number), y / 34));
  if (n > 0.45) for (let i = 0; i < 26; i++) px(rnd(inp.seed, i) * W, rnd(inp.seed, i + 40) * 28, 1, 1, i % 5 === 0 ? '#fff6c7' : '#aab4ff');
  const sunX = 20 + ((inp.t * 0.003 + 0.25) % 1) * 120;
  if (n < 0.6) px(sunX, 6 + Math.abs(sunX - 80) * 0.12, 6, 6, '#ffe27a');
  else px(118, 7, 5, 5, '#e8ecff');
  for (let i = 0; i < 4; i++) {
    const cx = ((rnd(inp.seed, 90 + i) * 200 + inp.t * (0.02 + i * 0.006)) % 200) - 20;
    const cy = 5 + i * 5;
    const cc = n > 0.5 ? '#3a4272' : '#ffffff';
    px(cx, cy, 14, 3, cc);
    px(cx + 3, cy - 2, 8, 2, cc);
  }
  const ground = n > 0.5 ? mix(hexToRgb(GROUND[inp.season % 4]), [20, 40, 30], 0.6) : GROUND[inp.season % 4];
  px(0, 34, W, H - 34, ground);
  const tree = n > 0.5 ? '#1f3a2a' : TREE[inp.season % 4];
  const drawTree = (x: number, y: number, s: number) => {
    px(x + s, y + s * 2, 2, s * 2, '#6b4a2b');
    px(x, y, s * 2 + 2, s * 2, tree);
    px(x + 1, y - 1, s * 2, 2, tree);
  };
  const lit = n > 0.4 ? '#ffe9a0' : '#9fd0ff';
  switch (inp.kind) {
    case 'dorm': {
      px(30, 18, 62, 26, hsl(inp.hue, 25, n > 0.5 ? 25 : 62));
      px(28, 15, 66, 4, hsl(inp.hue, 35, 38));
      for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) px(34 + c * 9, 21 + r * 10, 5, 6, (c + r * 3 + Math.floor(inp.t / 40)) % 4 === 0 && n > 0.4 ? '#2b3350' : lit);
      px(58, 36, 8, 8, '#4a3a2a');
      drawTree(8, 28, 4);
      drawTree(112, 26, 5);
      drawTree(134, 30, 3);
      px(0, 46, W, 3, '#8a8f98');
      break;
    }
    case 'field': {
      px(10, 38, 140, 14, '#47a043');
      for (let i = 0; i < 7; i++) px(10 + i * 20, 38, 10, 14, '#3f9a3b');
      px(10, 38, 140, 1, '#ffffffcc');
      px(10, 51, 140, 1, '#ffffffcc');
      px(79, 38, 2, 14, '#ffffffcc');
      px(6, 40, 1, 8, '#ffffff');
      px(5, 40, 3, 1, '#ffffff');
      px(153, 40, 1, 8, '#ffffff');
      px(152, 40, 3, 1, '#ffffff');
      for (let i = 0; i < 6; i++) {
        const x = 30 + i * 18 + Math.sin(inp.t * 0.05 + i) * 7;
        const y = 41 + (i % 3) * 3 + Math.cos(inp.t * 0.07 + i) * 1.5;
        px(x, y, 3, 5, i % 2 ? hsl(inp.hue, 70, 50) : '#e8e8e8');
        px(x, y - 2, 3, 2, '#d9a77a');
      }
      px(20 + ((inp.t * 0.4) % 110), 46, 2, 2, '#fff');
      drawTree(4, 26, 4);
      drawTree(140, 24, 5);
      break;
    }
    case 'stadium': {
      px(0, 22, W, 14, n > 0.5 ? '#2a2f48' : '#7b8499');
      px(0, 20, W, 3, n > 0.5 ? '#161a2b' : '#556070');
      const crowd = Math.max(0.2, inp.crowd);
      for (let i = 0; i < 160; i++) {
        if (rnd(inp.seed, i + 200) > crowd) continue;
        px(i, 24 + (i % 4) * 3, 1, 2, ['#ff5a5a', '#ffd45a', '#5ac8ff', '#ffffff'][i % 4]);
      }
      px(8, 36, 144, 18, '#46a042');
      for (let i = 0; i < 8; i++) px(8 + i * 18, 36, 9, 18, '#3e9a3a');
      px(8, 36, 144, 1, '#fff');
      px(79, 36, 2, 18, '#ffffffcc');
      px(70, 42, 20, 6, '#46a042');
      px(70, 42, 20, 1, '#ffffffaa');
      px(70, 47, 20, 1, '#ffffffaa');
      for (let i = 0; i < 8; i++) {
        const x = 24 + i * 15 + Math.sin(inp.t * 0.06 + i) * 6;
        const y = 40 + (i % 4) * 3;
        px(x, y, 3, 5, i < 4 ? hsl(inp.hue, 75, 50) : '#f0f0f0');
        px(x, y - 2, 3, 2, '#d9a77a');
      }
      px(60 + Math.sin(inp.t * 0.08) * 30 + 20, 46, 2, 2, '#fff');
      if (n > 0.4) for (const fx of [4, 28, 124, 150]) { px(fx, 6, 2, 16, '#444'); px(fx - 2, 4, 6, 3, '#fff7c2'); }
      break;
    }
    case 'home': {
      px(54, 24, 40, 22, hsl(inp.hue, 30, n > 0.5 ? 26 : 70));
      px(50, 18, 48, 8, '#a3462a');
      px(60, 12, 5, 8, '#6a3a2a');
      px(62, 28, 8, 8, lit);
      px(78, 28, 8, 8, lit);
      px(70, 36, 8, 10, '#5b3b24');
      drawTree(22, 26, 5);
      drawTree(112, 28, 4);
      if (inp.car) { px(104, 40, 18, 6, hsl(inp.hue + 160, 60, 45)); px(108, 37, 10, 4, hsl(inp.hue + 160, 60, 60)); px(106, 45, 4, 2, '#222'); px(116, 45, 4, 2, '#222'); }
      px(0, 46, W, 3, '#9a8f7a');
      break;
    }
    case 'bench': {
      px(10, 38, 140, 16, '#46a042');
      for (let i = 0; i < 7; i++) px(10 + i * 20, 38, 10, 16, '#3f9a3b');
      px(20, 28, 40, 9, '#2c3347');
      px(20, 26, 40, 3, '#46506b');
      px(30, 31, 4, 6, '#e8e8e8');
      px(30, 29, 4, 2, '#d9a77a');
      px(38, 31, 4, 6, hsl(inp.hue, 60, 45));
      px(38, 29, 4, 2, '#d9a77a');
      px(88 + Math.sin(inp.t * 0.03) * 20, 44, 3, 5, hsl(inp.hue, 70, 50));
      for (let i = 0; i < 5; i++) px(70 + i * 12 + Math.sin(inp.t * 0.05 + i) * 4, 42 + (i % 2) * 5, 3, 5, i % 2 ? '#f0f0f0' : hsl(inp.hue, 70, 50));
      break;
    }
    case 'booth': {
      px(0, 18, W, 38, n > 0.5 ? '#232842' : '#3b4260');
      px(20, 24, 50, 22, '#10131f');
      px(22, 26, 46, 18, '#2f8f4f');
      px(22 + (inp.t * 0.5) % 40, 34, 2, 2, '#fff');
      px(90, 36, 56, 8, '#6b4a2b');
      px(110, 24, 4, 12, '#222');
      px(108, 22, 8, 3, '#444');
      px(98, 28, 6, 8, '#d9a77a');
      px(98, 26, 6, 3, '#222');
      px(132, 28, 6, 8, '#d9a77a');
      px(0, 46, W, 10, '#1b1f33');
      break;
    }
    case 'office': {
      px(0, 16, W, 40, n > 0.5 ? '#222742' : '#aeb6c8');
      for (let c = 0; c < 8; c++) px(8 + c * 19, 22, 12, 14, c % 3 === 0 && n > 0.4 ? '#2b3350' : lit);
      px(50, 40, 60, 8, '#6b4a2b');
      px(60, 34, 14, 6, '#222');
      px(82, 36, 8, 4, '#f5f5f5');
      break;
    }
    case 'hospital': {
      px(40, 16, 80, 30, '#e8eef5');
      px(76, 20, 8, 2, '#d03a3a');
      px(79, 17, 2, 8, '#d03a3a');
      for (let c = 0; c < 6; c++) px(46 + c * 12, 28, 6, 8, lit);
      break;
    }
  }
  if (inp.snow || inp.season === 3) {
    for (let i = 0; i < 40; i++) {
      const x = (rnd(inp.seed, i + 500) * W + Math.sin(inp.t * 0.02 + i) * 4) % W;
      const y = (rnd(inp.seed, i + 600) * H + inp.t * 0.4 * (0.4 + rnd(inp.seed, i + 700))) % H;
      px(x, y, 1, 1, '#ffffff');
    }
  }
  if (n > 0.6) { g.fillStyle = 'rgba(10,14,40,0.28)'; g.fillRect(0, 0, W, H); }
}

function hexToRgb(h: string): number[] {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export const SCENE_W = W;
export const SCENE_H = H;
