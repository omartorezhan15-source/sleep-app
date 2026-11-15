// Утреннее задание (этап 2, DESIGN_BRIEF.md, раздел 6): фото у окна, 3 примера или 30 шагов.
// Выполненное задание снимает ночную блокировку и останавливает будильник.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton, PillButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { BackIcon, BackspaceIcon, CameraIcon, CheckIcon, StepsIcon } from '@/components/Icons';
import { Moon } from '@/components/Moon';
import { ProgressRing } from '@/components/ProgressRing';
import { SkyBackground } from '@/components/SkyBackground';
import { Sun } from '@/components/Sun';
import { TaskBadge } from '@/components/TaskPicker';
import { fill, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { MATH_COUNT, MIN_BRIGHTNESS, STEPS_GOAL, jpegBrightness, mathProblems } from '@/lib/morningTask';
import { nightKey } from '@/lib/time';
import { useDayPhase, useNow } from '@/lib/useNow';
import { onMorningTaskDone } from '@/native/nightPlan';
import { useApp } from '@/store/useApp';
import { dawn, fonts, night, radius, space } from '@/theme';

const GOLD = '#F6C453';
const GOLD_DEEP = '#C98A1B';

export default function Task() {
  const { t } = useT();
  const now = useNow();
  const phase = useDayPhase(now);
  const { taskType, nights, completeTask } = useApp();
  const done = !!nights[nightKey(now)]?.taskDoneAt;
  const [justDone, setJustDone] = useState(false);
  // Задание доступно только утром (за час до подъёма и позже), иначе его можно было бы «сделать» в 23:00.
  const available = phase === 'morning';
  const finished = done || justDone;
  const isNight = !finished && !available;

  const finish = () => {
    completeTask();
    // На iPhone: снять блокировку сразу и отменить сегодняшние звонки будильника.
    onMorningTaskDone().catch(() => {});
    haptic.success();
    setJustDone(true);
  };

  return (
    <SkyBackground mode={isNight ? 'night' : 'dawn'}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton label={t.common.back} tone={isNight ? 'night' : 'dawn'} onPress={() => router.back()}>
            <BackIcon color={isNight ? night.secondary : dawn.secondary} />
          </IconButton>
          <AppText variant="label" color={isNight ? night.textSecondary : dawn.textSecondary}>
            {t.task.title}
          </AppText>
          <View style={{ width: 44 }} />
        </View>

        {finished ? (
          <Done />
        ) : isNight ? (
          <Evening />
        ) : (
          <Animated.View entering={FadeIn.duration(500)} style={styles.body}>
            {taskType === 'sky' && <SkyTask onDone={finish} />}
            {taskType === 'math' && <MathTask onDone={finish} />}
            {taskType === 'steps' && <StepsTask onDone={finish} />}
          </Animated.View>
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

/** Заголовок задания: название и короткая подсказка. */
function Intro({ type }: { type: 'sky' | 'math' | 'steps' }) {
  const { t } = useT();
  return (
    <View style={{ alignItems: 'center', marginBottom: space.md }}>
      <AppText variant="title" align="center" color={dawn.text}>
        {t.task.names[type]}
      </AppText>
      <AppText variant="caption" align="center" color={dawn.textSecondary} style={{ marginTop: 4, maxWidth: 320 }}>
        {t.task.hints[type]}
      </AppText>
    </View>
  );
}

/** Спокойная карточка-сообщение (нет доступа, слишком темно и т. п.). */
function Notice({ icon, text, children }: { icon: ReactNode; text: string; children?: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Glass tone="dawn">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={styles.noticeIcon}>{icon}</View>
          <AppText style={{ flex: 1, fontSize: 15, lineHeight: 21 }} color={dawn.text}>
            {text}
          </AppText>
        </View>
        {children}
      </Glass>
    </Animated.View>
  );
}

function ChangeTaskLink() {
  const { t } = useT();
  return (
    <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/settings')} style={{ padding: 12 }}>
      <AppText align="center" color={dawn.secondary} style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
        {t.task.changeTask}
      </AppText>
    </Pressable>
  );
}

// ───────────────────────── Фото у окна ─────────────────────────

function SkyTask({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [tooDark, setTooDark] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = busy
      ? withRepeat(withSequence(withTiming(0.82, { duration: 450 }), withTiming(1, { duration: 450 })), -1)
      : withTiming(1, { duration: 200 });
  }, [busy, pulse]);
  const shutterStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Intro type="sky" />
        <Notice icon={<CameraIcon color={GOLD_DEEP} />} text={t.task.cameraDenied}>
          {permission.canAskAgain && (
            <PillButton
              tone="dawn"
              label={t.task.allowCamera}
              onPress={requestPermission}
              style={{ marginTop: space.md }}
            />
          )}
        </Notice>
        <ChangeTaskLink />
      </View>
    );
  }

  const shoot = async () => {
    if (!camera.current) return;
    setBusy(true);
    setTooDark(false);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.4 });
      // Уменьшаем до 24 px и считаем среднюю яркость — светло ли там, где человек сейчас.
      const small = await ImageManipulator.manipulate(photo.uri).resize({ width: 24 }).renderAsync();
      const saved = await small.saveAsync({ base64: true, format: SaveFormat.JPEG, compress: 0.8 });
      const brightness = saved.base64 ? jpegBrightness(saved.base64) : 0;
      if (brightness >= MIN_BRIGHTNESS) onDone();
      else {
        haptic.light();
        setTooDark(true);
      }
    } catch {
      setTooDark(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Intro type="sky" />
      <View style={styles.frame}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
        {/* Уголки видоискателя */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
          <View key={k} pointerEvents="none" style={[styles.corner, styles[k]]} />
        ))}
        {tooDark && (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.frameNote}>
            <AppText align="center" color={dawn.text} style={{ fontSize: 15, lineHeight: 21 }}>
              {t.task.tooDark}
            </AppText>
          </Animated.View>
        )}
      </View>
      <View style={styles.shutterWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.task.takePhoto}
          disabled={busy}
          onPress={() => {
            haptic.light();
            shoot();
          }}
          style={styles.shutterRing}
        >
          <Animated.View style={[styles.shutter, shutterStyle]} />
        </Pressable>
        <AppText variant="caption" color={dawn.textSecondary} style={{ marginTop: 8 }}>
          {busy ? t.task.checking : t.task.takePhoto}
        </AppText>
      </View>
    </View>
  );
}

