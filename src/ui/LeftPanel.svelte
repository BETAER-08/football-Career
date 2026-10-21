<script lang="ts">
  import { store } from './store.svelte';
  import { onMount } from 'svelte';
  import { drawAvatar } from './pixel/avatar';
  import { ageAt, yearOf } from '../engine/time';
  import { getClub, getCountry } from '../engine/data';
  import { POS_LABEL, ATTR_LABEL, TECH_KEYS, GK_KEYS, PHYS_KEYS, MENTAL_KEYS, HIDDEN_KEYS, type AttrKey } from '../engine/types';
  import { anchored, shownOvr } from '../engine/attributes';
  import { TRAIT_LABEL } from '../engine/player';
  import { mrz, seed32, whyText } from './format';
  import { licenseLabel, licenseLevel, LICENSE_NAME } from '../engine/coach';
  import { hashString } from '../engine/rng';
  import { formatMarket } from '../engine/finance';

  const g = $derived(store.game!);
  const age = $derived(ageAt(g.p.birth, g.week));
  const country = $derived(getCountry(g.p.country));
  const clubId = $derived(g.phase === 'coach' ? g.coach.clubId : g.career.clubId || g.p.startClubId);
  let cv: HTMLCanvasElement | undefined = $state();
  let tab = $state<'tech' | 'phys' | 'mental'>('tech');
  const [l1, l2] = $derived(mrz(g));
  const eduLabels = ['중등 과정', '고졸', '대학 재학·졸업', '학위 과정 이수'];
  const header = $derived(g.phase === 'coach' || (g.phase === 'postcareer' && g.coach.entered && g.post.path === 'none') ? '지도자 기록' : g.phase === 'postcareer' ? '은퇴 선수 기록' : '선수 기록');
  const isGk = $derived(g.ab.pos === 'GK');
  const keys = $derived<readonly AttrKey[]>(tab === 'tech' ? (isGk ? [...GK_KEYS, ...TECH_KEYS.slice(0, 3)] : TECH_KEYS) : tab === 'phys' ? PHYS_KEYS : MENTAL_KEYS);
  const ovr = $derived(shownOvr(g.ab, age));
  const club = $derived(clubId ? getClub(clubId) : null);
  const valDelta = $derived(g.snap.val > 0 ? Math.round(((g.fame.value - g.snap.val) / g.snap.val) * 100) : 0);

  $effect(() => {
    void age; void clubId;
    if (!cv) return;
    const c = cv.getContext('2d');
    if (c) drawAvatar(c, 72, age, seed32(g.cfg.seed), g.p.country, `hsl(${club ? club.color : 150} 65% 48%)`);
  });
  onMount(() => {});

  function delta(k: AttrKey): number {
    return g.ab.a[k] - g.ab.prev[k];
  }
  const dots = (n: number) => '●'.repeat(n) + '○'.repeat(5 - n);
  const secondary = $derived(Object.entries(g.ab.sec).filter(([, v]) => (v ?? 0) > 0));
  const agent = $derived(g.people.agent && !g.people.agent.gone ? g.people.agent : null);
  const lang = $derived(Object.entries(g.life.lang).filter(([, v]) => v >= 10));
</script>

