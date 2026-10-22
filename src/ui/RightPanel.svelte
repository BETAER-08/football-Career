<script lang="ts">
  import { PERSONA_SHORT, personaOf } from '../engine/quotes';
  import { store } from './store.svelte';
  import { getClub, getLeague, getCountry } from '../engine/data';
  import { START_YEAR, ageAt, seasonOf, yearOf } from '../engine/time';
  import { anchored, toNewScale } from '../engine/attributes';
  import { formatKRW, formatMarket } from '../engine/finance';
  import { REL_LABEL } from '../engine/fx';
  import type { Person, SeasonRec } from '../engine/types';
  import { whyText } from './format';
  import Icon from './Icon.svelte';
  import LineChart from './LineChart.svelte';
  import CountryBadge from './CountryBadge.svelte';
  type RTab = 'stats' | 'people' | 'world' | 'time';
  let rtab = $state<RTab>('stats');

  function openReview(sn: number, role: 'player' | 'coach') {
    const i = g.reviews.findIndex((x) => x.s === sn && x.role === role);
    if (i >= 0) store.openReviewAt(i);
  }
  const hasReview = (sn: number, role: 'player' | 'coach') => g.reviews.some((x) => x.s === sn && x.role === role);

  const g = $derived(store.game!);
  const newsList = $derived(g.log.filter((e) => e.kind === 'world').slice(-10).reverse());
  const natRecent = $derived(g.nat.matches.slice(-6).reverse());
  const age = $derived(ageAt(g.p.birth, g.week));
  const curSeason = $derived(seasonOf(g.week));
  const first = $derived<SeasonRec[]>([...g.career.seasons, ...(g.career.cur.done || (!g.career.cur.apps && !g.career.cur.mins) ? [] : [g.career.cur])]);
  const youthRecs = $derived<SeasonRec[]>([
    ...g.career.ySeasons,
    ...(g.career.yCur.done || (!g.career.yCur.apps && !g.career.yCur.mins) ? [] : [g.career.yCur]),
    ...g.career.resSeasons.map((r) => ({ ...r, clubName: `${r.clubName} 리저브`, leagueName: r.leagueName || '리저브 리그' })),
    ...(g.career.resCur.done || (!g.career.resCur.apps && !g.career.resCur.mins) ? [] : [{ ...g.career.resCur, clubName: `${g.career.resCur.clubName} 리저브`, leagueName: g.career.resCur.leagueName || '리저브 리그' }])
  ]);
  let tabSel = $state<'f' | 'y' | ''>('');
  const tab = $derived<'f' | 'y'>(tabSel || (first.length || !youthRecs.length ? 'f' : 'y'));
  const all = $derived(tab === 'f' ? first : youthRecs);
  const everything = $derived<SeasonRec[]>([...youthRecs, ...first]);
  const tot = $derived.by(() => {
    let apps = 0, goals = 0, ast = 0, rs = 0, rn = 0, cs = 0;
    for (const r of all) { apps += r.apps; goals += r.goals; ast += r.assists; rs += r.ratingSum; rn += r.ratingN; cs += r.cs; }
    return { apps, goals, ast, avg: rn ? rs / rn : 0, cs };
  });
  const rows = $derived([...all].reverse().slice(0, 14));
  const ratings = $derived(all.filter((r) => r.ratingN > 3).map((r) => ({ y: r.year, v: r.ratingSum / r.ratingN })));
  const ratingPts = $derived(ratings.map((r) => ({ label: `${r.y}`, value: r.v })));

  function relKeys(): string[] {
    const order = ['coach', 'captain', 'mate1', 'mate2', 'mate3', 'friend1', 'rival', 'agent', 'partner', 'fans', 'media', 'natcoach', 'director', 'owner'];
    return order.filter((k) => g.people[k] && !(g.people[k].gone && k !== 'friend1'));
  }
  const relList = $derived(relKeys());
  const family = $derived(Object.keys(g.people).filter((k) => ['father', 'mother', 'partner'].includes(k) || k.startsWith('sibling') || k.startsWith('child')));
  function pAge(p: Person): number {
    return yearOf(g.week) - p.birthYear;
  }
  function relColor(v: number): string {
    return v >= 40 ? 'var(--accent)' : v >= 0 ? 'var(--info)' : v >= -30 ? 'var(--amber)' : 'var(--danger)';
  }
  const snap = $derived(store.relSnap);
  function chg(k: string): number {
    const v = g.people[k]?.rel ?? 0;
    const o = snap[k];
    return o === undefined ? 0 : v - o;
  }

  const cells = $derived.by(() => {
    const out: { s: number; hue: number; mark: { trophy: boolean; award: boolean; move: boolean }; cur: boolean; title: string }[] = [];
    const first = 0;
    const last = Math.max(curSeason, 0);
    for (let s = first; s <= last; s++) {
      const recs = everything.filter((r) => r.s === s);
      const rec = recs[recs.length - 1];
      const mark = { trophy: recs.some((r) => r.trophies.length), award: recs.some((r) => r.awards.length), move: recs.length > 1 };
      const coachRec = g.coach.recs.find((r) => r.s === s);
      const hue = rec ? getClub(rec.clubId).color : coachRec && !coachRec.clubId.startsWith('NAT') ? getClub(coachRec.clubId).color : -1;
      const title = rec ? `${START_YEAR + s} ${rec.clubName} · ${rec.leagueName}` : coachRec ? `${START_YEAR + s} ${coachRec.clubName} (${coachRec.role})` : `${START_YEAR + s}`;
      out.push({ s, hue, mark, cur: s === curSeason, title });
    }
    return out;
  });
  const hist = $derived(g.hist);
  const ovrPts = $derived(hist.map((h) => ({ label: `${h.age}세`, value: toNewScale(anchored(h.ovr)) })));
  const valPts = $derived(hist.map((h) => ({ label: `${h.age}세`, value: h.val })));