// ───────────────────────── 3 примера ─────────────────────────

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;

function MathTask({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const key = nightKey(useNow(60_000));
  // Примеры зависят от даты: каждый день новые, но не меняются при перерисовке.
  const problems = useMemo(() => mathProblems(Number(key.replace(/-/g, '')) % 100000), [key]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const check = () => {
    if (!value) return;
    if (Number(value.trim()) === problems[i].answer) {
      haptic.success();
      setValue('');
      setWrong(false);
      if (i + 1 >= MATH_COUNT) onDone();
      else setI(i + 1);
    } else {
      haptic.light();
      setWrong(true);
      // Мягкая «тряска» вместо красного цвета.
      shake.set(
        withSequence(
          withTiming(-9, { duration: 60 }),
          withTiming(9, { duration: 60 }),
          withTiming(-6, { duration: 60 }),
          withTiming(6, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        ),
      );
    }
  };

  const press = (k: (typeof KEYS)[number]) => {
    if (k === 'ok') return check();
    haptic.tick();
    setWrong(false);
    setValue((v) => (k === 'del' ? v.slice(0, -1) : v.length < 4 ? v + k : v));
  };

  // В браузере на компьютере можно печатать с клавиатуры.
  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) pressRef.current(e.key as (typeof KEYS)[number]);
      else if (e.key === 'Backspace') pressRef.current('del');
      else if (e.key === 'Enter') pressRef.current('ok');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.dots} accessibilityLabel={fill(t.task.progress, { n: i + 1, total: MATH_COUNT })}>
        {problems.map((_, n) => (
          <View key={n} style={[styles.dot, n < i && styles.dotDone, n === i && styles.dotNow]} />
        ))}
      </View>

      <View style={styles.mathCenter}>
        <Animated.View key={i} entering={FadeInDown.duration(400)}>
          <AppText style={styles.problem} color={dawn.text} align="center">
            {problems[i].text}
          </AppText>
        </Animated.View>
        <Animated.View style={[styles.answer, !!value && styles.answerFilled, shakeStyle]}>
          <AppText style={styles.answerText} color={value ? dawn.text : 'rgba(59,42,63,0.3)'}>
            {value || '?'}
          </AppText>
        </Animated.View>
        <AppText variant="caption" color={dawn.textSecondary} style={{ height: 22, marginTop: 10 }}>
          {wrong ? t.task.wrong : ' '}
        </AppText>
      </View>

      <View style={styles.pad}>
        {KEYS.map((k) => {
          const ok = k === 'ok';
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={ok ? t.task.check : k === 'del' ? '⌫' : k}
              disabled={ok && !value}
              onPress={() => press(k)}
              style={({ pressed }) => [
                styles.key,
                ok && styles.keyOk,
                ok && !value && { opacity: 0.45 },
                pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 },
              ]}
            >
              {ok ? (
                <CheckIcon size={26} color={dawn.text} />
              ) : k === 'del' ? (
                <BackspaceIcon color={dawn.text} />
              ) : (
                <AppText style={styles.keyText} color={dawn.text}>
                  {k}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ───────────────────────── 30 шагов ─────────────────────────

function StepsTask({ onDone }: { onDone: () => void }) {
  const { t, f } = useT();
  const [state, setState] = useState<'checking' | 'unavailable' | 'denied' | 'counting'>('checking');
  const [steps, setSteps] = useState(0);
  // onDone меняется при каждом рендере — держим его в ref, чтобы не переподписываться на шагомер.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    (async () => {
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      if (!available) return setState('unavailable');
      const perm = await Pedometer.requestPermissionsAsync().catch(() => null);
      if (!perm?.granted) return setState('denied');
      setState('counting');
      sub = Pedometer.watchStepCount((r) => {
        setSteps(r.steps);
        if (r.steps >= STEPS_GOAL) {
          sub?.remove();
          onDoneRef.current();
        }
      });
    })();
    return () => sub?.remove();
  }, []);

  if (state === 'unavailable' || state === 'denied') {
    return (
      <View style={styles.centered}>
        <Intro type="steps" />
        <Notice
          icon={<StepsIcon color={GOLD_DEEP} />}
          text={state === 'denied' ? t.task.stepsDenied : t.task.stepsUnavailable}
        />
        <ChangeTaskLink />
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Intro type="steps" />
      <View style={{ alignItems: 'center', marginTop: space.lg }}>
        <StepsRing steps={steps} />
        <AppText variant="caption" color={dawn.textSecondary} style={{ marginTop: space.lg }}>
          {f(t.task.stepsLeft, { n: Math.max(0, STEPS_GOAL - steps) })}
        </AppText>
      </View>
    </View>
  );
}

export function StepsRing({ steps }: { steps: number }) {
  const { t, f } = useT();
  const shown = Math.min(steps, STEPS_GOAL);
  return (
    <ProgressRing progress={shown / STEPS_GOAL} size={248} stroke={20}>
      <AppText style={styles.ringValue} color={dawn.text}>
        {shown}
      </AppText>
      <AppText variant="caption" color={dawn.textSecondary} style={{ marginTop: -4 }}>
        {f(t.task.of, { n: STEPS_GOAL })}
      </AppText>
    </ProgressRing>
  );
}

// ───────────────────────── Итог и вечер ─────────────────────────

const SPARKS = [
  { x: -118, y: -40, s: 16, d: 0 },
  { x: 112, y: -72, s: 12, d: 500 },
  { x: 132, y: 30, s: 18, d: 900 },
  { x: -96, y: 62, s: 11, d: 1300 },
  { x: -30, y: -128, s: 13, d: 300 },
  { x: 56, y: 118, s: 10, d: 1100 },
];

function Spark({ x, y, s, d }: (typeof SPARKS)[number]) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(
      1400 + d,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [o, d]);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: 0.7 + o.value * 0.3 }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: '50%', top: '50%', marginLeft: x, marginTop: y }, style]}>
      <AppText style={{ fontSize: s, lineHeight: s + 2 }} color="#FFE7A8">
        ✦
      </AppText>
    </Animated.View>
  );
}

