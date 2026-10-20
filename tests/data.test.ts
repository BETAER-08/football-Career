import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../src/data/countries';
import { LEAGUES_BY_COUNTRY } from '../src/data/leagues';
import { CITIES } from '../src/data/cities';
import { NAME_POOLS } from '../src/data/names';
import { ALL_EVENTS } from '../src/data/events';
import { ALL_ACTIONS } from '../src/data/actions';
import { EventSchema } from '../src/data/schema';
import { countClubs, leaguesOf } from '../src/engine/data';
import { ensureContent } from '../src/engine/content';
import { allEventDefs } from '../src/engine/events';
import { allActions } from '../src/engine/actions';

describe('데이터 검증', () => {
  it('34개국과 국가별 리그 피라미드가 있다', () => {
    expect(COUNTRIES.length).toBe(34);
    for (const c of COUNTRIES) {
      const ls = LEAGUES_BY_COUNTRY[c.code];
      expect(ls.length).toBeGreaterThanOrEqual(2);
      const lvls = new Set<number>();
      for (const l of ls) {
        lvls.add(l.lvl);
        if (l.elite) lvls.add(l.lvl + 1);
        expect(l.clubs.split(';').length).toBeGreaterThanOrEqual(10);
      }
      expect(Math.max(...lvls)).toBe(c.top);
      for (let L = 2; L <= c.top; L++) expect(lvls.has(L)).toBe(true);
    }
  });
  it('국가별 도시 6~12개, 이름 풀 100개 이상', () => {
    for (const c of COUNTRIES) {
      expect(CITIES[c.code].length).toBeGreaterThanOrEqual(6);
      expect(CITIES[c.code].length).toBeLessThanOrEqual(12);
      expect(NAME_POOLS[c.code].given.length).toBeGreaterThanOrEqual(100);
      expect(NAME_POOLS[c.code].surname.length).toBeGreaterThanOrEqual(100);
      for (const [en, ko] of NAME_POOLS[c.code].given.slice(0, 20)) {
        expect(en.length).toBeGreaterThan(0);
        expect(/[가-힣]/.test(ko)).toBe(true);
      }
    }
  });
  it('구단 수 집계', () => {
    let total = 0;
    for (const c of COUNTRIES) total += countClubs(c.code).clubs;
    expect(total).toBeGreaterThan(1500);
    expect(leaguesOf('GB')[0].clubIds.length).toBe(20);
  });
  it('이벤트와 행동이 스키마와 효과 문법을 통과한다', () => {
    for (const e of ALL_EVENTS) EventSchema.parse(e);
    ensureContent();
    expect(allEventDefs().length).toBe(ALL_EVENTS.length);
    expect(allActions().length).toBe(ALL_ACTIONS.length);
    for (const e of allEventDefs()) expect(e.text.length).toBeGreaterThanOrEqual(2);
  });
  it('최소 콘텐츠 수를 충족한다', () => {
    ensureContent();
    const defs = allEventDefs();
    const count = (f: (e: (typeof defs)[number]) => boolean) => defs.filter(f).length;
    const pl = (e: (typeof defs)[number]) => e.phase.includes('youth') || e.phase.includes('pro');
    const hasC = (e: (typeof defs)[number]) => !!(e.choices && e.choices.length);
    expect(count((e) => e.kind === 'passive' && pl(e))).toBeGreaterThanOrEqual(80);
    expect(count((e) => e.kind === 'choice' && pl(e))).toBeGreaterThanOrEqual(90);
    expect(count((e) => e.kind === 'moment')).toBeGreaterThanOrEqual(12);
    expect(count((e) => e.kind === 'passive' && e.phase.includes('coach'))).toBeGreaterThanOrEqual(30);
    expect(count((e) => e.kind === 'choice' && e.phase.includes('coach'))).toBeGreaterThanOrEqual(45);
    expect(count((e) => e.kind === 'passive' && e.phase.includes('postcareer'))).toBeGreaterThanOrEqual(20);
    expect(count((e) => e.kind === 'choice' && e.phase.includes('postcareer'))).toBeGreaterThanOrEqual(15);
    const chains: Record<string, number> = {};
    for (const e of defs) if (e.kind === 'chain-step' && e.chain) chains[e.chain] = (chains[e.chain] ?? 0) + 1;
    expect(Object.keys(chains).length).toBeGreaterThanOrEqual(14);
    for (const v of Object.values(chains)) expect(v).toBeGreaterThanOrEqual(3);
    expect(count((e) => e.kind === 'chain-step' && hasC(e))).toBeGreaterThan(10);
  });
  it('모든 선택 이벤트에는 판정이 있는 선택지가 하나 이상 있다', () => {
    ensureContent();
    const missing = allEventDefs().filter((e) => e.choices && e.choices.length && !e.choices.some((c) => c.check)).map((e) => e.id);
    expect(missing).toEqual([]);
  });
  it('판정 없는 선택지에는 대가가 붙고, 선택 이벤트는 모두 시즌 배타 그룹을 가진다', () => {
    ensureContent();
    const defs = allEventDefs();
    const free: string[] = [];
    const noGroup: string[] = [];
    const quit = /fx:(youthQuit|retire|natNo|epiEnd)/;
    const bad = new Set(['stress', 'fatigue', 'burnout', 'drink', 'debt']);
    for (const e of defs) {
      if (e.kind === 'choice' && !e.scheduledOnly && !e.exclusiveGroup) noGroup.push(e.id);
      (e.choices ?? []).forEach((c, i) => {
        if (c.check) return;
        const fx = `${c.ok.fx ?? ''} ${c.ok.fu ?? ''}`;
        if (quit.test(fx) || /fu:/.test(fx)) return;
        const costly = fx.split(/\s+/).some((tok) => {
          const m = /^([A-Za-z_][\w.]*)([+\-=])(-?\d+(?:\.\d+)?)$/.exec(tok);
          if (!m) return false;
          const v = Number(m[3]);
          return bad.has(m[1]) ? m[2] === '+' && v > 0 : m[2] === '-' ? v > 0 : m[2] === '+' && v < 0;
        });
        if (!costly) free.push(`${e.id}#${i}`);
      });
    }
    expect(free).toEqual([]);
    expect(noGroup).toEqual([]);
  });
  it('채우기용 비선택 이벤트는 최대 12회, 쿨다운 26주 이상이며 변형 문장이 4개 이상이다', () => {
    ensureContent();
    const ids = [
      'p_training_good', 'p_quiet_week', 'p_massage', 'p_family_call', 'p_tactic_board', 'p_stadium_atmosphere', 'p_bench_frustration',
      'p_starter_confidence', 'p_praise_article', 'p_crit_article', 'p_value_up', 'p_value_down', 'y_clean_week', 'y_gym_music', 'y_praise',
      'co_p_drill', 'co_p_video', 'co_p_staff', 'co_p_quiet', 'co_p_family', 'po_p_live', 'po_p_scout_trip', 'po_p_quiet'
    ];
    const defs = new Map(allEventDefs().map((e) => [e.id, e]));
    for (const id of ids) {
      const e = defs.get(id)!;
      expect(e.max, id).toBeLessThanOrEqual(12);
      expect(e.max, id).toBeGreaterThanOrEqual(6);
      expect(e.cooldown, id).toBeGreaterThanOrEqual(26);
      expect(e.text.length, id).toBeGreaterThanOrEqual(4);
    }
    for (const id of ['p_payday', 'p_win_bonus', 'p_big_win', 'p_loss_streak', 'co_p_win', 'co_p_loss']) expect(defs.has(id), id).toBe(false);
    for (const e of defs.values()) {
      if (e.kind === 'passive' && !e.scheduledOnly && !e.chain) expect(e.max, e.id).toBeLessThanOrEqual(60);
    }
  });
  it('선택 이벤트 반복 상한이 요청대로 줄었다', () => {
    ensureContent();
    const cap: Record<string, number> = { co_c_pre_season: 4, yc_extra_practice: 3, pc_rest_request: 4, po_c_legend_match: 4, pc_slump: 4, yc_bad_game: 4, co_c_formation: 3, co_c_rotation: 3, co_c_halftime: 3 };
    const defs = new Map(allEventDefs().map((e) => [e.id, e]));
    for (const [id, m] of Object.entries(cap)) expect(defs.get(id)!.max, id).toBe(m);
  });
  it('유스 단계 8+ 하부리그 8+ 지도자 비감독 12+ 이벤트가 있다', () => {
    ensureContent();
    const defs = allEventDefs();
    expect(defs.filter((e) => e.id.startsWith('ys_') && e.phase.length === 1 && e.phase[0] === 'youth').length).toBeGreaterThanOrEqual(10);
    expect(defs.filter((e) => e.id.startsWith('ll_') && e.cond.includes('lvl<=3')).length).toBeGreaterThanOrEqual(8);
    const cn = defs.filter((e) => e.id.startsWith('cn_') && e.kind === 'choice');
    expect(cn.length).toBeGreaterThanOrEqual(12);
    for (const e of cn) expect(e.cond.some((c) => c.startsWith('coachRole:') || c === 'studying') && !e.cond.includes('coachRole:manager')).toBe(true);
  });
  it('조건 수정: 월드컵, 겨울 휴식기, 대표팀 외면, 연애 중, 나이 범위', () => {
    ensureContent();
    const defs = new Map(allEventDefs().map((e) => [e.id, e]));
    expect(defs.get('p_wc_fever')!.cond).toContain('wcFever');
    expect(defs.get('p_winter_break')!.cond).toContain('winterBreak');
    expect(defs.get('pc_nat_snub')!.cond).toEqual(expect.arrayContaining(['natGap>=-6', 'natGap<=4', 'sinceCall>=26']));
    for (const id of ['co_c_family_time', 'pc_partner_demand']) expect(defs.get(id)!.cond).toContain('partnered');
    expect(defs.get('y_growth_spurt')!.cond).toEqual(expect.arrayContaining(['age>=14', 'age<=16']));
    expect(defs.get('y_late_bloomer')!.cond).toEqual(expect.arrayContaining(['age>=14', 'age<=16']));
    expect(defs.get('yc_growth_pain')!.cond).toEqual(expect.arrayContaining(['age>=14', 'age<=17']));
    for (const id of ['y_homesick', 'yc_homesick_choice']) expect(defs.get(id)!.cond).toEqual(expect.arrayContaining(['age>=14', 'age<=16']));
    for (const e of defs.values()) for (const c of e.cond) expect(/^age>=1[0-3]$/.test(c), `${e.id} ${c}`).toBe(false);
  });
  it('리그마다 시즌 형태가 있고 춘추제 국가가 올바르다', () => {
    for (const code of ['KR', 'JP', 'US', 'CN', 'BR']) for (const l of LEAGUES_BY_COUNTRY[code]) expect(l.cal).toBe('sa');
    for (const code of ['GB', 'DE', 'FR', 'IT', 'ES']) for (const l of LEAGUES_BY_COUNTRY[code]) expect(l.cal).toBe('aw');
    for (const code of ['DE', 'FR', 'IT', 'ES', 'NL']) for (const l of LEAGUES_BY_COUNTRY[code]) expect(l.winterBreak).toBe(true);
    for (const l of LEAGUES_BY_COUNTRY.GB) expect(l.winterBreak).toBe(false);
  });
  it('모든 랜덤 선택 이벤트에 등급이 있고 major는 판정과 후속 결과를 가진다', () => {
    ensureContent();
    const defs = allEventDefs().filter((e) => e.choices && e.choices.length && !e.scheduledOnly && e.kind !== 'moment');
    expect(defs.filter((e) => !e.tier).map((e) => e.id)).toEqual([]);
    const major = defs.filter((e) => e.tier === 'major');
    expect(major.length).toBeGreaterThanOrEqual(30);
    for (const e of major) {
      expect(e.choices!.some((c) => c.check), e.id).toBe(true);
      const fu = e.choices!.some((c) => [c.ok, c.great, c.bad, c.worst].some((o) => o && /fu:/.test(`${o.fx ?? ''} ${o.fu ?? ''}`)));
      expect(fu, e.id).toBe(true);
    }
    expect(defs.filter((e) => e.tier === 'minor').length).toBeGreaterThanOrEqual(60);
  });
  it('생활형 선택은 행동 메뉴로 옮겨졌고 일회성 이벤트는 최대 1회다', () => {
    ensureContent();
    const ids = new Set(allEventDefs().map((e) => e.id));
    for (const id of ['yc_junk_food', 'yc_night_game', 'pc_holiday', 'pc_big_night', 'pc_late_night', 'pc_diet_plan', 'pc_camp_abroad']) expect(ids.has(id), id).toBe(false);
    const acts = new Set(allActions().map((a) => a.id));
    for (const id of ['holiday_abroad', 'holiday_home', 'holiday_train', 'night_out', 'diet_control']) expect(acts.has(id), id).toBe(true);
    const defs = new Map(allEventDefs().map((e) => [e.id, e]));
    for (const id of ['pc_tattoo', 'yc_first_love', 'y_interview_web', 'yc_agent_approach', 'hs_1']) expect(defs.get(id)!.max, id).toBe(1);
    for (const id of ['pc_slump', 'yc_coach_conflict', 'co_c_board_pressure']) expect(defs.get(id)!.again, id).toContain('{prev}');
  });
  it('인물 재등장: 20개 이상 텍스트에 동료·주장·라이벌 템플릿, 새 이벤트 6개', () => {
    ensureContent();
    const defs = allEventDefs();
    const re = /\{(mate1|mate2|captain|rival)\}/;
    expect(defs.filter((e) => !e.id.startsWith('fc_') && e.text.some((x) => re.test(x))).length).toBeGreaterThanOrEqual(20);
    expect(defs.filter((e) => e.id.startsWith('fc_')).length).toBe(6);
  });
});
