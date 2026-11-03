interface JoinedCard {
  /** Whether it joins the card above. */
  withPrevious: boolean;
  /** Whether it joins the card below. */
  withNext: boolean;
  /** The gap between cards that aren't joined. */
  gap: number;
  radius: number;
}

/** Makes neighbouring cards read as one block: no gap, one shared border, and round corners only outside. */
export function joinedCardStyle({
  withPrevious,
  withNext,
  gap,
  radius,
}: JoinedCard) {
  return {
    marginTop: withPrevious ? -(gap + 1) : 0,
    borderTopLeftRadius: withPrevious ? 0 : radius,
    borderTopRightRadius: withPrevious ? 0 : radius,
    borderBottomLeftRadius: withNext ? 0 : radius,
    borderBottomRightRadius: withNext ? 0 : radius,
  };
}
