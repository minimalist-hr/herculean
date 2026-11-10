interface SupersetLink {
  /** Done as a superset with the exercise after it. */
  supersetWithNext: boolean;
}

/** Whether two neighbouring exercises read as one block, because they are a superset. A last exercise has no one to join. */
export function inSuperset(above: SupersetLink, below?: unknown) {
  return above.supersetWithNext && below !== undefined;
}

/** Exercises as blocks: a superset's two exercises together, every other exercise on its own. */
export function supersetBlocks<T extends SupersetLink>(exercises: T[]) {
  const blocks: T[][] = [];
  for (const [index, exercise] of exercises.entries()) {
    const block = blocks.at(-1);
    const previous = exercises.at(index - 1);
    if (
      block !== undefined &&
      previous !== undefined &&
      index > 0 &&
      inSuperset(previous, exercise)
    ) {
      block.push(exercise);
    } else {
      blocks.push([exercise]);
    }
  }

  return blocks;
}

/** The exercises without the one at this place. Removing the second of a superset ends it. */
export function withoutExercise<T extends SupersetLink>(
  exercises: T[],
  index: number,
) {
  return exercises
    .filter((_, at) => at !== index)
    .map((item, at) =>
      at === index - 1 && item.supersetWithNext
        ? { ...item, supersetWithNext: false }
        : item,
    );
}

/** The places of the block the exercise at this place is in: its superset's two, or only its own. */
export function blockAt(exercises: SupersetLink[], index: number) {
  const previous = exercises.at(index - 1);
  if (
    index > 0 &&
    previous !== undefined &&
    inSuperset(previous, exercises[index])
  ) {
    return [index - 1, index];
  }

  return inSuperset(exercises[index], exercises.at(index + 1))
    ? [index, index + 1]
    : [index];
}

/** The set to do next in a superset: a set of each in turn, so 1 of the first, 1 of the second, then 2 of each. */
export function nextSupersetSet(
  pair: { sets: { id: string; checked: boolean }[] }[],
) {
  const rounds = Math.max(...pair.map((exercise) => exercise.sets.length));
  for (let round = 0; round < rounds; round++) {
    for (const exercise of pair) {
      const set = exercise.sets.at(round);
      if (set !== undefined && !set.checked) {
        return set.id;
      }
    }
  }

  return undefined;
}

/** Whether checking this set of a superset's first exercise goes straight on to the second, with no rest between. */
export function goesOnToSecond(
  exercise: SupersetLink,
  setIndex: number,
  next: { sets: { checked: boolean }[] } | undefined,
) {
  const partner = next?.sets.at(setIndex);

  return exercise.supersetWithNext && partner !== undefined && !partner.checked;
}

/** Why an exercise can't start a superset with the one after it, or undefined when it can. */
export function supersetBlocked(
  previous: SupersetLink | undefined,
  next: (SupersetLink & { name: string }) | undefined,
) {
  if (next === undefined) {
    return 'Add an exercise after this one first.';
  }
  if (previous?.supersetWithNext === true) {
    return 'A superset is two exercises.';
  }

  return next.supersetWithNext
    ? `${next.name} is already in a superset.`
    : undefined;
}
