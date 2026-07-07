export function formatSignedMoney(value: number): string {
  return value >= 0 ? `+$${value}` : `-$${Math.abs(value)}`;
}
