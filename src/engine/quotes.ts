import { QUOTES } from '../data/quotes';
import type { Persona, QuoteRow, QuoteWho } from '../data/quotes';
import { hashString } from './rng';
import { chooseVariant, fillTemplate, narrativeStats } from './narrative';
import { stream } from './streams';
import { getClub } from './data';
import type { EventDef } from '../data/schema';
import type { Bind, GameState, Line, PersonRef } from './types';

const TOKEN_WHO: Record<string, QuoteWho> = {
  coach: 'coach', fcoach: 'coach', natcoach: 'coach', youthcoach: 'youthcoach', captain: 'captain',
  mate: 'mate', mate1: 'mate', mate2: 'mate', mate3: 'mate', star: 'mate', oldmate: 'oldmate',
  rival: 'rival', oldrival: 'oldrival', agent: 'agent', reporter: 'reporter', director: 'director', owner: 'director',
  father: 'father', mother: 'mother', partner: 'partner', sibling: 'sibling'
};

const KEY_WHO: Record<string, QuoteWho> = {
  coach: 'coach', captain: 'captain', mate1: 'mate', mate2: 'mate', mate3: 'mate', rival: 'rival', agent: 'agent',
  media: 'reporter', director: 'director', owner: 'director', father: 'father', mother: 'mother', partner: 'partner',
  natcoach: 'coach', fcoach: 'coach'
};

export const WHO_LABEL: Record<QuoteWho, string> = {
  coach: '감독', youthcoach: '유스 코치', captain: '주장', mate: '동료', rival: '라이벌', agent: '에이전트',
  reporter: '기자', director: '단장', father: '아버지', mother: '어머니', partner: '연인', sibling: '가족',
  oldmate: '옛 동료', oldrival: '옛 라이벌'
};

export const WHO_ICON: Record<QuoteWho, string> = {
  coach: '🧢', youthcoach: '📋', captain: '🎖️', mate: '⚽', rival: '🔥', agent: '💼',
  reporter: '🎙️', director: '🏛️', father: '👨', mother: '👩', partner: '💬', sibling: '🏠',
  oldmate: '🤝', oldrival: '⚔️'
};

export const PERSONA_LABEL: Record<Exclude<Persona, ''>, string> = {
  w: '다정하고 따뜻한 성격', s: '엄격하고 원칙적인 성격', t: '장난기 많고 입담 좋은 성격', c: '차분하고 신중한 성격'
};

const PERSONAS: Exclude<Persona, ''>[] = ['w', 's', 't', 'c'];

export function personaOf(name: string): Exclude<Persona, ''> {
  return PERSONAS[hashString(`persona|${name}`) % PERSONAS.length];
}

const TOPICS: ReadonlyArray<readonly [RegExp, readonly string[]]> = [
  [/부상|재활|무릎|통증|의무|수술|염좌/, ['injury', 'worry']],
  [/복귀|회복/, ['recovery']],
  [/재계약|계약|연봉|협상|서명|위약/, ['contract', 'money']],
  [/이적|영입|빅클럽|관심|스카우트|해외/, ['rumor', 'contract']],
  [/더비/, ['derby', 'rivalry']],
  [/결승|컵 대회|우승|트로피/, ['final', 'win']],
  [/강등|잔류/, ['relegation']],
  [/승격/, ['promotion']],
  [/전술|포메이션|감독|비디오/, ['tactics', 'advice']],
  [/훈련|웨이트|세트피스|체력|캠프/, ['training', 'encourage']],
  [/기자|인터뷰|기사|방송|SNS|악플|해설|중계/, ['media', 'warn']],
  [/팬|응원|야유|걸개|서포터/, ['fans']],
  [/가족|어머니|아버지|아이|결혼|아기|형제|동생/, ['family', 'worry']],
  [/연인|데이트|사랑|애인/, ['love']],
  [/돈|주식|세금|빚|투자|후원|지출/, ['money', 'warn']],
  [/술|담배|야식|식단|수면|잠|불면/, ['diet', 'habit', 'warn']],
  [/벤치|출전|명단|교체/, ['bench', 'encourage']],
  [/부진|슬럼프|침묵/, ['slump', 'comfort']],
  [/후배|신인|유망주|유스|신예/, ['mentor', 'newcomer']],
  [/라이벌|경쟁/, ['rivalry', 'challenge', 'envy']],
  [/수상|후보|상 /, ['award', 'congratulate']],
  [/은퇴|작별|이별|퇴단/, ['farewell']],
  [/승리|골|득점/, ['win', 'praise']],
  [/패배|대패|실점/, ['loss', 'comfort']],
  [/동료|라커룸|팀 분위기/, ['team']]
];

