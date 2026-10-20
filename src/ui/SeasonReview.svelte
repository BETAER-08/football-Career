<script lang="ts">
  import { store } from './store.svelte';
  import { formatKRW } from './format';
  import type { SeasonReview, TableRow } from '../engine/types';

  const g = $derived(store.game!);
  const r = $derived<SeasonReview | undefined>(g.reviews[store.reviewIdx]);
  let step = $state(0);
  let full = $state(false);
  let tab = $state<'g' | 'a'>('g');

  $effect(() => {
    void store.reviewIdx;
    step = 0;
    full = false;
  });

  const rows = $derived.by((): TableRow[] => {
    if (!r) return [];
    if (full || r.table.length <= 8) return r.table;
    const lo = Math.max(0, r.myIdx - 2);
    const hi = Math.min(r.table.length, r.myIdx + 3);
    return r.table.slice(lo, hi);
  });
  const offset = $derived(r && !full && r.table.length > 8 ? Math.max(0, r.myIdx - 2) : 0);
  const zoneLabel = { champ: '우승', cont: '대륙 대회', down: '강등', '': '' };
  const sgn = (v: number, f = (x: number) => x.toFixed(1)) => (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v));
  const mins = (m: number) => `${Math.round(m / 60)}시간`;
</script>

{#if r}
  <div class="modal-bg" role="presentation">
    <div class="modal rv" role="dialog" tabindex="-1" onkeydown={() => {}}>
      <div class="modal-h">
        <span>{r.year}~{r.year + 1} 시즌 결산 · {r.clubName}</span>
        <span class="spacer"></span>
        <span class="mini-hint">{step + 1} / 3{g.auto ? ' · 8초 뒤 자동으로 닫혀요' : ''}</span>
      </div>
      <div class="modal-b col" style="gap:12px">
        {#if r.role === 'player'}
          {#if step === 0}
            <div class="sec">
              <b>시즌 기록</b>
              <div class="stats">
                <div><b class="mono">{r.rec.apps}</b><span>경기</span></div>
                <div><b class="mono">{r.rec.starts}</b><span>선발</span></div>
                <div><b class="mono">{mins(r.rec.mins)}</b><span>출전 시간</span></div>
                <div><b class="mono">{r.rec.goals}</b><span>골</span></div>
                <div><b class="mono">{r.rec.assists}</b><span>도움</span></div>
                <div><b class="mono">{r.rec.cs}</b><span>클린시트</span></div>
                <div><b class="mono">{r.rec.avg ? r.rec.avg.toFixed(2) : '-'}</b><span>평균 평점</span></div>
                <div><b class="mono">{r.rec.yc} / {r.rec.rc}</b><span>경고 / 퇴장</span></div>
                <div><b class="mono">{r.rec.injDays}일</b><span>부상 일수</span></div>
              </div>
            </div>
            <div class="sec">
              <div class="row"><b>{r.leagueName} 최종 순위표</b><span class="spacer"></span><button class="btn sm" onclick={() => (full = !full)}>{full ? '접기' : '전체 보기'}</button></div>
              <table>
                <tbody>
                  {#each rows as t, i}
                    <tr class:me={t.id === r.table[r.myIdx]?.id} class={t.zone}><td class="mono">{offset + i + 1}</td><td>{t.name}</td><td class="mono">{t.pts}</td><td class="mono">{t.gf - t.ga >= 0 ? '+' : ''}{t.gf - t.ga}</td><td class="z">{zoneLabel[t.zone]}</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if step === 1}
            <div class="sec">
              <div class="row"><b>리그 개인 순위</b><span class="spacer"></span>
                <button class="btn sm" class:on={tab === 'g'} onclick={() => (tab = 'g')}>득점 TOP 10</button>
                <button class="btn sm" class:on={tab === 'a'} onclick={() => (tab = 'a')}>도움 TOP 10</button>
              </div>
              <table>
                <tbody>
                  {#each tab === 'g' ? r.scorers : r.assisters as l, i}
                    <tr class:me={l.me}><td class="mono">{i + 1}</td><td>{l.name}</td><td class="faint">{l.club}</td><td class="mono">{l.v}</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <div class="sec">
              <b>시상</b>
              {#if r.awards.length}
                {#each r.awards as a}<div class="award">🏅 {a.name}<span class="tag">{a.scope === 'club' ? '구단' : '리그'}</span></div>{/each}
              {:else}<div class="muted">이번 시즌에는 수상이 없었어요.</div>{/if}
              {#if r.clubPoy.length}
                <div class="mini-hint">구단 평점 순위: {r.clubPoy.map((p, i) => `${i + 1}. ${p.name} ${p.rating.toFixed(2)}`).join(' · ')}</div>
              {/if}
              {#each r.trophies as t}<div class="award">🏆 {t}</div>{/each}
            </div>
            <div class="sec"><b>시즌 베스트 장면</b><div class="best">{r.best}</div></div>
          {:else}
            <div class="sec">
              <b>변화 요약 <span class="faint" style="font-weight:500">시즌 시작 대비</span></b>
              <div class="stats four">
                <div><b class="mono" class:up={r.change.ovr > 0} class:down={r.change.ovr < 0}>{sgn(r.change.ovr)}</b><span>오버롤</span></div>
                <div><b class="mono" class:up={r.change.val > 0} class:down={r.change.val < 0}>{r.change.val >= 0 ? '+' : '−'}{formatKRW(Math.abs(r.change.val))}</b><span>시장가치</span></div>
                <div><b class="mono" class:up={r.change.wage > 0} class:down={r.change.wage < 0}>{r.change.wage >= 0 ? '+' : '−'}{formatKRW(Math.abs(r.change.wage))}</b><span>연봉</span></div>
                <div><b class="mono" class:up={r.change.fame > 0} class:down={r.change.fame < 0}>{sgn(r.change.fame)}</b><span>명성</span></div>
              </div>
            </div>
            {#if r.goals.length}
              <div class="sec"><b>이번 시즌 목표</b>
                {#each r.goals as gl}<div class="goal"><span class={gl.done ? 'up' : 'down'}>{gl.done ? '달성 ✓' : '미달 ✗'}</span> {gl.label} <span class="faint">· {gl.reward}</span></div>{/each}
              </div>
            {/if}
            {#if r.next.club}
              <div class="sec next"><b>다음 시즌 목표</b>
                <div>구단 기대 · {r.next.club}</div>
                <div>개인 목표 · {r.next.personal}</div>
              </div>
            {/if}
          {/if}
        {:else if r.coach}
          {#if step === 0}
            <div class="sec">
              <b>팀 성적</b>
              <div class="stats four">
                <div><b class="mono">{r.pos}위</b><span>{r.n}팀 중</span></div>
                <div><b class="mono">{r.coach.target}위</b><span>목표</span></div>
                <div><b class="mono">{r.coach.pts}</b><span>승점</span></div>
                <div><b class="mono">{r.trophies.length ? '★' + r.trophies.length : '-'}</b><span>트로피</span></div>
              </div>
              <div class="muted">목표 대비 {r.coach.target - r.pos >= 0 ? `${r.coach.target - r.pos}계단 위` : `${r.pos - r.coach.target}계단 아래`}에서 시즌을 마쳤다.</div>
            </div>
            <div class="sec">
              <div class="row"><b>{r.leagueName} 최종 순위표</b><span class="spacer"></span><button class="btn sm" onclick={() => (full = !full)}>{full ? '접기' : '전체 보기'}</button></div>
              <table><tbody>
                {#each rows as t, i}
                  <tr class:me={t.id === r.table[r.myIdx]?.id} class={t.zone}><td class="mono">{offset + i + 1}</td><td>{t.name}</td><td class="mono">{t.pts}</td><td class="mono">{t.gf - t.ga >= 0 ? '+' : ''}{t.gf - t.ga}</td><td class="z">{zoneLabel[t.zone]}</td></tr>
                {/each}
              </tbody></table>
            </div>
          {:else if step === 1}
            <div class="sec"><b>선수단 MVP</b><div class="best">{r.coach.mvp}이(가) 시즌 내내 팀의 중심이었다.</div></div>
            {#each r.trophies as t}<div class="award">🏆 {t}</div>{/each}
          {:else}
            <div class="sec"><b>변화 요약</b>
              <div class="stats four">
                <div><b class="mono" class:up={r.coach.standingDelta > 0} class:down={r.coach.standingDelta < 0}>{sgn(r.coach.standingDelta)}</b><span>입지 변화</span></div>
                <div><b class="mono">{Math.round(r.coach.standing)}</b><span>현재 입지</span></div>
                <div><b class="mono" class:up={r.change.fame > 0} class:down={r.change.fame < 0}>{sgn(r.change.fame)}</b><span>명성</span></div>
              </div>
            </div>
          {/if}
        {/if}
        <div class="row">
          <button class="btn" disabled={step === 0} onclick={() => (step -= 1)}>이전</button>
          <span class="spacer"></span>
          {#if step < 2}
            <button class="btn primary" onclick={() => (step += 1)}>다음</button>
          {:else}
            <button class="btn primary" onclick={() => store.closeReview()}>닫고 계속하기</button>
          {/if}
          {#if step < 2}<button class="btn ghost" onclick={() => store.closeReview()}>닫기</button>{/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .rv { max-width: 640px; width: 94vw; }
  .sec { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel2); }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .stats.four { grid-template-columns: repeat(4, 1fr); }
  .stats div { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 6px; text-align: center; display: flex; flex-direction: column; }
  .stats b { font-size: 17px; }
  .stats span { font-size: 11px; color: var(--muted); }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  td { padding: 3px 6px; border-bottom: 1px solid color-mix(in srgb, var(--line) 50%, transparent); }
  tr.me td { background: color-mix(in srgb, var(--accent) 18%, transparent); font-weight: 800; }
  tr.champ td:first-child { color: var(--amber); }
  tr.cont td.z { color: var(--info); }
  tr.down td.z { color: var(--down); }
  .z { text-align: right; font-size: 11px; }
  .award { font-size: 13px; display: flex; gap: 8px; align-items: center; }
  .best { line-height: 1.7; font-size: 13.5px; }
  .goal { font-size: 13px; }
  .next { border-color: var(--accent); }
</style>
