import { Platform, useWindowDimensions } from 'react-native';

/** Ширина окна, но на вебе не шире колонки 480 (см. _layout). */
export const WEB_MAX_WIDTH = 480;

export function useScreen() {
  const { width, height } = useWindowDimensions();
  return { width: Platform.OS === 'web' ? Math.min(width, WEB_MAX_WIDTH) : width, height };
}
