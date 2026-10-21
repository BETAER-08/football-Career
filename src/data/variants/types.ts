export interface EventVariants {
  t?: string[];
  tb?: string[];
  o?: Record<string, string[]>;
}

export type VariantTable = Record<string, EventVariants>;
