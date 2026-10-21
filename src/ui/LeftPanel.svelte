<script lang="ts">
  import { store } from './store.svelte';
  import { drawAvatar, lookForGame } from './pixel/avatar';
  import { ageAt, yearOf } from '../engine/time';
  import { getClub } from '../engine/data';
  import { POS_LABEL, ATTR_LABEL, TECH_KEYS, GK_KEYS, PHYS_KEYS, MENTAL_KEYS, HIDDEN_KEYS, type AttrKey } from '../engine/types';
  import { anchored, shownOvr } from '../engine/attributes';
  import { TRAIT_LABEL, scoutLine } from '../engine/player';
  import { mrz, whyText } from './format';
  import Icon from './Icon.svelte';
  import Spark from './Spark.svelte';
  import Term from './Term.svelte';
  import CountryBadge from './CountryBadge.svelte';
  import { clubKit } from './pixel/palette';
  import { POS_W } from '../engine/attributes';
  import { licenseLabel, licenseLevel, LICENSE_NAME } from '../engine/coach';
  import { formatMarket } from '../engine/finance';

  const g = $derived(store.game!);
  const age = $derived(ageAt(g.p.birth, g.week));
  const clubId = $derived(g.phase === 'coach' ? g.coach.clubId : g.career.clubId || g.p.startClubId);
  let cv: HTMLCanvasElement | undefined = $state();
  let tab = $state<'tech' | 'phys' | 'mental'>('tech');
  const [l1, l2] = $derived(mrz(g));
  const eduLabels = ['중등 과정', '고졸', '대학 재학·졸업', '학위 과정 이수'];
  const header = $derived(g.phase === 'coach' || (g.phase === 'postcareer' && g.coach.entered && g.post.path === 'none') ? '지도자 기록' : g.phase === 'postcareer' ? '은퇴 선수 기록' : '선수 기록');
  const isGk = $derived(g.ab.pos === 'GK');
  const rawKeys = $derived<readonly AttrKey[]>(tab === 'tech' ? (isGk ? [...GK_KEYS, ...TECH_KEYS.slice(0, 3)] : TECH_KEYS) : tab === 'phys' ? PHYS_KEYS : MENTAL_KEYS);
  const keyAttrs = $derived(new Set((Object.entries(POS_W[g.ab.pos]) as [AttrKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k)));
  const keys = $derived([...rawKeys].sort((a, b) => Number(keyAttrs.has(b)) - Number(keyAttrs.has(a))));
  const clubObj = $derived(clubId && g.phase !== 'postcareer' ? safeClub(clubId) : null);
  const clubColor = $derived(clubObj ? clubKit(clubObj.id, clubObj.color).primary : 'var(--faint)');
  function safeClub(id: string) {
    try {
      return getClub(id);
    } catch {
      return null;
    }
  }
  function tier(v: number): string {
    return v <= 7 ? 'ab-low' : v <= 11 ? 'ab-mid' : v <= 15 ? 'ab-good' : v <= 18 ? 'ab-high' : 'ab-great';
  }
  const ovr = $derived(shownOvr(g.ab, age));
  const trend = $derived([...g.hist.slice(-6).map((h) => h.ovr), Math.round(ovr * 10) / 10]);
  const ovrDelta = $derived(Math.round((ovr - g.snap.ovr) * 10) / 10);
  const valDelta = $derived(g.snap.val > 0 ? Math.round(((g.fame.value - g.snap.val) / g.snap.val) * 100) : 0);

  const look = $derived(lookForGame(g, age));

  $effect(() => {
    if (cv) drawAvatar(cv, look, 3);
  });

  function delta(k: AttrKey): number {
    return g.ab.a[k] - g.ab.prev[k];
  }
  const dots = (n: number) => '●'.repeat(n) + '○'.repeat(5 - n);
  const secondary = $derived(Object.entries(g.ab.sec).filter(([, v]) => (v ?? 0) > 0));
  const agent = $derived(g.people.agent && !g.people.agent.gone ? g.people.agent : null);
  const lang = $derived(Object.entries(g.life.lang).filter(([, v]) => v >= 10));
</script>

<div class="left col" style="gap:var(--s3)">
  <div class="panel prof">
    <div class="band"><span>{header} · {g.p.country} · {yearOf(g.week)}</span></div>
    <div class="head">
      <div class="photo"><canvas bind:this={cv} width="96" height="96" class="pixel"></canvas></div>
      <div class="col" style="gap:var(--s1)">
        <div class="nm" title={g.p.en}>{g.p.name}</div>
        <div class="muted sub"><CountryBadge code={g.p.country} /> <span>{age}세 · {g.p.hometown}</span></div>
        <div class="muted sub">{POS_LABEL[g.ab.pos]}{secondary.length ? ` · 부 ${secondary.map(([k]) => k).join(', ')}` : ''}</div>
        <div class="muted sub">{{ R: '오른발', L: '왼발', B: '양발' }[g.p.foot]} · {g.ab.height}cm · {g.ab.weight}kg</div>
      </div>
    </div>
    <div class="ovr">
      <div class="ovn mono" title="포지션 가중 오버롤">{Math.round(ovr)}</div>
      <div class="col" style="gap:0"><span class="sub muted"><Term id="ovr" /></span><span class="sub mono {ovrDelta > 0 ? 'up' : ovrDelta < 0 ? 'down' : 'faint'}">이번 시즌 {ovrDelta > 0 ? '+' : ''}{ovrDelta}</span></div>
      <span class="spacer"></span>
      <Spark values={trend} tone={ovrDelta < 0 ? 'down' : 'accent'} />
    </div>
    <div class="rows">
      <div class="kv"><span>소속</span><span class="club">{#if clubObj}<i class="dot" style="background:{clubColor}"></i>{clubObj.name}{:else}없음{/if}</span></div>
      {#if g.phase === 'youth' || g.phase === 'pro'}<div class="kv"><span>시장가치</span><span class="mono">{formatMarket(g.fame.value)}<small class={valDelta >= 0 ? 'up' : 'down'}> <Icon name={valDelta >= 0 ? 'up' : 'down'} size={12} />{Math.abs(valDelta)}%</small></span></div>{/if}
      <div class="kv"><span>에이전트</span><span title={agent?.en}>{agent ? `${agent.name}` : '없음'}</span></div>
      {#if g.phase === 'youth' || ageAt(g.p.birth, g.week) <= 21}<div class="kv"><span>스카우트 평가</span><span>{scoutLine(g)}</span></div>{/if}
      <div class="kv"><span>출신 가정</span><span class="mono dots" title="소득 분위">{dots(g.p.incomeTier)}</span></div>
      <div class="kv"><span>학력</span><span>{eduLabels[Math.min(3, g.life.eduLevel)]}</span></div>
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
        <span class="mono" title="포지션 가중 오버롤"><Term id="ovr" /> {Math.round(ovr)}</span>
      </div>
      <div class="tabs seg" role="tablist" style="margin:var(--s2) var(--s3) 0;align-self:flex-start">
        <button class="btn sm" role="tab" aria-selected={tab === 'tech'} class:on={tab === 'tech'} onclick={() => (tab = 'tech')}>기술</button>
        <button class="btn sm" role="tab" aria-selected={tab === 'phys'} class:on={tab === 'phys'} onclick={() => (tab = 'phys')}>신체</button>
        <button class="btn sm" role="tab" aria-selected={tab === 'mental'} class:on={tab === 'mental'} onclick={() => (tab = 'mental')}>정신</button>
      </div>
      <div class="panel-b scroll col" style="gap:var(--s2);flex:1">
        {#each keys as k}
          {@const v = g.ab.a[k]}
          {@const d = delta(k)}
          <div class="ab" class:key={keyAttrs.has(k)} title={whyText(g, `attr.${k}`) || '최근 큰 변화가 없어요'}>
            <span>{ATTR_LABEL[k]}</span>
            <div class="gauge"><i class={tier(v)} style="width:{(v / 20) * 100}%"></i></div>
            <b class="mono {tier(v)}">{Math.round(v)}</b>
            <em class={d > 0.25 ? 'up' : d < -0.25 ? 'down' : 'faint'}><Icon name={d > 0.25 ? 'up' : d < -0.25 ? 'down' : 'flat'} size={12} /></em>
          </div>
        {/each}
        {#if tab === 'phys'}
          <div class="kv"><span>체지방률</span><span class="mono">{g.ab.bodyFat.toFixed(1)}%</span></div>
        {/if}
        <div class="sep"></div>
        <div class="kv"><span>플레이 특성</span></div>
        <div class="chips">
          {#each g.ab.traits as t}<span class="chip" class:down={t === 'fragile' || t === 'hothead'}>{TRAIT_LABEL[t] ?? t}</span>{:else}<span class="faint">아직 없음</span>{/each}
        </div>
        <div class="kv"><span>포지션 숙련도</span><span>{POS_LABEL[g.ab.pos]}{secondary.length ? ` · ${secondary.map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}</span></div>
        <div class="kv"><span>스카우트 평가</span><span class="rt">{scoutLine(g)}</span></div>
        <div class="kv"><span><Term id="sharp" /></span><span class="mono">{Math.round(g.st.sharp)}</span></div>
        <div class="kv"><span>평균 출전 비율</span><span class="mono">{Math.round(g.ab.playShare * 100)}%</span></div>
        <div class="mini-hint" title={HIDDEN_KEYS.join(',')}>재능의 한계와 숨은 성향은 수치 대신 행동으로만 드러나요.</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .left { height: 100%; min-height: 0; }
  .prof { overflow: hidden; flex: none; }
  .band { padding: var(--s1) var(--s3); background: color-mix(in srgb, var(--accent) 20%, var(--panel2)); font-size: var(--fs-panel); font-weight: 800; letter-spacing: 0.04em; }
  .head { display: flex; gap: var(--s3); padding: var(--s3) var(--s3) var(--s2); }
  .photo { width: 96px; height: 96px; border-radius: var(--r-sm); border: 1px solid var(--line); overflow: hidden; flex: none; }
  .nm { font-weight: 800; font-size: 18px; }
  .sub { font-size: var(--fs-sub); display: flex; align-items: center; gap: var(--s2); }
  .ovr { display: flex; align-items: center; gap: var(--s3); padding: var(--s2) var(--s3); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--panel2); }
  .ovn { font-size: 32px; font-weight: 700; line-height: 1; min-width: 48px; }
  .rows { padding: var(--s2) var(--s3); display: flex; flex-direction: column; gap: var(--s1); }
  .club { display: inline-flex; align-items: center; gap: var(--s2); }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .dots { letter-spacing: 2px; color: var(--amber); }
  .mrz { font-size: var(--fs-panel); letter-spacing: 0.06em; color: var(--faint); background: var(--bg2); border-top: 1px solid var(--line); padding: var(--s1) var(--s2); line-height: 1.2; word-break: break-all; }
  .ab { display: grid; grid-template-columns: 78px 1fr 24px 14px; gap: var(--s2); align-items: center; font-size: var(--fs-sub); }
  .ab span { color: var(--muted); }
  .ab.key span { color: var(--text); font-weight: 800; }
  .ab.key b { font-weight: 800; }
  .ab b { text-align: right; }
  .ab em { font-style: normal; display: grid; place-items: center; }
  .gauge i.ab-low { background: var(--a-low); }
  .gauge i.ab-mid { background: var(--a-mid); }
  .gauge i.ab-good { background: var(--a-good); }
  .gauge i.ab-high { background: var(--a-high); }
  .gauge i.ab-great { background: var(--a-great); }
  .rt { text-align: right; }
  .sep { height: 1px; background: var(--line); margin: 2px 0; }
</style>
