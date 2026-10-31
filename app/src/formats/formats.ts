// Every format the app shows, from design section 8, is defined here and nowhere else.

/** A time as minutes and seconds, for example 90 → "1:30". Used for rest times and the elapsed time while logging. */
export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

/** The same time in words, for screen readers, for example 90 → "1 minute 30 seconds". */
export function formatSpokenDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    minutes > 0 ? plural(minutes, 'minute') : '',
    seconds > 0 || minutes === 0 ? plural(seconds, 'second') : '',
  ];
  return parts.filter((part) => part !== '').join(' ');
}

function plural(count: number, unit: string) {
  return `${String(count)} ${unit}${count === 1 ? '' : 's'}`;
}
