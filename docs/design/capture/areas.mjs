// Each screen's files sit in a folder for its area, named by the ID's letter.

const areas = { A: 'account', H: 'home', W: 'workout', L: 'logging', R: 'routines', E: 'exercises' };

/** The area folder for a screen ID or file name, for example W01 → workout. */
export function areaOf(idOrFile) {
  return areas[idOrFile[0]];
}

/** A screen file's path inside screens/, html/ or source/, for example workout/W01-Workout-Today.png. */
export function areaPath(file, extension) {
  return `${areaOf(file)}/${file}.${extension}`;
}