function Done() {
  const { t } = useT();
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.doneCenter}>
        <View>
          <Sun size={280} />
          {SPARKS.map((s, i) => (
            <Spark key={i} {...s} />
          ))}
        </View>
        <Animated.View entering={FadeInDown.delay(900).duration(700)} style={{ marginTop: -12 }}>
          <AppText variant="title" align="center" color={dawn.text} style={{ fontSize: 34, lineHeight: 42 }}>
            {t.task.done}
          </AppText>
          <AppText align="center" color={dawn.textSecondary} style={{ marginTop: 6, fontSize: 17 }}>
            {t.task.doneSub}
          </AppText>
        </Animated.View>
      </View>
      <Animated.View entering={FadeIn.delay(1500).duration(600)} style={styles.footer}>
        {Platform.OS === 'web' && (
          <AppText variant="caption" align="center" color={dawn.textSecondary} style={styles.webNote}>
            {t.task.webNote}
          </AppText>
        )}
        <PillButton
          tone="dawn"
          label={t.common.next}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/morning'))}
        />
      </Animated.View>
    </View>
  );
}

/** Вечером и днём задание закрыто: показываем, что ждёт утром. */
function Evening() {
  const { t } = useT();
  const { taskType, moonPhase } = useApp();
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.doneCenter}>
        <Animated.View entering={ZoomIn.duration(700)} style={{ marginBottom: -30 }}>
          <Moon phase={moonPhase} size={120} />
        </Animated.View>
        <AppText variant="title" align="center">
          {t.task.eveningTitle}
        </AppText>
        <AppText variant="caption" align="center" style={{ marginTop: 6, marginBottom: space.lg }}>
          {t.task.notYet}
        </AppText>
        <Glass style={{ alignSelf: 'stretch' }} padded={false}>
          <View style={styles.eveningCard}>
            <TaskBadge type={taskType} />
            <View style={{ flex: 1 }}>
              <AppText variant="label">{t.task.tomorrow}</AppText>
              <AppText style={{ fontSize: 18, marginTop: 2 }}>{t.task.names[taskType]}</AppText>
            </View>
          </View>
        </Glass>
      </View>
      <View style={styles.footer}>
        <PillButton kind="ghost" label={t.task.changeTask} onPress={() => router.push('/settings')} />
      </View>
    </View>
  );
}

