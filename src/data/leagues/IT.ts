import type { RawLeague } from '../schema';

export const leagues: RawLeague[] = [
  { id: 'IT1', ko: '세리에 A', en: 'Serie A', tier: 1, lvl: 5, top: 89, bottom: 60, up: 0, down: 3, elite: 5, cup: '코파 이탈리아', clubs: 'Inter|밀라노;Napoli|나폴리;Juventus|토리노;AC Milan|밀라노;Atalanta|베르가모;Roma|로마;Lazio|로마;Fiorentina|피렌체;Bologna|볼로냐;Torino|토리노;Genoa|제노바;Udinese|우디네;Como|코모;Cagliari|칼리아리;Parma|파르마;Sassuolo|사수올로;Lecce|레체;Verona|베로나;Cremonese|크레모나;Pisa|피사' },
  { id: 'IT2', ko: '세리에 B', en: 'Serie B', tier: 2, lvl: 4, top: 66, bottom: 52, up: 3, down: 4, cup: '코파 이탈리아', clubs: 'Palermo|팔레르모;Sampdoria|제노바;Venezia|베네치아;Monza|몬차;Frosinone|프로시노네;Bari|바리;Cesena|체세나;Modena|모데나;Spezia|라스페치아;Catanzaro|카탄차로;Empoli|엠폴리;Cittadella|치타델라;Reggiana|레조넬에밀리아;Südtirol|볼차노;Carrarese|카라라;Juve Stabia|카스텔람마레;Mantova|만토바;Padova|파도바;Avellino|아벨리노;Pescara|페스카라' },
  { id: 'IT3', ko: '세리에 C', en: 'Serie C', tier: 3, lvl: 3, top: 54, bottom: 44, up: 3, down: 4, cup: '코파 이탈리아', clubs: 'Vicenza|비첸차;Triestina|트리에스테;Benevento|베네벤토;Salernitana|살레르노;Ternana|테르니;Brescia|브레시아;Perugia|페루자;Lecco|레코;Pro Vercelli|베르첼리;Arezzo|아레초;Gubbio|구비오;Lucchese|루카;Pontedera|폰테데라;Rimini|리미니;Ascoli|아스콜리;Pescara B|페스카라;Torres|사사리;Casertana|카세르타;Cosenza|코센차;Foggia|포자' },
  { id: 'IT4', ko: '세리에 D', en: 'Serie D', tier: 4, lvl: 2, top: 44, bottom: 34, up: 3, down: 3, cup: '코파 이탈리아', clubs: 'Campobasso|캄포바소;Giugliano|줄리아노;Sorrento|소렌토;Trapani|트라파니;Siracusa|시라쿠사;Latina|라티나;Altamura|알타무라;Nocerina|노체리나;Taranto|타란토;Matera|마테라;Cavese|카베세;Lumezzane|루메차네;Legnano|레냐노;Mestre|메스트레;Chievo|베로나;Novara|노바라' }
];
