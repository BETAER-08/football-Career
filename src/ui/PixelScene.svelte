<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { store } from './store.svelte';
  import { drawScene, SCENE_W, SCENE_H, type SceneKind } from './pixel/scene';
  import { swOf, monthOfSw } from '../engine/time';
  import { getClub } from '../engine/data';
  import { seed32 } from './format';
  import { matchesThisWeekPeek } from './peek';

  let cv: HTMLCanvasElement | undefined = $state();
  let raf = 0;
  let t = 0;
  let acc = 0;
  let prev = 0;

  const g = $derived(store.game!);

  function kindOf(): SceneKind {
    const s = g;
    if (s.phase === 'postcareer') return s.post.path === 'pundit' ? 'booth' : s.post.path === 'admin' ? 'office' : 'home';
    if (s.phase === 'coach') return s.coach.role === 'none' ? 'home' : 'bench';
    const tw = s.ev.flags.transferW;
    if (tw !== undefined && s.week === tw) return 'airport';
    const cw = s.ev.flags.trophyW;
    if (cw !== undefined && s.week - cw <= 2 && s.week >= cw) return 'ceremony';
    if (matchesThisWeekPeek(s)) return 'stadium';
    if (s.st.injury) return 'rehab';
    if (s.phase === 'youth' && s.fin.housing === 'dorm') return swOf(s.week) % 3 === 0 ? 'dorm' : 'field';
    if (swOf(s.week) % 5 === 4) return 'home';
    return 'field';
  }

  function seasonOf(sw: number): number {
    const m = monthOfSw(sw);
    return m >= 3 && m <= 5 ? 0 : m >= 6 && m <= 8 ? 1 : m >= 9 && m <= 11 ? 2 : 3;
  }

  function draw(now: number) {
    raf = requestAnimationFrame(draw);
    const dt = now - prev;
    prev = now;
    acc += dt;
    if (acc < 80 || !cv) return;
    acc = 0;
    t += 1;
    const c = cv.getContext('2d');
    if (!c) return;
    const sw = swOf(g.week);
    const idc = g.phase === 'coach' ? g.coach.clubId : g.career.clubId;
    const hue = idc ? getClub(idc).color : 150;
    const dayPhase = store.dayPhase();
    const night = Math.max(0, Math.min(1, Math.abs(dayPhase - 0.5) * 2.6 - 0.6));
    drawScene(c, {
      kind: kindOf(), season: seasonOf(sw), night, t, seed: seed32(g.cfg.seed), hue, car: g.fin.car > 0, snow: false,
      crowd: Math.min(1, 0.4 + g.career.cur.lvl * 0.1 + g.fame.dom / 200)
    });
  }

  onMount(() => { raf = requestAnimationFrame(draw); });
  onDestroy(() => cancelAnimationFrame(raf));

  const caption = $derived.by(() => {
    const s = g;
    const kind = kindOf();
    const idc = s.phase === 'coach' ? s.coach.clubId : s.career.clubId;
    const club = idc ? getClub(idc) : null;
    if (s.phase === 'postcareer') {
      return s.post.path === 'pundit' ? '방송국 해설 부스 · 생방송 준비 중' : s.post.path === 'admin' ? '구단 사무실 · 스카우팅 보고서를 정리하는 중' : s.post.path === 'business' ? `${s.p.hometown} · 사업을 챙기는 일상` : `${s.p.hometown} · 평온한 일상`;
    }
    if (!club) return `${s.p.hometown} · 새 소속을 기다리는 중`;
    const where = club.city;
    if (s.phase === 'coach') return `${where} · ${club.name} · ${kind === 'bench' ? '지도자 벤치' : '훈련장'}`;
    if (kind === 'dorm') return `${where} · ${club.name} 아카데미 숙소 · 동료 ${s.p.dorm ? 2 : 0}명과 함께`;
    if (kind === 'stadium') return `${where} · ${club.name} · 경기 주간`;
    if (kind === 'hospital' || kind === 'rehab') return `${where} · 재활실 · ${s.st.injury?.ko ?? ''}`;
    if (kind === 'ceremony') return `${where} · ${club.name} · 트로피 세리머니`;
    if (kind === 'airport') return `${where} · 공항 · 새 소속팀으로 떠나는 날`;
    if (kind === 'home') return `${where} · 쉬는 날의 ${s.fin.housing === 'own' ? '내 집' : s.fin.housing === 'family' ? '가족 집' : s.fin.housing === 'rent' ? '임대 집' : '숙소'}`;
    return `${where} · ${club.name} 훈련장`;
  });
</script>

<div class="scene">
  <canvas bind:this={cv} width={SCENE_W} height={SCENE_H} class="pixel"></canvas>
  <div class="cap">{caption}</div>
</div>

<style>
  .scene { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--line); background: #000; }
  canvas { width: 100%; height: 210px; display: block; }
  .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 6px 12px; font-size: 12.5px; background: linear-gradient(transparent, rgba(0, 0, 0, 0.7)); color: #fff; }
</style>
