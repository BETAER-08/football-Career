export interface Grid {
  x: number;
  y: number;
  rows: readonly string[];
}

export type Point = readonly [number, number];

export interface FaceParts {
  name: string;
  youth: boolean;
  face: Grid;
  jaw: Grid;
}

export const FACES: readonly FaceParts[] = [
  {
    name: 'round',
    youth: false,
    face: { x: 6, y: 3, rows: [
      '.......ssssss.......',
      '.....sshhhsssss.....',
      '....sshsssssssss....',
      '...ssssssssssssss...',
      '..ssssssssssssssss..',
      '..ssssssssssssssds..',
      '..ssssssssssssssds..',
      '..ssssssssssssssds..',
      '..sshsssssssssssds..',
      '..sshsssssssssssds..',
      '.eshsssssssssssssde.',
      'eehsssssssssssssssee',
      'eehsssssssssssssssee',
      '.edhsssssssssssssde.',
      '..sdsssssssssssdds..',
      '...sdsssssssssdds...',
      '....sdsssssssdds....',
      '.....sdsssdddds.....',
      '......sdddddds......',
      '.......ssssds.......'
    ] },
    jaw: { x: 8, y: 16, rows: [
      'd..............d',
      '.d............d.',
      '..d..........d..',
      '...d........d...',
      '....d......d....',
      '.....d....d.....'
    ] }
  },
  {
    name: 'slim',
    youth: false,
    face: { x: 6, y: 3, rows: [
      '.......ssssss.......',
      '.....sshhhsssss.....',
      '....sshsssssssss....',
      '...ssssssssssssss...',
      '..ssssssssssssssss..',
      '..ssssssssssssssds..',
      '..ssssssssssssssds..',
      '..ssssssssssssssds..',
      '..sshsssssssssssds..',
      '..sshsssssssssssds..',
      '.eshsssssssssssssde.',
      'eehsssssssssssssssee',
      'ee.sshsssssssssds.ee',
      '.e.sshsssssssssds.e.',
      '....dsssssssssdd....',
      '....sdsssssssdds....',
      '.....sdsssssdds.....',
      '......sdssddds......',
      '.......sdddds.......',
      '........ssds........'
    ] },
    jaw: { x: 10, y: 16, rows: [
      'd..........d',
      '.d........d.',
      '.d........d.',
      '..d......d..',
      '...d....d...',
      '....d..d....'
    ] }
  },
  {
    name: 'square',
    youth: false,
    face: { x: 6, y: 3, rows: [
      '.......ssssss.......',
      '.....sshhhsssss.....',
      '....sshsssssssss....',
      '...ssssssssssssss...',
      '..ssssssssssssssss..',
      '..ssssssssssssssds..',
      '..ssssssssssssssds..',
      '..ssssssssssssssds..',
      '..sshsssssssssssds..',
      '..sshsssssssssssds..',
      '.eshsssssssssssssde.',
      'eehsssssssssssssssee',
      'eehsssssssssssssssee',
      '.eshsssssssssssssde.',
      '..ssssssssssssssdd..',
      '..dsssssssssssssdd..',
      '..sdsssssssssssdds..',
      '...sdsssssdddddds...',
      '....sdddddddddds....',
      '.....ssssssssds.....'
    ] },
    jaw: { x: 8, y: 16, rows: [
      'd..............d',
      '.d............d.',
      '.d............d.',
      '.d............d.',
      '..d..........d..',
      '...d........d...'
    ] }
  },
  {
    name: 'youth',
    youth: true,
    face: { x: 7, y: 5, rows: [
      '.......ssss.......',
      '.....sshhssss.....',
      '....shhsssssss....',
      '...ssssssssssss...',
      '..ssssssssssssss..',
      '..ssssssssssssds..',
      '..sshsssssssssds..',
      '..sshsssssssssds..',
      '.eshsssssssssssde.',
      'eehsssssssssssssee',
      'eehsssssssssssssee',
      '.eshsssssssssssde.',
      '..ssssssssssssds..',
      '..sdssssssssssds..',
      '...sdsssssssdds...',
      '....sdsssdddds....',
      '.....sdddddds.....',
      '......ssssds......'
    ] },
    jaw: { x: 9, y: 16, rows: [
      'd............d',
      '.d..........d.',
      '.d..........d.',
      '..d........d..',
      '...d......d...',
      '....d....d....'
    ] }
  }
];