<div class="left col" style="gap:10px">
  <div class="panel prof">
    <div class="band"><span>{header} · {g.p.country} · {yearOf(g.week)}</span></div>
    <div class="head">
      <div class="photo"><canvas bind:this={cv} width="72" height="72" class="pixel"></canvas></div>
      <div class="col" style="gap:1px">
        <div class="nm" title={g.p.en}>{g.p.name}</div>
        <div class="muted" style="font-size:12px">{g.p.birth.y}.{String(g.p.birth.m).padStart(2, '0')}.{String(g.p.birth.d).padStart(2, '0')}생 · {age}세</div>
        <div class="muted" style="font-size:12px">{country.flag} {country.ko} · {g.p.hometown}</div>
      </div>
    </div>
    <div class="rows">
      <div class="kv"><span>출신 가정</span><span class="mono dots" title="소득 분위">{dots(g.p.incomeTier)}</span></div>
      {#if g.phase === 'youth' || g.phase === 'pro'}<div class="kv"><span>시장가치</span><span class="mono">{formatMarket(g.fame.value)}<small class={valDelta >= 0 ? 'up' : 'down'}> {valDelta >= 0 ? '▲' : '▼'}{Math.abs(valDelta)}%</small></span></div>{/if}
      <div class="kv"><span>학력</span><span>{eduLabels[Math.min(3, g.life.eduLevel)]}</span></div>
      <div class="kv"><span>포지션</span><span>{POS_LABEL[g.ab.pos]}{secondary.length ? ` · 부: ${secondary.map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}</span></div>
      <div class="kv"><span>주발 · 체격</span><span>{{ R: '오른발', L: '왼발', B: '양발' }[g.p.foot]} · {g.ab.height}cm {g.ab.weight}kg</span></div>
      <div class="kv"><span>에이전트</span><span title={agent?.en}>{agent ? `${agent.name}` : '없음'}</span></div>
      {#if lang.length > 1}<div class="kv"><span>언어</span><span>{lang.map(([k, v]) => `${k} ${Math.round(v)}`).join(' · ')}</span></div>{/if}
    </div>
    <div class="mrz mono"><div>{l1}</div><div>{l2}</div></div>
  </div>

  <div class="panel" style="flex:1;min-height:0;display:flex;flex-direction:column">
    {#if g.phase === 'coach' || (g.phase === 'postcareer' && g.coach.entered)}
      <div class="panel-h">지도자 능력 · 자격증 · 명성</div>
      <div class="panel-b scroll col" style="gap:7px">
        {#each [['tactics', '전술'], ['development', '육성'], ['leadership', '리더십'], ['management', '선수단 관리'], ['media', '미디어 대응'], ['data', '데이터 활용'], ['language', '언어']] as [k, label]}
          {@const v = (g.coach.skills as Record<string, number>)[k]}
          <div class="ab"><span>{label}</span><div class="gauge"><i style="width:{Math.min(100, v)}%"></i></div><b class="mono">{Math.round(v)}</b></div>
        {/each}
        <div class="kv"><span>명성</span><span class="mono">{Math.round(g.coach.fame)} <span class="faint">(최고 {Math.round(g.coach.peakFame)})</span></span></div>
        <div class="kv"><span>입지</span><span class="mono">{Math.round(g.coach.standing)}</span></div>
        <div class="kv"><span>능력치 상한 (추정)</span><span class="mono">{Math.round(g.coach.cap - 6)}~{Math.round(g.coach.cap + 6)}</span></div>
        <div class="sep"></div>
        {#each ['C', 'B', 'A', 'P'] as k}
          <div class="kv"><span>{licenseLabel(g.p.country, k as 'C' | 'B' | 'A' | 'P')}</span><span class={g.coach.licenses[k as 'C' | 'B' | 'A' | 'P'] ? 'up' : 'faint'}>{g.coach.licenses[k as 'C' | 'B' | 'A' | 'P'] ? '취득' : g.coach.studying === k ? '이수 중' : '미취득'}</span></div>
        {/each}
        <div class="mini-hint">현재 {licenseLevel(g) ? LICENSE_NAME[['', 'C', 'B', 'A', 'P'][licenseLevel(g)]] : '자격증 없음'} · 지도 경력 {g.coach.coachSeasons}시즌</div>
      </div>
    {:else}
      <div class="panel-h">
        <span>능력치</span>
        <span class="spacer"></span>
        <span class="mono" title="포지션 가중 오버롤">OVR {Math.round(ovr)}</span>
      </div>
      <div class="tabs">
        <button class="btn sm" class:on={tab === 'tech'} onclick={() => (tab = 'tech')}>기술</button>
        <button class="btn sm" class:on={tab === 'phys'} onclick={() => (tab = 'phys')}>신체</button>
        <button class="btn sm" class:on={tab === 'mental'} onclick={() => (tab = 'mental')}>정신</button>
      </div>
      <div class="panel-b scroll col" style="gap:6px;flex:1">
        {#each keys as k}
          {@const v = g.ab.a[k]}
          {@const d = delta(k)}
          <div class="ab" title={whyText(g, `attr.${k}`) || '최근 큰 변화가 없어요'}><span>{ATTR_LABEL[k]}</span><div class="gauge" class:warn={v < 7} class:bad={v < 4}><i style="width:{(v / 20) * 100}%"></i></div><b class="mono">{Math.round(v)}</b><em class={d > 0.25 ? 'up' : d < -0.25 ? 'down' : 'faint'}>{d > 0.25 ? '▲' : d < -0.25 ? '▼' : '·'}</em></div>
        {/each}
        {#if tab === 'phys'}
          <div class="kv"><span>체지방률</span><span class="mono">{g.ab.bodyFat.toFixed(1)}%</span></div>
        {/if}
        <div class="sep"></div>
        <div class="kv"><span>플레이 특성</span></div>
        <div class="chips">
          {#each g.ab.traits as t}<span class="chip" class:down={t === 'fragile' || t === 'hothead'}>{TRAIT_LABEL[t] ?? t}</span>{:else}<span class="faint">아직 없음</span>{/each}
        </div>
        <div class="mini-hint" style="margin-top:4px">재능의 한계는 아무도 몰라요. 늦게 꽃피는 선수도 있어요.</div>
        <div class="kv"><span>경기 감각</span><span class="mono">{Math.round(g.st.sharp)}</span></div>
        <div class="kv"><span>평균 출전 비율</span><span class="mono">{Math.round(g.ab.playShare * 100)}%</span></div>
        <div class="sep"></div>
        <div class="mini-hint" title={HIDDEN_KEYS.join(',')}>숨은 성향은 수치 대신 행동으로만 드러나요.</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .left { height: 100%; min-height: 0; }
  .prof { overflow: hidden; }
  .band { padding: 5px 12px; background: color-mix(in srgb, var(--accent) 20%, var(--panel2)); font-size: 11px; font-weight: 800; letter-spacing: 0.05em; }
  .head { display: flex; gap: 10px; padding: 10px 12px 4px; }
  .photo { width: 72px; height: 72px; border-radius: 8px; border: 1px solid var(--line); background: repeating-linear-gradient(45deg, var(--bg2), var(--bg2) 5px, var(--panel2) 5px, var(--panel2) 10px); overflow: hidden; flex: none; }
  .nm { font-weight: 800; font-size: 17px; }
  .rows { padding: 4px 12px 8px; display: flex; flex-direction: column; gap: 2px; }
  .dots { letter-spacing: 2px; color: var(--amber); }
  .mrz { font-size: 10.5px; letter-spacing: 0.06em; color: var(--faint); background: var(--bg2); border-top: 1px solid var(--line); padding: 4px 8px; line-height: 1.2; word-break: break-all; }
  .tabs { display: flex; gap: 4px; padding: 6px 12px 0; }
  .ab { display: grid; grid-template-columns: 78px 1fr 24px 14px; gap: 8px; align-items: center; font-size: 12.5px; }
  .ab span { color: var(--muted); }
  .ab b { text-align: right; }
  .ab em { font-style: normal; font-size: 10px; }
  .sep { height: 1px; background: var(--line); margin: 2px 0; }
</style>
