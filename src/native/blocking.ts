// Веб, Android и всё, где нет Screen Time API: блокировки нет.
import type { BlockingApi } from './types';

export const blocking: BlockingApi = {
  isAvailable: () => false,
  authorization: () => 'unavailable',
  requestAuthorization: async () => 'unavailable',
  schedule: async () => {},
  unlockNow: () => {},
  stop: () => {},
};