const GRADE_TAGS: Record<string, readonly string[]> = {
  great: ['praise', 'congratulate', 'pride', 'win'],
  ok: ['encourage', 'advice'],
  bad: ['comfort', 'encourage', 'warn', 'worry'],
  worst: ['comfort', 'worry', 'loss'],
  none: ['encourage', 'advice']
};

const topicCache = new Map<string, string[]>();

export function topicTags(def: EventDef): string[] {
  let t = topicCache.get(def.id);
  if (t) return t;
  const hay = `${def.text.join(' ')} ${(def.choices ?? []).map((c) => c.label).join(' ')}`;
  const set: string[] = [];
  for (const [re, tags] of TOPICS) if (re.test(hay)) for (const x of tags) if (!set.includes(x)) set.push(x);
  set.push('team', 'encourage', 'advice', 'general');
  t = [...new Set(set)];
  topicCache.set(def.id, t);
  return t;
}

const index = new Map<string, QuoteRow[]>();
for (const q of QUOTES) {
  const k = `${q[1]}|${q[0]}`;
  const arr = index.get(k);
  if (arr) arr.push(q);
  else index.set(k, [q]);
}

interface Speaker { who: QuoteWho; ref: PersonRef }

function speakers(s: GameState, bind: Bind | undefined): Speaker[] {
  const out: Speaker[] = [];
  const seen = new Set<string>();
  const add = (who: QuoteWho | undefined, ref: PersonRef | undefined): void => {
    if (!who || !ref || ref.k.startsWith('tmp:') || seen.has(ref.n)) return;
    seen.add(ref.n);
    out.push({ who, ref });
  };
  if (bind) for (const [tok, ref] of Object.entries(bind)) add(TOKEN_WHO[tok], ref);
  return out;
}

function fallbackSpeakers(s: GameState): Speaker[] {
  const out: Speaker[] = [];
  const pe = s.people;
  const order = s.phase === 'youth'
    ? ['coach', 'mate1', 'mother', 'father', 'rival']
    : s.phase === 'postcareer'
      ? ['partner', 'mother', 'father', 'agent', 'mate1']
      : ['coach', 'captain', 'agent', 'mate1', 'partner', 'mother'];
  for (const k of order) {
    const p = pe[k];
    const who = KEY_WHO[k];
    if (p && p.name && !p.gone && who) out.push({ who, ref: { k, n: p.name } });
  }
  if (s.phase === 'youth' && s.wld.youthCoach.name) out.unshift({ who: 'youthcoach', ref: { k: 'youthcoach', n: s.wld.youthCoach.name } });
  return out;
}

export function lineOf(s: GameState, key: string, tags: readonly string[], bind: Bind | undefined, skip?: string): Line | null {
  const list = [...speakers(s, bind), ...fallbackSpeakers(s)].filter((x) => x.ref.n !== skip);
  narrativeStats.events += 1;
  if (!list.length) return null;
  const rng = stream(s.cfg.seed, `quote:${key}`, s.ev.varN++);
  const start = rng.int(0, list.length - 1);
  for (let i = 0; i < list.length; i++) {
    const sp = list[(start + i) % list.length];
    const persona = personaOf(sp.ref.n);
    for (const tag of tags) {
      const pool = index.get(`${sp.who}|${tag}`);
      if (!pool) continue;
      const mine = pool.filter((q) => q[2] === persona || q[2] === '');
      const use = mine.length ? mine : pool;
      const q = use[chooseVariant(s, `q:${sp.who}:${tag}`, use.length)];
      narrativeStats.quoted += 1;
      return {
        who: sp.who,
        name: sp.ref.n,
        rel: sp.who === 'partner' && s.life.romance === 'married' ? '배우자' : WHO_LABEL[sp.who],
        icon: WHO_ICON[sp.who],
        text: fillTemplate(q[3], { name: s.p.name, club: s.career.clubId ? getClub(s.career.clubId).name : '' })
      };
    }
  }
  return null;
}

export function situationLine(s: GameState, def: EventDef, bind: Bind | undefined): Line | null {
  return lineOf(s, `${def.id}:s`, topicTags(def), bind);
}

export function reactionLine(s: GameState, def: EventDef, bind: Bind | undefined, grade: string, skip?: string): Line | null {
  const tags = [...(GRADE_TAGS[grade] ?? GRADE_TAGS.none), ...topicTags(def)];
  return lineOf(s, `${def.id}:r`, tags, bind, skip);
}

export const PERSONA_SHORT: Record<Exclude<Persona, ''>, string> = { w: '다정함', s: '엄격함', t: '장난기', c: '차분함' };
