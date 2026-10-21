<script lang="ts">
  import { store } from './store.svelte';
  import { getClub, getLeague, getCountry } from '../engine/data';
  import { clubLeagueId, positionOf, ranking } from '../engine/world';
  import { ROLE_LABEL } from '../engine/types';
  import { formatKRW, netWorth, currentWage } from '../engine/finance';
  import { dateOf, fmtDate, ageAt } from '../engine/time';
  import { healthLabel } from '../engine/health';
  import { roleLabel as coachRoleLabel } from '../engine/coach';
  import { whyText } from './format';
  import { goalValue } from '../engine/goals';
  import { youthRank } from '../engine/yleague';
  import { captionOf } from './caption';
  import { schoolInfo } from '../engine/school';
  import { STAGE_LABEL } from '../engine/stages';
  import { DREAM_LABEL } from '../engine/goals';
  import { nextWindowText, REQ_DIR_TEXT } from '../engine/market';
  import { STAGE_TEXT } from '../engine/natsel';
  import { nextWindowW, windowNow } from '../engine/calendar';

  const g = $derived(store.game!);
  const idc = $derived(g.phase === 'coach' ? g.coach.clubId : g.career.clubId);
  const club = $derived(idc ? getClub(idc) : null);
  const lgId = $derived(idc ? clubLeagueId(g, idc) : '');
  const lg = $derived(lgId ? getLeague(lgId) : null);
  const rt = $derived(lgId ? g.world.leagues[lgId] : undefined);
  const rank = $derived(idc && rt ? positionOf(g, lgId, idc) : 0);
  const total = $derived(rt ? rt.order.length : 0);
  const con = $derived(g.phase === 'coach' ? g.coach.contract : g.career.contract);
  const form = $derived(g.st.form.length ? g.st.form.reduce((a, b) => a + b, 0) / g.st.form.length : 0);
  const cur = $derived(g.career.cur);
  const weeksLeft = $derived(con ? Math.max(0, con.endW - g.week) : 0);
  const retDate = $derived(g.st.injury ? fmtDate(dateOf(g.week + Math.ceil(g.st.injury.weeksLeft))) : '');
  const wage = $derived(currentWage(g));
  const months = $derived(Math.round(weeksLeft / 4.345));
  const isFA = $derived(g.phase === 'pro' && !g.career.clubId && g.career.signed && !g.career.retired);
  const faWeeks = $derived(isFA && g.career.freeAgentW >= 0 ? g.week - g.career.freeAgentW : 0);
  const reqOn = $derived(g.career.transferReq >= 0);
  const reqText = $derived(reqOn ? (windowNow(g) ? `이적 요청 중 · 이적시장 열림 (${g.career.reqStance === 'refused' ? '구단 거절' : '구단 수용'}) · ${REQ_DIR_TEXT[g.career.reqDir]}` : `이적 요청 중 · 다음 이적시장 ${fmtDate(dateOf(nextWindowW(g)))} (${g.career.reqStance === 'refused' ? '구단 거절' : '구단 수용'}) · ${REQ_DIR_TEXT[g.career.reqDir]}`) : '없음');
  const preText = $derived(g.career.pre ? `${getClub(g.career.pre.clubId).name} (시즌 종료 후 합류)` : weeksLeft > 0 && weeksLeft <= 26 ? '가능 (잔여 6개월 이하)' : '불가 (잔여 6개월 이하부터)');
  const target = $derived(g.coach.tableTarget);
  const yt = $derived(g.phase === 'youth' ? g.yt : null);
  const yRank = $derived(yt ? youthRank(g) : 0);
  const yc = $derived(g.career.yCur);
  const yAvg = $derived(yc.ratingN ? (yc.ratingSum / yc.ratingN).toFixed(1) : '-');
  const entry = $derived(g.career.entry);
  const entryText = $derived(g.career.debuted ? '1군 데뷔 완료' : entry.step >= 2 ? `1군 명단 ${entry.squadN}회${g.career.signed ? '' : ' (프로 계약 필요)'}` : entry.step === 1 ? '1군 훈련 합류' : '아직 1군 접점 없음');
  const sch = $derived(g.career.track === 'school' && g.career.clubId ? schoolInfo(g.career.clubId) : null);
  const statusText = $derived(g.career.track === 'school' ? (g.career.youthStage === 'HS' ? '고교 축구부' : '대학 축구부') : g.career.signed ? '프로 계약' : g.career.scholar === 1 ? '장학 계약' : '계약 없음');
  const tone = (v: number, inv = false) => ((inv ? 100 - v : v) < 30 ? 'bad' : (inv ? 100 - v : v) < 55 ? 'warn' : '');
  void ranking;
  void getCountry;
  void ageAt;
