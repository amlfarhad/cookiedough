export function normalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";
  return url.toString();
}

export function sameOrigin(left: string, right: string): boolean {
  return new URL(left).origin === new URL(right).origin;
}
