import { LeagueSchema, type League } from '../schema';
import { leagues as lAR } from './AR';
import { leagues as lBD } from './BD';
import { leagues as lBR } from './BR';
import { leagues as lCD } from './CD';
import { leagues as lCN } from './CN';
import { leagues as lCO } from './CO';
import { leagues as lDE } from './DE';
import { leagues as lEG } from './EG';
import { leagues as lES } from './ES';
import { leagues as lET } from './ET';
import { leagues as lFR } from './FR';
import { leagues as lGB } from './GB';
import { leagues as lGH } from './GH';
import { leagues as lHR } from './HR';
import { leagues as lID } from './ID';
import { leagues as lIN } from './IN';
import { leagues as lIR } from './IR';
import { leagues as lIT } from './IT';
import { leagues as lJP } from './JP';
import { leagues as lKE } from './KE';
import { leagues as lKR } from './KR';
import { leagues as lMA } from './MA';
import { leagues as lMX } from './MX';
import { leagues as lNG } from './NG';
import { leagues as lNL } from './NL';
import { leagues as lPH } from './PH';
import { leagues as lPK } from './PK';
import { leagues as lPT } from './PT';
import { leagues as lSA } from './SA';
import { leagues as lSN } from './SN';
import { leagues as lTR } from './TR';
import { leagues as lUS } from './US';
import { leagues as lUY } from './UY';
import { leagues as lVN } from './VN';

const RAW = { AR: lAR, BD: lBD, BR: lBR, CD: lCD, CN: lCN, CO: lCO, DE: lDE, EG: lEG, ES: lES, ET: lET, FR: lFR, GB: lGB, GH: lGH, HR: lHR, ID: lID, IN: lIN, IR: lIR, IT: lIT, JP: lJP, KE: lKE, KR: lKR, MA: lMA, MX: lMX, NG: lNG, NL: lNL, PH: lPH, PK: lPK, PT: lPT, SA: lSA, SN: lSN, TR: lTR, US: lUS, UY: lUY, VN: lVN };

export const LEAGUES_BY_COUNTRY: Record<string, League[]> = Object.fromEntries(
  Object.entries(RAW).map(([code, arr]) => [code, arr.map((l) => LeagueSchema.parse(l))])
);

export const LEAGUES_META = { note: '2025-26 시즌 기준으로 작성한 근사 데이터이며 실제와 다를 수 있습니다. 구단은 전력 순으로 나열되어 상대 전력이 계산됩니다.', estimate: true };
