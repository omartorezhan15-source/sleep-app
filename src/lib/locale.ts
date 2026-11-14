import { getLocales } from 'expo-localization';

export function deviceLocale(): 'ru' | 'en' {
  const code = getLocales()[0]?.languageCode;
  return code === 'ru' || code === 'uk' || code === 'be' || code === 'kk' ? 'ru' : 'en';
}