export interface HairStyle {
  id: string;
  name: string;
  texture: string;
  front: Grid | null;
  back: Grid | null;
  thinnable: boolean;
}

export const HAIR_STYLES: readonly HairStyle[] = [
  {
    id: 'short',
    name: '짧은 머리',
    texture: 'plain',
    front: { x: 7, y: 2, rows: [
      '.....bbbbbbdb.....',
      '...bbhhhhhhbbdb...',
      '..bhhhbhbbbbbbdb..',
      '.bhbhbbbbbbbbbbdb.',
      'bbbbbbbbbbbbbbbbdb',
      'bbbbbbbddddbbbbbdb',
      'bbbdddd....ddddbdb',
      'bbd............ddb',
      'bb..............db',
      'bb..............db',
      'dd..............dd'
    ] },
    back: null,
    thinnable: true
  },
  {
    id: 'buzz',
    name: '버즈컷',
    texture: 'plain',
    front: { x: 8, y: 3, rows: [
      '.....zzzzzz.....',
      '...zzzzzzzzzz...',
      '..zzzzzzzzzzzz..',
      '.zzzzzzzzzzzzzz.',
      'zzzzzzzzzzzzzzzz',
      'zzzz........zzzz',
      'zz............zz',
      'z..............z',
      'z..............z'
    ] },
    back: null,
    thinnable: true
  },
  {
    id: 'twoblock',
    name: '투블럭',
    texture: 'plain',
    front: { x: 7, y: 1, rows: [
      '.....bbbbbbdb.....',
      '...bbhhhhhhbbdb...',
      '..bhhbhbhbbbbbdb..',
      '.bhhbbbbbbbbbbbdb.',
      '.bbbbbbbbbbbbbbdb.',
      'zbbbbbbbbbbbbbbbdz',
      'zzbbbbbbbbbbbbbbzz',
      '.zzzdbbbdddbbdzzz.',
      '.zz..ddd...dd..zz.',
      '.zz............zz.',
      '.z..............z.',
      '.z..............z.'
    ] },
    back: null,
    thinnable: true
  },
  {
    id: 'fringe',
    name: '앞머리',
    texture: 'plain',
    front: { x: 7, y: 2, rows: [
      '.....bbbbbbdb.....',
      '...bbhhhhhhbbdb...',
      '..bhhhbhbbbbbbdb..',
      '.bhbhbbbbbbbbbbdb.',
      'bbbbbbbbbbbbbbbbdb',
      'bbbbbbbbbbbbbbbbdb',
      'dbbbbbbbbbbbbbbbdd',
      '.bbdbbbddddbbbddb.',
      '.bd.ddd....ddd.db.',
      '.b..............b.',
      '.d..............d.'
    ] },
    back: null,
    thinnable: false
  },
  {
    id: 'curly',
    name: '곱슬',
    texture: 'curl',
    front: { x: 6, y: 1, rows: [
      '......bbbbhbdb......',
      '...bbbhbhdhhbbbbh...',
      '..hhbhdhbbbbhdbbbh..',
      '.bhhbbbbhbdbbhbbbdh.',
      'dhbbhbbdbhbbbbhbbbbh',
      'hbbbdhbbbbhdbbbhbbdb',
      'bhbbbbhddbbhdbbdhbbb',
      'bbhbddd..dd..dddbhbd',
      'bbdh...d....d...dbhb',
      'dbb..............bbh',
      '.bb..............db.',
      '.hd..............dd.'
    ] },
    back: null,
    thinnable: true
  },
  {
    id: 'dreads',
    name: '레게·드레드',
    texture: 'strand',
    front: { x: 5, y: 1, rows: [
      '.......bbbbbbdb.......',
      '....bbbhhhhhhhbbdb....',
      '...bhhhbbbbbbbbbbdb...',
      '..bhbbbdbbdbbdbbbbdb..',
      '..hbdbbdbbdbbdbbdbdb..',
      '..bbdbbdbbdbbdbbdbdb..',
      '..bbdbbdddddddbbdbdd..',
      '.bbbdddd......dddbbdb.',
      '.hbbd............dbdb.',
      '.bbb..............bdb.',
      '.dbb..............bdb.',
      'ddbb..............bdb.',
      '.dbb..............bddd',
      '.dbb..............bdb.',
      'ddbb..............bdb.',
      '.dbb..............bddd',
      '.dbb..............bdb.',
      'ddbb..............bdb.',
      '.dbb..............bddd',
      '.dbb..............bdb.',
      'ddbb..............bdb.',
      '.dbb..............bddd',
      '.dbb..............bdb.',
      'ddbb..............bdb.',
      '.dbb..............bddd',
      '.ddd..............ddd.'
    ] },
    back: { x: 8, y: 9, rows: [
      'bb............db',
      'hh............db',
      'bb............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'bd............db',
      'dd............dd'
    ] },
    thinnable: false
  },
  {
    id: 'bun',
    name: '묶은 머리',
    texture: 'plain',
    front: { x: 8, y: 0, rows: [
      '......bbbb......',
      '.....bhhhhb.....',
      '.....hhbbbb.....',
      '..bbbhbbbbbbdb..',
      '.bhhhbbbbbbbbdb.',
      'bhbhbbbbbbbbbbdb',
      'bbbbbbbbbbbbbbdb',
      'bbbddddddddddbdb',
      'bbd..........ddb',
      'bd............db',
      'b..............b',
      'd..............d'
    ] },
    back: null,
    thinnable: false
  },
  {
    id: 'long',
    name: '장발',
    texture: 'strand',
    front: { x: 5, y: 2, rows: [
      '.......bbbbbbdb.......',
      '.....bbhhhhhhhbdb.....',
      '....bhhbbbbbbbbbdb....',
      '...bhbbdbbdbbdbbbdb...',
      '..bhbbbdbbdbbdbbdbdb..',
      '..hbdbbdbbddbdbbdbdb..',
      '..bbdbbddd..ddbbdbdb..',
      '..bbdbdd......dddbdd..',
      '..bbdd..........dbdd..',
      '..bbd............ddd..',
      '.bbb..............bdb.',
      '.hbb..............bdb.',
      '.bbb..............bdb.',
      '.dbb..............bdb.',
      '.dbb..............bdb.',
      '.dbb..............bdb.',
      '.dbb..............bdb.',
      '.dbb..............bdb.',
      '.dbb..............bdb.',
      'bdbbb............bbddb',
      'hdbbh............bbddb',
      'bdbbb............bbddb',
      'bdbbd............bbddb',
      'bdbbd............bbddb',
      'bdbbd............bbddb',
      'bdbbd............bbddb',
      'ddddd............ddddd'
    ] },
    back: { x: 7, y: 8, rows: [
      'bbbbbbbbbbbbbbbbdb',
      'hhhhhhhhhhhhbbbbdb',
      'bbbbbbbbbbbbbbbbdb',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'bbdbbdbbdbbdbbdbdd',
      'dddddddddddddddddd'
    ] },
    thinnable: false
  },
  {
    id: 'spike',
    name: '스파이크',
    texture: 'plain',
    front: { x: 7, y: 0, rows: [
      '....b...bb...b....',
      '...bhb.bhhb.bdb...',
      '..bhbhbhbbhbbbdb..',
      '.bhbbbhbbbbbbbbdb.',
      '.bbbbbbbbbbbbbbdb.',
      'bbbbbbbbbbbbbbbbdb',
      'bbbbbbbbbbbbbbbbdb',
      'bbbddddddddddddbdb',
      'bbd............ddb',
      'bb..............db',
      'db..............dd',
      '.d..............d.'
    ] },
    back: null,
    thinnable: true
  },
  {
    id: 'sidepart',
    name: '가르마',
    texture: 'plain',
    front: { x: 7, y: 1, rows: [
      '......bbbbbb......',
      '...bdbhhhhhbbdb...',
      '.bbhdhhbhbbbbbbdb.',
      '.bhhddbbbbbbbbbdb.',
      'bbbbbdbbbbbbbbbbdb',
      'bbbbbbbbbbbbbbbbdb',
      'bbbbbbbbbbbddddbdb',
      'bbbbddddddd....ddb',
      'bbbd............dd',
      'dbd...............',
      '.b..............b.',
      '.d..............d.'
    ] },
    back: null,
    thinnable: true
  },
  {
    id: 'afro',
    name: '아프로',
    texture: 'curl',
    front: { x: 4, y: 0, rows: [
      '.......bbbdhbbbbh.......',
      '....bbbhbhbhhhdbbhbb....',
      '..bhhbhbhbbdbhbbbbhbbb..',
      '.dbhhbbbdhbbbbhdbbbhbbd.',
      'hbbbbhbbbbhbdbbhbbbdhbbb',
      'bhdbbbhbbdbhbbbbhbbbbhbd',
      'bbhbbbdhbbbbhdbbbhbbdbhb',
      'bbbhbbbbhddbbhdbbdhbbbbh',
      'dbbbhbddd.dddd.dddbhbdbb',
      'hbbbdh............dbhbbb',
      'dhbbb..............bbhdd',
      '.bhbb..............dbbh.',
      '.ddhd..............dddd.'
    ] },
    back: null,
    thinnable: false
  },
  {
    id: 'bald',
    name: '민머리',
    texture: 'plain',
    front: null,
    back: null,
    thinnable: false
  }
];

