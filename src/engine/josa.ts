export type JosaKind = '은' | '이' | '을' | '과' | '으로' | '이나' | '이라' | '아' | '이랑' | '이에요';

const PAIRS: Record<JosaKind, [string, string]> = {
  은: ['은', '는'],
  이: ['이', '가'],
  을: ['을', '를'],
  과: ['과', '와'],
  으로: ['으로', '로'],
  이나: ['이나', '나'],
  이라: ['이라', '라'],
  아: ['아', '야'],
  이랑: ['이랑', '랑'],
  이에요: ['이에요', '예요']
};

const ALIAS: Record<string, JosaKind> = {
  는: '은', 가: '이', 를: '을', 와: '과', 로: '으로', 나: '이나', 라: '이라', 야: '아', 랑: '이랑', 예요: '이에요'
};

const SKIP = new Set([...' \t\n\r"\'`”’“‘」』)]}>.,!?~…·:;-—*']);

const DIGIT_JONG: Record<string, number> = { '0': 21, '1': 8, '2': 0, '3': 16, '4': 0, '5': 0, '6': 1, '7': 8, '8': 8, '9': 0 };

const LATIN_JONG: Record<string, number> = { L: 8, R: 8, M: 16, N: 4 };

export function isJosaKind(k: string): k is JosaKind {
  return k in PAIRS || k in ALIAS;
}

function normalize(k: string): JosaKind {
  return (PAIRS as Record<string, unknown>)[k] ? (k as JosaKind) : ALIAS[k];
}

function jongOfDigits(num: string): number {
  const trimmed = num.replace(/^0+(?=\d)/, '');
  if (trimmed === '0') return 21;
  const zeros = trimmed.length - trimmed.replace(/0+$/, '').length;
  if (zeros === 0) return DIGIT_JONG[trimmed[trimmed.length - 1]];
  if (zeros === 1) return 17;
  if (zeros === 2) return 1;
  if (zeros === 3) return 4;
  if (zeros >= 4 && zeros <= 7) return 4;
  return DIGIT_JONG[trimmed[trimmed.length - 1]];
}

export function jongseong(word: string): number {
  let i = word.length - 1;
  while (i >= 0 && SKIP.has(word[i])) i--;
  if (i < 0) return 0;
  const ch = word[i];
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  if (ch >= '0' && ch <= '9') {
    let j = i;
    while (j > 0 && word[j - 1] >= '0' && word[j - 1] <= '9') j--;
    return jongOfDigits(word.slice(j, i + 1));
  }
  const base = ch.normalize('NFD')[0].toUpperCase();
  if (base >= 'A' && base <= 'Z') return LATIN_JONG[base] ?? 0;
  return 0;
}

export function hasBatchim(word: string): boolean {
  return jongseong(word) !== 0;
}

export function pickJosa(word: string, kind: string): string {
  const k = normalize(kind);
  const [withB, without] = PAIRS[k];
  const jong = jongseong(word);
  if (k === '으로') return jong === 0 || jong === 8 ? without : withB;
  return jong !== 0 ? withB : without;
}

export function josa(word: string, kind: string): string {
  return word + pickJosa(word, kind);
}
