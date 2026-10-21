import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { hasBatchim, josa, pickJosa } from '../src/engine/josa';

const KINDS = ['은', '이', '을', '과', '으로', '이나', '이라', '아', '이랑', '이에요'] as const;

describe('josa', () => {
  it('받침 없는 한글', () => {
    expect(['은', '이', '을', '과', '으로', '이나', '이라', '아', '이랑', '이에요'].map((k) => pickJosa('토마스'.replace('스', '사'), k))).toEqual(['는', '가', '를', '와', '로', '나', '라', '야', '랑', '예요']);
  });

  it('받침 있는 한글', () => {
    expect(KINDS.map((k) => pickJosa('감독', k))).toEqual(['은', '이', '을', '과', '으로', '이나', '이라', '아', '이랑', '이에요']);
  });

  it('ㄹ 받침은 으로/로에서 로를 쓴다', () => {
    expect(josa('서울', '으로')).toBe('서울로');
    expect(josa('아스널', '으로')).toBe('아스널로');
    expect(josa('아스널', '은')).toBe('아스널은');
    expect(josa('집', '으로')).toBe('집으로');
  });

  it('숫자 끝은 한국어 읽기로 판정한다', () => {
    const expected: Record<string, boolean> = { '0': true, '1': true, '2': false, '3': true, '4': false, '5': false, '6': true, '7': true, '8': true, '9': false, '10': true, '20': true, '100': true, '1000': true, '15': false, '13': true };
    for (const [w, b] of Object.entries(expected)) expect(hasBatchim(w), w).toBe(b);
    expect(josa('1', '으로')).toBe('1로');
    expect(josa('6', '으로')).toBe('6으로');
    expect(josa('10', '으로')).toBe('10으로');
    expect(josa('7', '을')).toBe('7을');
    expect(josa('5', '을')).toBe('5를');
  });

  it('영문 끝은 읽기 근사로 판정한다', () => {
    expect(josa('Arsenal', '은')).toBe('Arsenal은');
    expect(josa('Chelsea', '은')).toBe('Chelsea는');
    expect(josa('Real Madrid', '이')).toBe('Real Madrid가');
    expect(josa('FC Seoul', '을')).toBe('FC Seoul을');
    expect(josa('AC Milan', '과')).toBe('AC Milan과');
    expect(josa('Bayern', '으로')).toBe('Bayern으로');
    expect(josa('Arsenal', '으로')).toBe('Arsenal로');
    expect(josa('Sam', '은')).toBe('Sam은');
  });

  it('괄호와 따옴표는 건너뛰고 앞 글자로 판정한다', () => {
    expect(josa('AFC (유스)', '이')).toBe('AFC (유스)가');
    expect(josa('"감독"', '이')).toBe('"감독"이');
    expect(josa('아스널 (잉글랜드)', '은')).toBe('아스널 (잉글랜드)는');
    expect(josa('[서울]', '으로')).toBe('[서울]로');
  });
});

const EXCEPTIONS: string[] = [];
const SPELL = /(은\(는\)|이\(가\)|을\(를\)|과\(와\)|와\(과\)|\(으\)로|이\(라\)|\(이\)라|\(이\)나|\(이\)랑|\(이\)에요|아\(야\)|[가-힣}\]'"]\((은|는|이|가|을|를|과|와|로)\))/;

function walk(dir: string, out: string[]): void {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|svelte)$/.test(n)) out.push(p);
  }
}

describe('병기 표기', () => {
  it('소스에 병기 표기가 남아 있지 않다', () => {
    const files: string[] = [];
    walk('src', files);
    const bad: string[] = [];
    for (const f of files) {
      if (f.endsWith('josa.ts')) continue;
      readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
        if (SPELL.test(l) && !EXCEPTIONS.some((e) => l.includes(e))) bad.push(`${f}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
