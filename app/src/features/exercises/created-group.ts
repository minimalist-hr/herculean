let created: string | null = null;

/** Remembers a group made from a picker, so the picker can select it on the way back. */
export function rememberCreatedGroup(id: string) {
  created = id;
}

/** The group made from a picker, once. */
export function takeCreatedGroup() {
  const id = created;
  created = null;

  return id;
}