</script>

<div class="right col" style="gap:var(--s3)">
  <div class="tabbar panel">
    <div class="seg" role="tablist" aria-label="우측 패널">
      {#each [['stats', '스탯'], ['people', '사람'], ['world', '세계'], ['time', '타임라인']] as [k, label]}
        <button class="btn sm" role="tab" aria-selected={rtab === k} class:on={rtab === k} onclick={() => (rtab = k as RTab)}>{label}</button>
      {/each}
    </div>
    <span class="spacer"></span>
    <button class="btn sm" onclick={() => (store.tableOpen = true)}><Icon name="chart" size={14} /> 리그 순위</button>
  </div>
  <div class="body scroll col" style="gap:var(--s3)">
  {#if rtab === 'stats'}
  <div class="panel">
    <div class="panel-h"><span>커리어 스탯 · 평점</span><span class="spacer"></span><div class="seg"><button class="btn sm" class:on={tab === 'f'} onclick={() => (tabSel = 'f')}>1군</button><button class="btn sm" class:on={tab === 'y'} onclick={() => (tabSel = 'y')}>유스·리저브</button></div></div>
    <div class="panel-b col" style="gap:var(--s2)">
      <div class="sum">
        <div><b class="mono">{tot.apps}</b><span>경기</span></div>
        <div><b class="mono">{tot.goals}</b><span>골</span></div>
        <div><b class="mono">{tot.ast}</b><span>도움</span></div>
        <div><b class="mono">{tot.avg ? tot.avg.toFixed(2) : '-'}</b><span>평균 평점</span></div>
        <div><b class="mono">{tot.cs}</b><span>클린시트</span></div>
        {#if tab === 'f'}
          <div><b class="mono">{g.career.trophies.length}</b><span>트로피</span></div>
          <div><b class="mono">{g.career.awards.length}</b><span>개인상</span></div>
          <div><b class="mono">{g.nat.caps}</b><span>A매치</span></div>
        {:else}
          <div><b class="mono">{g.career.yTrophies.length}</b><span>유스 트로피</span></div>
          <div><b class="mono">{g.career.yAwards.length}</b><span>유스 개인상</span></div>
          <div><b class="mono">{g.career.entry.jumps}</b><span>월반</span></div>
        {/if}
      </div>
      <table>
        <thead><tr><th>시즌</th><th>{tab === 'y' ? '팀' : '구단'}</th><th>리그</th><th>경기</th><th>골</th><th>도움</th><th>평점</th></tr></thead>
        <tbody>
          {#each rows as r}
            <tr class:clk={hasReview(r.s, 'player')} tabindex={hasReview(r.s, 'player') ? 0 : -1} onclick={() => openReview(r.s, 'player')} onkeydown={(e) => e.key === 'Enter' && openReview(r.s, 'player')} title={hasReview(r.s, 'player') ? '눌러서 시즌 결산 다시 보기' : ''}><td class="mono">{r.year % 100}/{(r.year + 1) % 100}</td><td class="cl" title={r.clubName}>{r.clubName}</td><td class="lg">{r.leagueName}</td><td class="mono">{r.apps}</td><td class="mono">{r.goals}</td><td class="mono">{r.assists}</td><td class="mono">{r.ratingN ? (r.ratingSum / r.ratingN).toFixed(2) : '-'}</td></tr>
          {:else}
            <tr><td colspan="7" class="muted">{tab === 'f' ? '아직 1군 공식 경기 기록이 없어요.' : '아직 시즌 기록이 없어요.'}</td></tr>
          {/each}
        </tbody>
      </table>
      {#if ratingPts.length >= 2}
        <LineChart points={ratingPts} format={(v) => v.toFixed(2)} />
        <div class="mini-hint">시즌 평균 평점 추이 ({ratings[0].v.toFixed(2)} → {ratings[ratings.length - 1].v.toFixed(2)}) · 마우스를 올려 값을 확인해요</div>
      {/if}
      {#if g.coach.recs.length}
        <b style="font-size:var(--fs-sub);color:var(--muted)">지도 시즌 성적</b>
        <table>
          <thead><tr><th>시즌</th><th>구단</th><th>순위</th><th>목표</th><th>승점</th><th>트로피</th></tr></thead>
          <tbody>{#each [...g.coach.recs].reverse().slice(0, 10) as r}<tr class:clk={hasReview(r.s, 'coach')} tabindex={hasReview(r.s, 'coach') ? 0 : -1} onclick={() => openReview(r.s, 'coach')} onkeydown={(e) => e.key === 'Enter' && openReview(r.s, 'coach')} title={hasReview(r.s, 'coach') ? '눌러서 시즌 결산 다시 보기' : ''}><td class="mono">{r.year % 100}/{(r.year + 1) % 100}</td><td class="cl">{r.clubName}</td><td class="mono">{r.pos || '-'}</td><td class="mono">{r.target || '-'}</td><td class="mono">{r.pts}</td><td>{r.trophies.length ? `트로피 ${r.trophies.length}` : r.fired ? '경질' : '-'}</td></tr>{/each}</tbody>
        </table>
      {/if}
    </div>
  </div>
  {:else if rtab === 'people'}
  <div class="panel">
    <div class="panel-h">가족과 삶</div>
    <div class="panel-b col" style="gap:var(--s2)">
      {#each family as k}
        {@const p = g.people[k]}
        <div class="rl"><span title={p.en}>{p.name}<em>{{ father: '아버지', mother: '어머니', partner: g.life.romance === 'married' ? '배우자' : '연인', child: '자녀', sibling: '형제자매' }[k.replace(/\d+$/, '')]} · {pAge(p)}세{p.job ? ' · ' + p.job : ''}{p.gone ? ' · ' + (p.note || '') : ''}</em></span><div class="gauge"><i style="width:{(p.rel + 100) / 2}%;background:{relColor(p.rel)}"></i></div></div>
      {/each}
      <div class="kv"><span>연애 상태</span><span>{{ single: '솔로', dating: '연애 중', married: '결혼', divorced: '이혼' }[g.life.romance]}{g.life.children ? ` · 자녀 ${g.life.children}명` : ''}</span></div>
      <div class="kv"><span>거주</span><span>{{ dorm: '유스 숙소', family: '가족 집', rent: '임대', own: '자가' }[g.fin.housing]}{g.fin.car ? ' · 차량 ' + g.fin.car : ''}</span></div>
      {#if g.life.mil !== 'none'}<div class="kv"><span>병역</span><span>{{ pending: '미필', serving: '복무 중', done: '복무 완료', exempt: '특례 면제', none: '' }[g.life.mil]}</span></div>{/if}
    </div>
  </div>
  <div class="panel">
    <div class="panel-h">관계 인물</div>
    <div class="panel-b col" style="gap:var(--s2)">
      {#each relList as k}
        {@const p = g.people[k]}
        {@const d = chg(k)}
        <div class="rl" title={whyText(g, `rel.${k}`) || '최근 큰 변화가 없어요'}><span title={p.en}>{p.name}<em>{REL_LABEL[k] ?? p.kind}{p.job && p.kind !== 'fans' ? ' · ' + p.job : ''}{p.pos ? ' · ' + p.pos : ''}{p.kind !== 'fans' ? ' · ' + PERSONA_SHORT[personaOf(p.name)] : ''}</em></span><div class="gauge"><i style="width:{(p.rel + 100) / 2}%;background:{relColor(p.rel)}"></i></div><b class={d > 0.5 ? 'up' : d < -0.5 ? 'down' : 'faint'}><Icon name={d > 0.5 ? 'up' : d < -0.5 ? 'down' : 'flat'} size={12} /></b></div>
      {/each}
    </div>
  </div>
  {:else if rtab === 'world'}
  <div class="panel">
    <div class="panel-h"><Icon name="globe" size={14} /> 세계 소식</div>
    <div class="panel-b col" style="gap:var(--s2)">
      {#each newsList as e}
        <div class="news"><span class="faint mono">{e.w ? yearOf(e.w) : ''}</span><span>{e.title ? `${e.title} · ` : ''}{e.text}</span></div>
      {:else}<div class="muted">아직 소식이 없어요.</div>{/each}
    </div>
  </div>
  <div class="panel">
    <div class="panel-h"><Icon name="trophy" size={14} /> 발롱도르 기록</div>
    <div class="panel-b col" style="gap:var(--s2)">
      {#each [...g.wld.ballon].filter((b) => b.s < curSeason - 1 || (b.s === curSeason - 1 && g.week % 52 >= 25)).reverse() as b}
        <div class="bl"><span class="mono">{b.year}</span><span class="grow">{b.top[0]?.name ?? '-'} <em class="faint">{b.top[0] ? getClub(b.top[0].club).name : ''}</em></span><span class="tag" class:up={b.winnerIsPlayer}>{b.winnerIsPlayer ? '내가 수상' : b.player ? `나 ${b.player}위` : '-'}</span></div>
      {:else}<div class="muted">아직 시상식이 열리지 않았어요.</div>{/each}
    </div>
  </div>
  <div class="panel">
    <div class="panel-h">국제대회</div>
    <div class="panel-b col" style="gap:var(--s2)">
      {#each [...g.wld.tourn].reverse().slice(0, 8) as t}
        <div class="bl"><span class="mono">{t.year}</span><span class="grow">{t.ko} <em class="faint">우승 {t.winner} · 준우승 {t.runner}</em></span>{#if t.player}<span class="tag">{t.player}</span>{/if}</div>
      {:else}<div class="muted">기록된 대회가 없어요.</div>{/each}
      {#if natRecent.length}
        <b style="font-size:var(--fs-sub);color:var(--muted)">내 대표팀 경기</b>
        {#each natRecent as m}
          <div class="bl"><span class="mono">{yearOf(m.w)}</span><span class="grow">{m.comp} <em class="faint">vs {m.opp}</em></span><span class="tag">{m.result === 'W' ? '승' : m.result === 'D' ? '무' : '패'} · {m.mins}'</span></div>
        {/each}
      {/if}
    </div>
  </div>
  {:else}
  <div class="panel">
    <div class="panel-h">커리어 타임라인 <span class="faint" style="font-weight:500">1칸 = 1시즌</span></div>
    <div class="panel-b col" style="gap:var(--s2)">
      <div class="grid">
        {#each cells as c}
          <div class="cell" class:cur={c.cur} style="background:{c.hue >= 0 ? `hsl(${c.hue} 55% 42%)` : 'var(--bg2)'}" title={c.title}>
            {#if c.mark.trophy}<Icon name="trophy" size={12} />{:else if c.mark.award}<Icon name="star" size={12} />{:else if c.mark.move}<Icon name="up" size={12} />{/if}
          </div>
        {/each}
      </div>
      {#if hist.length >= 2}
        <div class="mini-hint">오버롤 추이</div>
        <LineChart points={ovrPts} color="var(--info)" format={(v) => v.toFixed(1)} />
        <div class="mini-hint">시장가치 추이</div>
        <LineChart points={valPts} color="var(--amber)" format={formatMarket} />
        <div class="mini-hint">최고 시장가치 {formatMarket(g.fame.peakValue)} · 현재 {formatMarket(g.fame.value)}</div>
        <div class="mini-hint">누적 이적료 {formatMarket(g.career.feeSum)} · 최고 이적료 {formatMarket(g.career.feeMax)}</div>
      {/if}
      <div class="mini-hint"><CountryBadge code={g.p.country} name /> · 만 {age}세 · {getLeague(getClub(g.p.startClubId).lg0).ko}에서 출발</div>
    </div>
  </div>
  {/if}
  </div>
</div>

<style>
  .right { height: 100%; min-height: 0; }
  .tabbar { display: flex; align-items: center; gap: var(--s2); padding: var(--s2) var(--s3); flex: none; position: sticky; top: 0; z-index: 2; }
  .body { flex: 1; min-height: 0; padding-right: 2px; }
  .sum { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--s2); }
  .sum div { background: var(--panel2); border: 1px solid var(--line); border-radius: var(--r-sm); padding: var(--s1); text-align: center; display: flex; flex-direction: column; }
  .sum b { font-size: 16px; }
  .sum span { font-size: var(--fs-panel); color: var(--muted); }
  table { width: 100%; border-collapse: collapse; font-size: var(--fs-panel); }
  th { text-align: left; color: var(--faint); font-weight: 600; padding: 2px 3px; border-bottom: 1px solid var(--line); }
  td { padding: 3px; border-bottom: 1px solid color-mix(in srgb, var(--line) 50%, transparent); }
  tr.clk { cursor: pointer; }
  tr.clk:hover td { background: color-mix(in srgb, var(--accent) 10%, transparent); }
  .cl { max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lg { max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
  .rl { display: grid; grid-template-columns: 1fr 74px 14px; gap: var(--s2); align-items: center; font-size: var(--fs-sub); }
  .rl span { display: flex; flex-direction: column; line-height: 1.25; overflow: hidden; }
  .rl em { font-style: normal; font-size: var(--fs-panel); color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rl b { display: grid; place-items: center; }
  .news { display: grid; grid-template-columns: 44px 1fr; gap: var(--s2); font-size: var(--fs-sub); line-height: 1.5; }
  .bl { display: flex; align-items: center; gap: var(--s2); font-size: var(--fs-sub); }
  .bl em { font-style: normal; font-size: var(--fs-panel); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(24px, 1fr)); gap: var(--s1); }
  .cell { aspect-ratio: 1; border-radius: var(--r-sm); display: grid; place-items: center; color: #fff; border: 1px solid var(--line); }
  .cell.cur { outline: 2px solid var(--accent); outline-offset: 1px; }
</style>
