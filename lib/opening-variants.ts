export interface OpeningVariant {
  style: string;
  message: string;
  tone: string;
  weight: number;
}

export const openingVariants: OpeningVariant[] = [
  {
    style: "stop",
    message: "Stop. Stand up now. Close it, lock the screen, and step away.",
    tone:
      "Direct, urgent, and serious. Interrupt fast without softening the instruction.",
    weight: 4,
  },
  {
    style: "cycle",
    message:
      "You're starting the cycle again. Stand up, lock the screen, and move.",
    tone:
      "Clear and pattern-breaking. Name the loop plainly without shaming the caller.",
    weight: 3,
  },
  {
    style: "called",
    message:
      "You know why I called you, right? Close it. Lock the screen. Get up.",
    tone:
      "Human, familiar, and firm. Sound present, not scripted or theatrical.",
    weight: 2,
  },
  {
    style: "worth",
    message: "It's not worth it. Stand up now, lock the screen, and step away.",
    tone:
      "Urgent and grounding. Challenge the urge's promise without lecturing.",
    weight: 2,
  },
  {
    style: "fooled",
    message: "Don't be fooled. One peek is the loop. Close it and move.",
    tone:
      "Protective and direct. Call out the trap while keeping the caller capable.",
    weight: 2,
  },
  {
    style: "reset",
    message:
      "Feet on the floor. Screen locked. Walk away before the urge gets louder.",
    tone:
      "Calm, physical, and action-oriented. Focus on immediate movement.",
    weight: 2,
  },
];

export type SelectedOpeningVariant = Omit<OpeningVariant, "weight">;

export function selectOpeningVariant(
  randomValue = Math.random(),
): SelectedOpeningVariant {
  const safeRandom = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 0.999999)
    : 0;
  const totalWeight = openingVariants.reduce(
    (total, variant) => total + variant.weight,
    0,
  );
  const target = safeRandom * totalWeight;
  let cumulativeWeight = 0;

  for (const { weight, ...variant } of openingVariants) {
    cumulativeWeight += weight;
    if (target < cumulativeWeight) {
      return variant;
    }
  }

  const { weight: _weight, ...fallback } =
    openingVariants[openingVariants.length - 1]!;
  return fallback;
}