export const HAIR_THIN: readonly Grid[] = [
  { x: 7, y: 7, rows: [
    'xxxxxx......xxxxxx',
    'xxxxxx......xxxxxx'
  ] },
  { x: 0, y: 0, rows: [
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  ] }
];

export const TORSO_ADULT: Grid = { x: 3, y: 23, rows: [
    '.......ssssssssssss.......',
    '....ssssssssssssssssss....',
    '..ssssssssssssssssssssss..',
    '.ssssssssssssssssssssssss.',
    'ssssssssssssssssssssssssss',
    'ssssssssssssssssssssssssss',
    'ssssssssssssssssssssssssss',
    'ssssssssssssssssssssssssss',
    'ssssssssssssssssssssssssss'
  ] };

export const TORSO_YOUTH: Grid = { x: 5, y: 23, rows: [
    '......ssssssssss......',
    '....ssssssssssssss....',
    '..ssssssssssssssssss..',
    '.ssssssssssssssssssss.',
    'ssssssssssssssssssssss',
    'ssssssssssssssssssssss',
    'ssssssssssssssssssssss',
    'ssssssssssssssssssssss',
    'ssssssssssssssssssssss'
  ] };

export const NECK: Grid = { x: 12, y: 19, rows: [
    'nnnnnnnn',
    'nnnnnnnn',
    'nnnnnnnn',
    'nnnnnnnn',
    'nnnnnnnn',
    'nnnnnnnn'
  ] };

