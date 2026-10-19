import type { RawLeague } from '../schema';

export const leagues: RawLeague[] = [
  { id: 'FR1', ko: '리그 1', en: 'Ligue 1', tier: 1, lvl: 5, top: 90, bottom: 60, up: 0, down: 2, elite: 1, cup: '쿠프 드 프랑스', clubs: 'Paris Saint-Germain|파리;Marseille|마르세유;Monaco|모나코;Lille|릴;Lyon|리옹;Nice|니스;Lens|랑스;Rennes|렌;Strasbourg|스트라스부르;Toulouse|툴루즈;Brest|브레스트;Nantes|낭트;Angers|앙제;Auxerre|오세르;Le Havre|르아브르;Lorient|로리앙;Paris FC|파리;Metz|메스' },
  { id: 'FR2', ko: '리그 2', en: 'Ligue 2', tier: 2, lvl: 4, top: 66, bottom: 52, up: 2, down: 3, cup: '쿠프 드 프랑스', clubs: 'Saint-Étienne|생테티엔;Montpellier|몽펠리에;Reims|랭스;Bordeaux|보르도;Troyes|트루아;Clermont Foot|클레르몽페랑;Guingamp|갱강;Pau FC|포;Dunkerque|됭케르크;Rodez|로데즈;Amiens|아미앵;Red Star|파리;Grenoble|그르노블;Laval|라발;Annecy|안시;Martigues|마르티그;Bastia|바스티아;Caen|캉;Nancy|낭시;Ajaccio|아작시오' },
  { id: 'FR3', ko: '리그 3', en: 'National', tier: 3, lvl: 3, top: 54, bottom: 44, up: 3, down: 4, cup: '쿠프 드 프랑스', clubs: 'Le Mans|르망;Nîmes|님;Sochaux|소쇼;Quevilly-Rouen|루앙;Valenciennes|발랑시엔;Orléans|오를레앙;Versailles|베르사유;Concarneau|콩카르노;Stade Briochin|생브리외;Dijon|디종;Aubagne|오바뉴;Niort|니오르;Villefranche|빌프랑슈;Fleury 91|플뢰리;Paris 13 Atletico|파리;Le Puy|르퓌;Châteauroux|샤토루;Avranches|아브랑슈' },
  { id: 'FR4', ko: '리그 4', en: 'National 2', tier: 4, lvl: 2, top: 44, bottom: 34, up: 3, down: 3, cup: '쿠프 드 프랑스', clubs: 'Marignane|마리냔;Bergerac|베르주라크;Épinal|에피날;Beauvais|보베;Saint-Pryvé|생프리베;Sète|세트;Stade Poitiers|푸아티에;Hyères|이에르;Mulhouse|뮐루즈;Thonon Évian|토농;Lyon La Duchère|리옹;Bourg-Péronnas|부르;Montceau|몽소;Andrézieux|앙드레지외;Toulon|툴롱;Saint-Malo|생말로' }
];
