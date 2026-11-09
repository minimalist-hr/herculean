/** Whether two neighbouring exercises read as one block, because they train the same group. */
export function sameGroup(
  above: { groupId: string },
  below: { groupId: string },
) {
  return above.groupId === below.groupId;
}

/** Neighbouring exercises of the same group, as blocks. */
export function groupBlocks<T extends { groupId: string }>(exercises: T[]) {
  const blocks: T[][] = [];
  for (const exercise of exercises) {
    const block = blocks.at(-1);
    if (block !== undefined && sameGroup(block[0], exercise)) {
      block.push(exercise);
    } else {
      blocks.push([exercise]);
    }
  }

  return blocks;
}
