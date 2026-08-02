/** Sellable distinct GT full mocks — not the old 6-slot recycle set. */
export const GT_SELLABLE_MOCK_NUMBERS = [1, 2, 3] as const;

export type GtSellableMockNumber = (typeof GT_SELLABLE_MOCK_NUMBERS)[number];

export function isGtSellableMockNumber(n: number): n is GtSellableMockNumber {
  return (GT_SELLABLE_MOCK_NUMBERS as readonly number[]).includes(n);
}
