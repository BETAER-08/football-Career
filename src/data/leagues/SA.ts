import type { RawLeague } from '../schema';

export const leagues: RawLeague[] = [
  { id: 'SA1', ko: '사우디 프로페셔널 리그', en: 'Saudi Pro League', tier: 1, lvl: 4, top: 80, bottom: 56, up: 0, down: 3, cup: '킹스컵', clubs: 'Al Hilal|리야드;Al Nassr|리야드;Al Ittihad|제다;Al Ahli|제다;Al Qadsiah|호바르;Al Shabab|리야드;Al Taawoun|부라이다;Al Fateh|호푸프;Neom SC|네옴;Al Fayha|마즈마아;Damac|하미스무샤이트;Al Okhdood|나즈란;Al Riyadh|리야드;Al Khaleej|사이하트;Al Kholood|아르라스;Al Najma|운자이자;Al Hazem|라스;Al Ettifaq|담맘' },
  { id: 'SA2', ko: '사우디 퍼스트 디비전', en: 'Saudi First Division', tier: 2, lvl: 3, top: 54, bottom: 44, up: 3, down: 3, cup: '킹스컵', clubs: 'Al Wehda|메카;Al Raed|부라이다;Al Tai|하일;Al Orobah|수까까;Al Jabalain|하일;Abha Club|아브하;Al Batin|하파르알바틴;Al Adalah|호푸프;Al Arabi KSA|운자이자;Al Qadisiyah II|호바르;Al Anwar|리야드;Al Zulfi|줄피;Al Faisaly|마즈마아;Al Diriyah|디리야;Al Bukiryah|부카이리야;Jeddah Club|제다;Al Ain KSA|바하' },
  { id: 'SA3', ko: '사우디 세컨드 디비전', en: 'Saudi Second Division', tier: 3, lvl: 2, top: 44, bottom: 34, up: 3, down: 3, cup: '킹스컵', clubs: 'Al Safa|카티프;Al Sahel|리야드;Al Jandal|두마트알잔달;Al Kawkab|카르즈;Al Thoqbah|호바르;Al Nairyah|나이리야;Al Washm|와슴;Al Mujazzal|무자잘;Al Taraji|카티프;Al Sharq|마디나;Al Ansar KSA|마디나;Ohod Club|마디나;Hajer|하사;Al Draih|다마만;Wej|타이프;Al Rawdhah|리야드' }
];
