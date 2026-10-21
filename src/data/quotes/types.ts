export type QuoteWho = 'coach' | 'youthcoach' | 'captain' | 'mate' | 'rival' | 'agent' | 'reporter' | 'director' | 'father' | 'mother' | 'partner' | 'sibling' | 'oldmate' | 'oldrival';

export type Persona = 'w' | 's' | 't' | 'c' | '';

export type QuoteRow = readonly [tag: string, who: QuoteWho, persona: Persona, text: string];