export const COLLARS = {
  round: { x: 11, y: 23, rows: [
    'c::::::::c',
    '.c::::::c.',
    '..c::::c..',
    '...cccc...'
  ] },
  vneck: { x: 11, y: 23, rows: [
    'c::::::::c',
    '.c::::::c.',
    '..c::::c..',
    '...c::c...',
    '....cc....'
  ] },
  polo: { x: 10, y: 23, rows: [
    'cccc::::cccc',
    '.ccc::::ccc.',
    '..ccc::ccc..',
    '.....xx.....'
  ] },
  jacket: { x: 10, y: 21, rows: [
    '.cc......cc.',
    'ccc......ccc',
    'cccc::::cccc',
    'cccc::::cccc',
    '.cccc::cccc.',
    '.....x......',
    '.....x......',
    '.....x......',
    '.....x......',
    '.....x......',
    '.....x......'
  ] },
  suit: { x: 11, y: 22, rows: [
    '.ww....ww.',
    'www::::www',
    'xww.tt.wwx',
    '.xwwttwwx.',
    '..xwttwx..',
    '..x.uu.x..',
    '...xttx...',
    '....tt....',
    '....uu....'
  ] },
  shirt: { x: 11, y: 22, rows: [
    '.cc....cc.',
    'ccc::::ccc',
    '.ccc::ccc.',
    '...xxxx...',
    '....x.....',
    '....w.....',
    '....x.....',
    '....x.....',
    '....w.....',
    '....x.....'
  ] }
} as const;

