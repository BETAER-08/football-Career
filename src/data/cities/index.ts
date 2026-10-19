import { CitySchema, type City } from '../schema';
import { cities as cAR } from './AR';
import { cities as cBD } from './BD';
import { cities as cBR } from './BR';
import { cities as cCD } from './CD';
import { cities as cCN } from './CN';
import { cities as cCO } from './CO';
import { cities as cDE } from './DE';
import { cities as cEG } from './EG';
import { cities as cES } from './ES';
import { cities as cET } from './ET';
import { cities as cFR } from './FR';
import { cities as cGB } from './GB';
import { cities as cGH } from './GH';
import { cities as cHR } from './HR';
import { cities as cID } from './ID';
import { cities as cIN } from './IN';
import { cities as cIR } from './IR';
import { cities as cIT } from './IT';
import { cities as cJP } from './JP';
import { cities as cKE } from './KE';
import { cities as cKR } from './KR';
import { cities as cMA } from './MA';
import { cities as cMX } from './MX';
import { cities as cNG } from './NG';
import { cities as cNL } from './NL';
import { cities as cPH } from './PH';
import { cities as cPK } from './PK';
import { cities as cPT } from './PT';
import { cities as cSA } from './SA';
import { cities as cSN } from './SN';
import { cities as cTR } from './TR';
import { cities as cUS } from './US';
import { cities as cUY } from './UY';
import { cities as cVN } from './VN';

const RAW: Record<string, City[]> = { AR: cAR, BD: cBD, BR: cBR, CD: cCD, CN: cCN, CO: cCO, DE: cDE, EG: cEG, ES: cES, ET: cET, FR: cFR, GB: cGB, GH: cGH, HR: cHR, ID: cID, IN: cIN, IR: cIR, IT: cIT, JP: cJP, KE: cKE, KR: cKR, MA: cMA, MX: cMX, NG: cNG, NL: cNL, PH: cPH, PK: cPK, PT: cPT, SA: cSA, SN: cSN, TR: cTR, US: cUS, UY: cUY, VN: cVN };

export const CITIES: Record<string, City[]> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k, v.map((c) => CitySchema.parse(c))])
);
