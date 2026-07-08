export const moneyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency"
});

export const numberFormatter = new Intl.NumberFormat("en-US");

export function formatIdentifier(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}
