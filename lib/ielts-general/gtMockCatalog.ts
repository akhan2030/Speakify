/** Sellable distinct GT full mocks — not the old 6-slot recycle set. */
export const GT_SELLABLE_MOCK_NUMBERS = [1, 2, 3] as const;

export const ALL_GT_MOCK_NUMBERS: readonly number[] = [...GT_SELLABLE_MOCK_NUMBERS];

export type GtSellableMockNumber = (typeof GT_SELLABLE_MOCK_NUMBERS)[number];

export function isGtSellableMockNumber(n: number): n is GtSellableMockNumber {
  return (GT_SELLABLE_MOCK_NUMBERS as readonly number[]).includes(n);
}

/** @alias isGtSellableMockNumber — used by access layer */
export function isValidGtMockNumber(n: number): boolean {
  return isGtSellableMockNumber(n);
}
