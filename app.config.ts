import type { ConfigContext, ExpoConfig } from 'expo/config';

// Настройки сборки для iPhone (этап 2). Значения можно поменять через переменные окружения EAS,
// не трогая код: LUNA_BUNDLE_ID — идентификатор приложения (его нельзя менять после публикации),
// APPLE_TEAM_ID — Team ID из аккаунта Apple Developer (появится после покупки аккаунта).
const BUNDLE_ID = process.env.LUNA_BUNDLE_ID ?? 'com.lunasleep.app';
const APP_GROUP = `group.${BUNDLE_ID}`;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || undefined;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Luna',
  slug: config.slug ?? 'luna-sleep',
  ios: {
    ...config.ios,
    bundleIdentifier: BUNDLE_ID,
    appleTeamId: APPLE_TEAM_ID,
    supportsTablet: false,
    infoPlist: {
      ...config.ios?.infoPlist,
      // AlarmKit (iOS 26+): системное окно разрешения покажет этот текст.
      NSAlarmKitUsageDescription: 'Luna будит тебя настоящим будильником в выбранное время — даже в беззвучном режиме.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...config.android,
    package: BUNDLE_ID,
  },
  plugins: [
    ...(config.plugins ?? []).filter((p) => p !== 'expo-build-properties'),
    // Expo SDK 58 требует iOS 16.4+; Screen Time «для себя» (individual) работает с iOS 16.
    ['expo-build-properties', { ios: { deploymentTarget: '16.4' } }],
    ['expo-camera', { cameraPermission: 'Luna просит камеру для утреннего задания: сфотографировать небо у окна.' }],
    ['expo-sensors', { motionPermission: 'Luna считает шаги для утреннего задания «30 шагов».' }],
    // Блокировка приложений ночью: расширения ActivityMonitor, ShieldConfiguration, ShieldAction.
    ['react-native-device-activity', { appleTeamId: APPLE_TEAM_ID, appGroup: APP_GROUP }],
  ],
  extra: {
    ...config.extra,
    appGroup: APP_GROUP,
    eas: {
      ...config.extra?.eas,
      build: {
        experimental: {
          ios: {
            // Чтобы EAS создал профили подписи и для расширений Screen Time.
            appExtensions: ['ActivityMonitorExtension', 'ShieldAction', 'ShieldConfiguration'].map((targetName) => ({
              targetName,
              bundleIdentifier: `${BUNDLE_ID}.${targetName}`,
              entitlements: {
                'com.apple.developer.family-controls': true,
                'com.apple.security.application-groups': [APP_GROUP],
              },
            })),
          },
        },
      },
    },
  },
});
