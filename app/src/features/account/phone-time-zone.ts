import { getCalendars } from 'expo-localization';

/** The phone's IANA time zone, which the API uses for dates and days. UTC only if the phone has none. */
export function phoneTimeZone() {
  return getCalendars().at(0)?.timeZone ?? 'UTC';
}
