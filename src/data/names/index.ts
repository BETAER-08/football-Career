import { NamePoolSchema, type NamePoolRaw } from '../schema';
import { names as nAR } from './AR';
import { names as nBD } from './BD';
import { names as nBR } from './BR';
import { names as nCD } from './CD';
import { names as nCN } from './CN';
import { names as nCO } from './CO';
import { names as nDE } from './DE';
import { names as nEG } from './EG';
import { names as nES } from './ES';
import { names as nET } from './ET';
import { names as nFR } from './FR';
import { names as nGB } from './GB';
import { names as nGH } from './GH';
import { names as nHR } from './HR';
import { names as nID } from './ID';
import { names as nIN } from './IN';
import { names as nIR } from './IR';
import { names as nIT } from './IT';
import { names as nJP } from './JP';
import { names as nKE } from './KE';
import { names as nKR } from './KR';
import { names as nMA } from './MA';
import { names as nMX } from './MX';
import { names as nNG } from './NG';
import { names as nNL } from './NL';
import { names as nPH } from './PH';
import { names as nPK } from './PK';
import { names as nPT } from './PT';
import { names as nSA } from './SA';
import { names as nSN } from './SN';
import { names as nTR } from './TR';
import { names as nUS } from './US';
import { names as nUY } from './UY';
import { names as nVN } from './VN';

const RAW: Record<string, NamePoolRaw> = { AR: nAR, BD: nBD, BR: nBR, CD: nCD, CN: nCN, CO: nCO, DE: nDE, EG: nEG, ES: nES, ET: nET, FR: nFR, GB: nGB, GH: nGH, HR: nHR, ID: nID, IN: nIN, IR: nIR, IT: nIT, JP: nJP, KE: nKE, KR: nKR, MA: nMA, MX: nMX, NG: nNG, NL: nNL, PH: nPH, PK: nPK, PT: nPT, SA: nSA, SN: nSN, TR: nTR, US: nUS, UY: nUY, VN: nVN };

export const NAME_POOLS: Record<string, { given: [string, string][]; surname: [string, string][] }> = Object.fromEntries(
  Object.entries(RAW).map(([code, raw]) => {
    const p = NamePoolSchema.parse(raw);
    const split = (s: string): [string, string][] => s.split(' ').map((t) => { const i = t.indexOf(':'); return [t.slice(0, i).replace(/_/g, ' '), t.slice(i + 1).replace(/_/g, ' ')]; });
    return [code, { given: split(p.given), surname: split(p.surname) }];
  })
);
