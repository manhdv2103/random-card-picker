import { ensureCardRef } from "../card";
import { CardRef, SafeCardRef } from "../card/header";

export function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function throttle<T extends (...args: any[]) => any>(
  callback: T,
  interval: number
): T {
  let enableCall = true;

  return function (...args: any[]) {
    if (!enableCall) return;

    enableCall = false;
    callback.apply(this, args);
    setTimeout(() => (enableCall = true), interval);
  } as T;
}

export function shuffle(arr: any[]) {
  const array = [...arr];
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function transpose(matrix: any[][]) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function ensureCardsRef(
  cardsRef: (CardRef | null)[]
): cardsRef is SafeCardRef[] {
  return cardsRef.every(ensureCardRef);
}