export const BEARDS: readonly Grid[] = [
  { x: 9, y: 14, rows: [
    'z............z',
    'z............z',
    'z............z',
    'z.z.......z.z.',
    '.z.z.......z.z',
    'z.z.z.z.z.z.z.',
    '.z.z.z.z.z.z.z',
    'z.z.z.z.z.z.z.',
    '.z.z.z.z.z.z.z'
  ] },
  { x: 9, y: 14, rows: [
    'b............b',
    'b............b',
    'bb..........bb',
    'bbbbbbbbbbbbbb',
    'bbbbb....bbbbb',
    'bbbbb....bbbbb',
    'bbbbbbbbbbbbbb',
    'dddddddddddddd',
    'dddddddddddddd'
  ] },
  { x: 12, y: 17, rows: [
    '.bb..bb.',
    'bbbbbbbb',
    'd......d'
  ] }
];

export interface BrowSet {
  thin: readonly Point[];
  thick: readonly Point[];
  thinStern: readonly Point[];
  thickStern: readonly Point[];
}

export const BROWS_ADULT: BrowSet = { thin: [[10, 11], [11, 11], [12, 11], [13, 11], [21, 11], [20, 11], [19, 11], [18, 11]], thick: [[10, 11], [11, 11], [12, 11], [13, 11], [11, 10], [12, 10], [13, 10], [21, 11], [20, 11], [19, 11], [18, 11], [20, 10], [19, 10], [18, 10]], thinStern: [[10, 11], [11, 11], [12, 12], [13, 12], [21, 11], [20, 11], [19, 12], [18, 12]], thickStern: [[10, 11], [11, 11], [12, 12], [13, 12], [10, 10], [11, 10], [12, 11], [13, 11], [21, 11], [20, 11], [19, 12], [18, 12], [21, 10], [20, 10], [19, 11], [18, 11]] };

export const BROWS_YOUTH: BrowSet = { thin: [[11, 11], [12, 11], [13, 11], [20, 11], [19, 11], [18, 11]], thick: [[11, 11], [12, 11], [13, 11], [11, 10], [12, 10], [13, 10], [20, 11], [19, 11], [18, 11], [20, 10], [19, 10], [18, 10]], thinStern: [[11, 11], [12, 12], [13, 12], [20, 11], [19, 12], [18, 12]], thickStern: [[11, 11], [12, 12], [13, 12], [11, 10], [12, 11], [13, 11], [20, 11], [19, 12], [18, 12], [20, 10], [19, 11], [18, 11]] };

export const EYES_ADULT: readonly { x: number; y: number; rows: readonly string[] }[] = [{ x: 10, y: 13, rows: ['kkkk', 'wiiw'] }, { x: 18, y: 13, rows: ['kkkk', 'wiiw'] }];

export const EYES_YOUTH: readonly { x: number; y: number; rows: readonly string[] }[] = [{ x: 11, y: 13, rows: ['kkk', 'wii'] }, { x: 18, y: 13, rows: ['kkk', 'iiw'] }];

export const NOSES: readonly (readonly Point[])[] = [[[16, 17]], [[15, 17], [16, 17]], [[16, 16], [16, 17]]];

export const MOUTHS = {
  neutral: [[15, 19], [16, 19]] as readonly Point[],
  smile: [[15, 19], [16, 19], [14, 18], [17, 18]] as readonly Point[],
  stern: [[14, 19], [15, 19], [16, 19], [17, 19]] as readonly Point[]
};

export const WRINKLES: readonly (readonly Point[])[] = [
  [[12, 9], [13, 9], [14, 9], [17, 9], [18, 9], [19, 9]],
  [[12, 9], [13, 9], [14, 9], [17, 9], [18, 9], [19, 9], [13, 17], [18, 17]],
  [[12, 9], [13, 9], [14, 9], [17, 9], [18, 9], [19, 9], [13, 8], [14, 8], [17, 8], [18, 8], [13, 17], [13, 18], [18, 17], [18, 18], [9, 13], [22, 13]]
];

