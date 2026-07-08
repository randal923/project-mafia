type ClassValue = string | false | null | undefined;

export function cx(...classNames: readonly ClassValue[]) {
  return classNames.filter(Boolean).join(" ");
}
