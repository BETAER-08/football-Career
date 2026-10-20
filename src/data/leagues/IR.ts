import type { RawLeague } from '../schema';

export const leagues: RawLeague[] = [
  { id: 'IR1', ko: '페르시안 걸프 프로리그', en: 'Persian Gulf Pro League', tier: 1, winterBreak: true, lvl: 3, top: 58, bottom: 44, up: 0, down: 3, cup: '하즈피 컵', clubs: 'Persepolis|테헤란;Esteghlal|테헤란;Sepahan|이스파한;Tractor|타브리즈;Foolad|아흐바즈;Gol Gohar|시르잔;Malavan|반다르안잘리;Nassaji Mazandaran|가임샤르;Aluminium Arak|아라크;Zob Ahan|이스파한;Havadar|테헤란;Mes Rafsanjan|라프산잔;Shams Azar|카즈빈;Paykan|테헤란;Chadormalou|아르다칸;Kheybar Khorramabad|호람아바드' },
  { id: 'IR2', ko: '아자디간 리그', en: 'Azadegan League', tier: 2, winterBreak: true, lvl: 2, top: 44, bottom: 34, up: 3, down: 4, cup: '하즈피 컵', clubs: 'Esteghlal Khuzestan|아흐바즈;Fajr Sepasi|시라즈;Khooshe Talaei|사베;Shahrdari Astara|아스타라;Navad Urmia|우르미예;Mes Shahr-e Babak|샤레바박;Sanat Naft|아바단;Naft Masjed Soleyman|마스제드솔레이만;Nirooye Zamini|테헤란;Pars Jonoubi|부셰르;Machine Sazi|타브리즈;Oxin Alborz|카라지;Shahin Bushehr|부셰르;Khalij Fars Mahshahr|마흐샤흐르' }
];