const CORNER = 26;
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  body: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md },
  centered: { flex: 1, justifyContent: 'center', paddingBottom: space.xxl },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
  webNote: { fontSize: 13, lineHeight: 18, marginBottom: space.md, paddingHorizontal: space.md },
  noticeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  // Фото
  frame: {
    flex: 1,
    maxHeight: 440,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'rgba(59,42,63,0.18)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#FFB86B',
    shadowOpacity: 0.45,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: 'rgba(255,248,217,0.95)' },
  tl: { top: 22, left: 22, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  tr: { top: 22, right: 22, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bl: { bottom: 22, left: 22, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
  br: { bottom: 22, right: 22, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
  frameNote: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,241,226,0.94)',
  },
  shutterWrap: { alignItems: 'center', paddingTop: space.lg },
  shutterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },

  // Примеры
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(59,42,63,0.14)' },
  dotNow: { width: 28, backgroundColor: GOLD },
  dotDone: { backgroundColor: GOLD_DEEP },
  mathCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  problem: { fontFamily: fonts.light, fontSize: 68, lineHeight: 80, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  answer: {
    marginTop: space.md,
    minWidth: 168,
    height: 76,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  answerFilled: { backgroundColor: 'rgba(255,255,255,0.62)', borderColor: GOLD },
  answerText: { fontFamily: fonts.semibold, fontSize: 38, lineHeight: 46, fontVariant: ['tabular-nums'] },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  key: {
    width: '31%',
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  keyOk: { backgroundColor: GOLD, borderColor: GOLD },
  keyText: { fontFamily: fonts.regular, fontSize: 28, lineHeight: 34 },

  // Шаги
  ringValue: { fontFamily: fonts.extraLight, fontSize: 84, lineHeight: 92, fontVariant: ['tabular-nums'] },

  // Итог
  doneCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  eveningCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
});
