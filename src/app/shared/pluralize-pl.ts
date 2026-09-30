/**
 * Polish plural form for a count: 1 -> singular, 2-4 (but not 12-14) -> few,
 * everything else (0, 5+, 12-14, ...) -> many. E.g. `pluralizePl(count, 'pytanie', 'pytania', 'pytań')`.
 */
export function pluralizePl(count: number, singular: string, few: string, many: string): string {
  if (count === 1) {
    return singular;
  }

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  const isFew = lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14);

  return isFew ? few : many;
}

export function questionsLabel(count: number): string {
  return `${count} ${pluralizePl(count, 'pytanie', 'pytania', 'pytań')}`;
}
