<script lang="ts">
  import { store } from './store.svelte';
  import { getClub, getLeague, getCountry } from '../engine/data';
  import { START_YEAR, ageAt, seasonOf, yearOf } from '../engine/time';
  import { formatKRW } from '../engine/finance';
  import { REL_LABEL } from '../engine/fx';
  import type { Person, SeasonRec } from '../engine/types';
  import { whyText } from './format';

  function openReview(sn: number, role: 'player' | 'coach') {
    const i = g.reviews.findIndex((x) => x.s === sn && x.role === role);
    if (i >= 0) store.openReviewAt(i);
  }
  const hasReview = (sn: number, role: 'player' | 'coach') => g.reviews.some((x) => x.s === sn && x.role === role);

  const g = $derived(store.game!);
  const age = $derived(ageAt(g.p.birth, g.week));
  const curSeason = $derived(seasonOf(g.week));
  const all = $derived<SeasonRec[]>([...g.career.seasons, ...(g.career.cur.done || (!g.career.cur.apps && !g.career.cur.mins) ? [] : [g.career.cur])]);
  const tot = $derived.by(() => {
    let apps = 0, goals = 0, ast = 0, rs = 0, rn = 0, cs = 0;
    for (const r of all) { apps += r.apps; goals += r.goals; ast += r.assists; rs += r.ratingSum; rn += r.ratingN; cs += r.cs; }
    return { apps, goals, ast, avg: rn ? rs / rn : 0, cs };
  });
  const rows = $derived([...all].reverse().slice(0, 14));
  const ratings = $derived(all.filter((r) => r.ratingN > 3).map((r) => ({ y: r.year, v: r.ratingSum / r.ratingN })));

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
    const out: { s: number; hue: number; mark: string; cur: boolean; title: string }[] = [];
    const first = 0;
    const last = Math.max(curSeason, 0);
    for (let s = first; s <= last; s++) {
      const recs = all.filter((r) => r.s === s);
      const rec = recs[recs.length - 1];
      let mark = '';
      if (recs.some((r) => r.trophies.length)) mark += '★';
      if (recs.some((r) => r.awards.length)) mark += '◆';
      if (recs.length > 1) mark += '↗';
      const coachRec = g.coach.recs.find((r) => r.s === s);
      const hue = rec ? getClub(rec.clubId).color : coachRec && !coachRec.clubId.startsWith('NAT') ? getClub(coachRec.clubId).color : -1;
      const title = rec ? `${START_YEAR + s} ${rec.clubName} · ${rec.leagueName}` : coachRec ? `${START_YEAR + s} ${coachRec.clubName} (${coachRec.role})` : `${START_YEAR + s}`;
      out.push({ s, hue, mark, cur: s === curSeason, title });
    }
    return out;
  });
  const hist = $derived(g.hist);
  function path(vals: number[], w: number, h: number): string {
    if (vals.length < 2) return '';
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const sp = Math.max(1e-6, mx - mn);
    return vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i / (vals.length - 1)) * w},${h - ((v - mn) / sp) * (h - 4) - 2}`).join(' ');
  }
</script>

<div class="right scroll col" style="gap:10px">
  <div class="panel">
    <div class="panel-h"><span>커리어 스탯 · 평점</span><span class="spacer"></span><button class="btn sm" onclick={() => (store.tableOpen = true)}>리그 순위</button></div>
    <div class="panel-b col" style="gap:8px">
      <div class="sum">
        <div><b class="mono">{tot.apps}</b><span>경기</span></div>
        <div><b class="mono">{tot.goals}</b><span>골</span></div>
        <div><b class="mono">{tot.ast}</b><span>도움</span></div>
        <div><b class="mono">{tot.avg ? tot.avg.toFixed(2) : '-'}</b><span>평균 평점</span></div>
        <div><b class="mono">{tot.cs}</b><span>클린시트</span></div>
        <div><b class="mono">{g.career.trophies.length}</b><span>트로피</span></div>
        <div><b class="mono">{g.career.awards.length}</b><span>개인상</span></div>
        <div><b class="mono">{g.nat.caps}</b><span>A매치</span></div>
      </div>
      <table>
        <thead><tr><th>시즌</th><th>구단</th><th>리그</th><th>경기</th><th>골</th><th>도움</th><th>평점</th></tr></thead>
        <tbody>
          {#each rows as r}
            <tr class:clk={hasReview(r.s, 'player')} onclick={() => openReview(r.s, 'player')} title={hasReview(r.s, 'player') ? '눌러서 시즌 결산 다시 보기' : ''}><td class="mono">{r.year % 100}/{(r.year + 1) % 100}</td><td class="cl" title={r.clubName}>{r.clubName}</td><td class="lg">{r.leagueName}</td><td class="mono">{r.apps}</td><td class="mono">{r.goals}</td><td class="mono">{r.assists}</td><td class="mono">{r.ratingN ? (r.ratingSum / r.ratingN).toFixed(1) : '-'}</td></tr>
          {:else}
            <tr><td colspan="7" class="muted">아직 시즌 기록이 없어요.</td></tr>
          {/each}
        </tbody>
      </table>
      {#if ratings.length >= 2}
        <svg viewBox="0 0 320 60" class="chart"><path d={path(ratings.map((r) => r.v), 320, 60)} fill="none" stroke="var(--accent)" stroke-width="2" />
          {#each ratings as r, i}<circle cx={(i / (ratings.length - 1)) * 320} cy={60 - ((r.v - Math.min(...ratings.map((x) => x.v))) / Math.max(1e-6, Math.max(...ratings.map((x) => x.v)) - Math.min(...ratings.map((x) => x.v)))) * 56 - 2} r="2.5" fill="var(--accent)" />{/each}
        </svg>
        <div class="mini-hint">시즌 평균 평점 추이 ({ratings[0].v.toFixed(1)} → {ratings[ratings.length - 1].v.toFixed(1)})</div>
      {/if}
      {#if g.coach.recs.length}
        <b style="font-size:12px;color:var(--muted)">지도 시즌 성적</b>
        <table>
          <thead><tr><th>시즌</th><th>구단</th><th>순위</th><th>목표</th><th>승점</th><th>트로피</th></tr></thead>
          <tbody>{#each [...g.coach.recs].reverse().slice(0, 10) as r}<tr class:clk={hasReview(r.s, 'coach')} onclick={() => openReview(r.s, 'coach')} title={hasReview(r.s, 'coach') ? '눌러서 시즌 결산 다시 보기' : ''}><td class="mono">{r.year % 100}/{(r.year + 1) % 100}</td><td class="cl">{r.clubName}</td><td class="mono">{r.pos || '-'}</td><td class="mono">{r.target || '-'}</td><td class="mono">{r.pts}</td><td>{r.trophies.length ? '★' + r.trophies.length : r.fired ? '경질' : '-'}</td></tr>{/each}</tbody>
        </table>
      {/if}
    </div>
  </div>

  <div class="panel">
    <div class="panel-h">가족과 삶</div>
    <div class="panel-b col" style="gap:7px">
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
    <div class="panel-b col" style="gap:7px">
      {#each relList as k}
        {@const p = g.people[k]}
        {@const d = chg(k)}
        <div class="rl" title={whyText(g, `rel.${k}`) || '최근 큰 변화가 없어요'}><span title={p.en}>{p.name}<em>{REL_LABEL[k] ?? p.kind}{p.job && p.kind !== 'fans' ? ' · ' + p.job : ''}{p.pos ? ' · ' + p.pos : ''}</em></span><div class="gauge"><i style="width:{(p.rel + 100) / 2}%;background:{relColor(p.rel)}"></i></div><b class={d > 0.5 ? 'up' : d < -0.5 ? 'down' : 'faint'}>{d > 0.5 ? '▲' : d < -0.5 ? '▼' : '·'}</b></div>
      {/each}
    </div>
  </div>

  <div class="panel">
    <div class="panel-h">커리어 타임라인 <span class="faint" style="font-weight:500">1칸 = 1시즌</span></div>
    <div class="panel-b col" style="gap:8px">
      <div class="grid">
        {#each cells as c}
          <div class="cell" class:cur={c.cur} style="background:{c.hue >= 0 ? `hsl(${c.hue} 55% 42%)` : 'var(--bg2)'}" title={c.title}><span>{c.mark}</span></div>
        {/each}
      </div>
      {#if hist.length >= 2}
        <div class="mini-hint">오버롤 추이 · 시장가치 추이</div>
        <svg viewBox="0 0 320 54" class="chart"><path d={path(hist.map((h) => h.ovr), 320, 54)} fill="none" stroke="var(--info)" stroke-width="2" /></svg>
        <svg viewBox="0 0 320 54" class="chart"><path d={path(hist.map((h) => h.val), 320, 54)} fill="none" stroke="var(--amber)" stroke-width="2" /></svg>
        <div class="mini-hint">최고 시장가치 {formatKRW(g.fame.peakValue)} · 현재 {formatKRW(g.fame.value)}</div>
      {/if}
      <div class="mini-hint">{getCountry(g.p.country).ko} · 만 {age}세 · {getLeague(getClub(g.p.startClubId).lg0).ko}에서 출발</div>
    </div>
  </div>
</div>

<style>
  .right { height: 100%; padding-right: 2px; }
  .sum { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .sum div { background: var(--panel2); border: 1px solid var(--line); border-radius: 8px; padding: 5px 4px; text-align: center; display: flex; flex-direction: column; }
  .sum b { font-size: 16px; }
  .sum span { font-size: 10.5px; color: var(--muted); }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  th { text-align: left; color: var(--faint); font-weight: 600; padding: 2px 3px; border-bottom: 1px solid var(--line); }
  td { padding: 3px; border-bottom: 1px solid color-mix(in srgb, var(--line) 50%, transparent); }
  tr.clk { cursor: pointer; }
  tr.clk:hover td { background: color-mix(in srgb, var(--accent) 10%, transparent); }
  .cl { max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lg { max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
  .chart { width: 100%; height: 54px; background: var(--bg2); border-radius: 6px; }
  .rl { display: grid; grid-template-columns: 1fr 74px 12px; gap: 8px; align-items: center; font-size: 12.5px; }
  .rl span { display: flex; flex-direction: column; line-height: 1.25; overflow: hidden; }
  .rl em { font-style: normal; font-size: 11px; color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rl b { font-size: 10px; text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(22px, 1fr)); gap: 3px; }
  .cell { aspect-ratio: 1; border-radius: 4px; display: grid; place-items: center; font-size: 9px; color: #fff; border: 1px solid var(--line); }
  .cell.cur { outline: 2px solid var(--accent); outline-offset: 1px; }
</style>