</script>

<div class="panel">
  <div class="cap">{captionOf(g)}</div>
  <div class="grid">
    <div class="col" style="gap:5px">
      <div class="h">현재 팀</div>
      {#if g.phase === 'postcareer' && !club}
        <div class="big">{{ none: '무직', pundit: '해설·방송', admin: '구단 행정', business: '사업', left: '축구계 이탈' }[g.post.path]}</div>
        {#if g.post.path === 'admin'}<div class="muted">{{ '': '', scout: '스카우트', td: '테크니컬 디렉터', gm: '단장' }[g.post.adminRole]}</div>{/if}
        <div class="kv"><span>전문성</span><span class="mono">{Math.round(g.post.skill)}</span></div>
        <div class="kv"><span>평판</span><span class="mono">{Math.round(g.post.rep)}</span></div>
      {:else if g.phase === 'coach' && g.coach.role === 'national'}
        <div class="big">{getCountry(g.coach.natCountry).natTeam}</div>
        <div class="muted">국가대표 감독 · 입지 {Math.round(g.coach.standing)}</div>
      {:else if g.phase === 'youth' && club && yt}
        <div class="big">{club.name} {STAGE_LABEL[g.career.youthStage]}</div>
        <div class="muted">{yt.name}{yRank ? ` · ${yRank}위/${yt.ids.length}팀` : ''}</div>
        <div class="kv"><span>감독</span><span title={g.people.coach.en}>{g.people.coach.name}</span></div>
        <div class="kv"><span>성향</span><span>{g.people.coach.style}</span></div>
        <div class="kv"><span>유스 기록</span><span class="mono">{yc.apps}경기 {yc.goals}골 {yc.assists}도움 · 평점 {yAvg}</span></div>
        {#if sch}<div class="kv"><span>학교 등급</span><span>{['명문', '중위', '약체'][sch.tier]} · 학력 {['중졸', '고졸', '대학 재학', '대졸'][Math.min(3, g.life.eduLevel)]}</span></div>{:else}<div class="kv"><span>1군 진입</span><span>{entryText}</span></div>{/if}
        {#if g.career.entry.jumps > 0}<div class="kv"><span>월반</span><span class="mono">{g.career.entry.jumps}회</span></div>{/if}
      {:else if club && lg}
        <div class="big">{club.name}</div>
        <div class="muted">{lg.ko}{rank ? ` · ${rank}위/${total}팀` : ''}{g.phase === 'coach' && target ? ` · 목표 ${target}위` : ''}</div>
        {#if g.phase === 'coach'}
          <div class="kv"><span>직책</span><span>{coachRoleLabel(g.coach.role)}</span></div>
          <div class="kv"><span>입지</span><span class="mono">{Math.round(g.coach.standing)}</span></div>
          <div class="kv"><span>임원</span><span>{g.people.director?.name ?? '-'} · {g.people.owner?.name ?? '-'}</span></div>
        {:else}
          <div class="kv"><span>감독</span><span title={g.people.coach.en}>{g.people.coach.name}</span></div>
          <div class="kv"><span>성향</span><span>{g.people.coach.style}</span></div>
          <div class="kv"><span>역할</span><span>{con ? ROLE_LABEL[con.role] : '유망주'}</span></div>
          <div class="kv"><span>이번 시즌</span><span class="mono">{cur.apps}경기 {cur.goals}골 {cur.assists}도움 · {cur.starts}선발</span></div>
        {/if}
      {:else if isFA}
        <div class="big">자유계약(FA)</div>
        <div class="muted">무적 {faWeeks}주 · 새 소속팀을 기다리는 중</div>
      {:else}
        <div class="big">무적</div>
        <div class="muted">새 소속팀을 기다리는 중</div>
      {/if}
    </div>

    <div class="col" style="gap:5px">
      <div class="h">현재 상태</div>
      {#if g.st.injury}
        <div class="inj">🩹 {g.st.injury.ko} ({g.st.injury.part}) · 복귀 예정 {retDate}</div>
      {/if}
      {#each [['건강', g.st.health, false, 'health'], ['피로', g.st.fatigue, true, 'fatigue'], ['폼', Math.min(100, Math.max(0, (form - 4) * 25)), false, ''], ['경기 감각', g.st.sharp, false, 'sharp'], ['사기', g.st.morale, false, 'morale'], ['행복', g.st.happy, false, 'happy'], ['스트레스', g.st.stress, true, 'stress']] as [label, v, inv, key]}
        <div class="gr" title={key ? whyText(g, `st.${key}`) || '최근 큰 변화가 없어요' : '최근 5경기 평균 평점'}><span>{label}</span><div class="gauge {tone(v as number, inv as boolean)}"><i style="width:{v}%"></i></div><b class="mono">{label === '폼' ? (form ? form.toFixed(1) : '-') : Math.round(v as number)}</b></div>
      {/each}
      <div class="mini-hint">건강 {healthLabel(g.st.health)}{g.st.burnout > 50 ? ' · 번아웃 위험' : ''}</div>
      {#if g.goals && !g.goals.settled && (g.phase === 'pro' || g.phase === 'youth')}
        {#each [{ lab: '구단 기대', gd: g.goals.club }, { lab: '개인 목표', gd: g.goals.personal }] as { lab, gd }}
          {@const v = goalValue(g, gd)}
          <div class="goal" title="시즌 결산에서 달성 여부와 보상을 처리해요"><span>{lab} · {gd.label}</span><div class="gauge"><i style="width:{Math.min(100, (v / gd.target) * 100)}%"></i></div><b class="mono">{gd.metric === 'rating' || gd.metric === 'resrating' ? v.toFixed(1) : Math.round(v)}/{gd.target}</b></div>
        {/each}
      {/if}
      {#if g.dream}<div class="mini-hint">✦ 꿈 · {DREAM_LABEL[g.dream]}{g.dreamHits.includes(g.dream) ? ' (이룰 조짐!)' : ''}</div>{/if}
    </div>

    <div class="col" style="gap:5px">
      <div class="h">수입 · 자산</div>
      <div class="kv"><span>연봉</span><span class="mono">{formatKRW(wage)}</span></div>
      <div class="kv"><span>주급</span><span class="mono">{formatKRW(wage / 52)}</span></div>
      {#if g.phase === 'pro' && con}<div class="kv"><span>보너스</span><span class="mono">출전 {formatKRW(con.appBonus)} · 득점 {formatKRW(con.goalBonus)}</span></div>{/if}
      <div class="kv"><span>스폰서</span><span class="mono">{formatKRW(g.fin.sponsorYear)}/년</span></div>
      <div class="kv"><span>연 소득</span><span class="mono">{formatKRW(g.fin.yearIncome || g.fin.yearIncomeAcc)}</span></div>
      <div class="kv"><span>시장가치</span><span class="mono">{formatKRW(g.fame.value)}</span></div>
      <div class="kv"><span>순자산</span><span class="mono up">{formatKRW(netWorth(g))}</span></div>
      <div class="kv"><span>현금 · 부채</span><span class="mono">{formatKRW(g.fin.cash)}{g.fin.debt ? ` · -${formatKRW(g.fin.debt)}` : ''}</span></div>
    </div>

    <div class="col" style="gap:5px">
      <div class="h">계약 상태</div>
      {#if con && (g.phase === 'pro' || g.phase === 'coach')}
        <div class="kv"><span>남은 기간</span><span class="mono">{months}개월 ({Math.floor(weeksLeft / 52)}년 {Math.round((weeksLeft % 52) / 4.3)}개월)</span></div>
        {#if g.phase === 'pro'}
          <div class="kv"><span>이적시장</span><span>{nextWindowText(g)}</span></div>
          <div class="kv"><span>사전 계약</span><span>{preText}</span></div>
          <div class="kv"><span>이적 요청</span><span>{reqText}</span></div>
          <div class="kv"><span>약속 역할</span><span>{ROLE_LABEL[g.career.promisedRole]}</span></div>
          <div class="kv"><span>바이아웃</span><span class="mono">{con.buyout ? formatKRW(con.buyout) : '없음'}</span></div>
          <div class="kv"><span>출전 보너스</span><span class="mono">{cur.apps}경기 / 선발 {cur.starts}</span></div>
          {#if con.loanFrom}<div class="kv"><span>임대</span><span>{getClub(con.loanFrom).name} 소속</span></div>{/if}
        {/if}
        {#if g.life.mil === 'serving'}<div class="tag">병역 이행 중</div>{/if}
        {#if g.ev.flags.wage_unpaid !== undefined}<div class="tag" style="color:var(--down)">임금 체불 중</div>{/if}
      {:else if g.phase === 'youth'}
        <div class="kv"><span>소속 단계</span><span>{STAGE_LABEL[g.career.youthStage]}</span></div>
        <div class="kv"><span>계약</span><span>{statusText}</span></div>
        {#if (g.career.scholar === 1 || g.career.signed) && con && con.wage > 0}<div class="kv"><span>{g.career.signed ? '연봉' : '장학 수당'}</span><span class="mono">{formatKRW(con.wage)}</span></div>{/if}
        {#if g.career.signed && con}<div class="kv"><span>남은 기간</span><span class="mono">{Math.floor(weeksLeft / 52)}년 {Math.round((weeksLeft % 52) / 4.3)}개월</span></div>{/if}
        <div class="mini-hint">시즌 말마다 승급·잔류·방출 심사를 받아요. 1군 훈련 합류 → 명단 등록 → 프로 계약 후 데뷔 순서로 1군에 다가가요.{g.career.track === 'school' ? ' 학교 경로에서는 시즌 말 프로 입단 제안으로 프로에 합류해요.' : ''}</div>
      {:else if isFA}
        <div class="kv"><span>상태</span><span>자유계약(FA)</span></div>
        <div class="kv"><span>무적 기간</span><span class="mono">{faWeeks}주</span></div>
        <div class="mini-hint">이적시장이 닫혀 있어도 계약할 수 있어요. 무적 기간이 길어질수록 제안 수준과 연봉이 떨어지고 경기 감각이 무뎌져요.</div>
      {:else}
        <div class="muted">계약 없음</div>
      {/if}
      {#if g.phase === 'pro' && g.career.clubId}
        <div class="kv" title={g.nat.lastWhy.length ? `최근 탈락 이유: ${g.nat.lastWhy.join(' / ')}` : '대표팀 선발 점수는 실력·소속팀 수준·출전 시간·폼·이력·몸 상태·나이로 정해져요'}><span>대표팀 상태</span><span>{STAGE_TEXT[g.nat.stage]}{g.nat.lastWhy.length && g.nat.stage !== 'called' && g.nat.stage !== 'starter' ? ` · ${g.nat.lastWhy[0]}` : ''}</span></div>
      {/if}
      {#if g.nat.caps > 0 || g.nat.youthCaps > 0}
        <div class="kv"><span>대표팀</span><span class="mono">A매치 {g.nat.caps}경기 {g.nat.goals}골{g.nat.youthCaps ? ` · 연령별 ${g.nat.youthCaps}` : ''}</span></div>
      {/if}
    </div>
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: 1.15fr 1fr 1fr 1fr; gap: 16px; padding: 12px 14px; }
  .cap { padding: 8px 14px 0; font-size: 12.5px; color: var(--muted); }
  .h { font-size: 11px; font-weight: 800; color: var(--faint); letter-spacing: 0.05em; }
  .big { font-size: 17px; font-weight: 800; line-height: 1.2; }
  .gr { display: grid; grid-template-columns: 56px 1fr 30px; gap: 8px; align-items: center; font-size: 12px; }
  .gr span { color: var(--muted); }
  .gr b { text-align: right; }
  .goal { display: grid; grid-template-columns: 1fr 70px 46px; gap: 6px; align-items: center; font-size: 11.5px; color: var(--muted); }
  .goal span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .goal b { text-align: right; color: var(--text); }
  .inj { font-size: 12px; background: color-mix(in srgb, var(--down) 14%, var(--panel)); border: 1px solid color-mix(in srgb, var(--down) 40%, var(--line)); border-radius: 6px; padding: 3px 8px; }
  .kv { gap: 8px; white-space: nowrap; }
  .kv span:last-child { text-align: right; }
  @media (max-width: 1439px) { .grid { grid-template-columns: 1fr 1fr; } }
</style>
