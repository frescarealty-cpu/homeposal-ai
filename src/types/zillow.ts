export type ZillowZestimatePayload = {
  address: string;
  /** Property value estimate in USD (not cents). */
  zestimateUsd?: number | null;
  /** Optional rent estimate in USD (not cents). */
  rentZestimateUsd?: number | null;
  /** Optional range bounds in USD (not cents). */
  zestimateRangeLowUsd?: number | null;
  zestimateRangeHighUsd?: number | null;
  /** ISO timestamp when the data was last updated (if provided by upstream). */
  lastUpdated?: string | null;
  /** Provider-specific raw payload, for debugging/inspection. */
  raw?: unknown;
};

