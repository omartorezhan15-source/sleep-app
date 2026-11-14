// ВРЕМЕННЫЙ экран утреннего задания (этап 2). Логика рабочая, дизайн — по DESIGN_BRIEF.md, раздел 6,
// будет сделан в отдельной сессии. Поэтому здесь только существующие компоненты и минимум оформления.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton, PillButton } from '@/components/Buttons';
import { Glass } from '@/components/Glass';
import { BackIcon } from '@/components/Icons';
import { SkyBackground } from '@/components/SkyBackground';
import { fill, useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { MATH_COUNT, MIN_BRIGHTNESS, STEPS_GOAL, jpegBrightness, mathProblems } from '@/lib/morningTask';
import { nightKey } from '@/lib/time';
import { useDayPhase, useNow } from '@/lib/useNow';
import { onMorningTaskDone } from '@/native/nightPlan';
import { useApp } from '@/store/useApp';
import { dawn, fonts, radius, space } from '@/theme';

export default function Task() {
  const { t } = useT();
  const now = useNow();
  const phase = useDayPhase(now);
  const { taskType, nights, completeTask } = useApp();
  const done = !!nights[nightKey(now)]?.taskDoneAt;
  const [justDone, setJustDone] = useState(false);
  // Задание доступно только утром (за час до подъёма и позже), иначе его можно было бы «сделать» в 23:00.
  const available = phase === 'morning';

  const finish = () => {
    completeTask();
    // На iPhone: снять блокировку сразу и отменить сегодняшние звонки будильника.
    onMorningTaskDone().catch(() => {});
    haptic.success();
    setJustDone(true);
  };

  return (
    <SkyBackground mode="dawn">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <IconButton label={t.common.back} onPress={() => router.back()}>
            <BackIcon color={dawn.secondary} />
          </IconButton>
          <AppText variant="heading" color={dawn.text}>
            {t.task.title}
          </AppText>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.body}>
          {done || justDone ? (
            <View style={{ alignItems: 'center', gap: space.sm }}>
              <AppText variant="title" align="center" color={dawn.text}>
                ☀︎ {t.task.done}
              </AppText>
              <AppText variant="caption" align="center" color={dawn.textSecondary}>
                {t.task.doneSub}
              </AppText>
              <PillButton
                tone="dawn"
                label={t.common.next}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/morning'))}
                style={styles.wide}
              />
            </View>
          ) : !available ? (
            <AppText align="center" color={dawn.text}>
              {t.task.notYet}
            </AppText>
          ) : (
            <>
              <AppText variant="title" align="center" color={dawn.text}>
                {t.task.names[taskType]}
              </AppText>
              <AppText variant="caption" align="center" color={dawn.textSecondary} style={{ marginBottom: space.lg }}>
                {t.task.hints[taskType]}
              </AppText>
              {taskType === 'sky' && <SkyTask onDone={finish} />}
              {taskType === 'math' && <MathTask onDone={finish} />}
              {taskType === 'steps' && <StepsTask onDone={finish} />}
            </>
          )}
          {Platform.OS === 'web' && (
            <AppText
              variant="caption"
              align="center"
              color={dawn.textSecondary}
              style={{ marginTop: space.lg, fontSize: 13 }}
            >
              {t.task.webNote}
            </AppText>
          )}
        </View>
      </SafeAreaView>
    </SkyBackground>
  );
}

function SkyTask({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [tooDark, setTooDark] = useState(false);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={{ gap: space.sm }}>
        {!permission.canAskAgain && (
          <AppText align="center" color={dawn.text}>
            {t.task.cameraDenied}
          </AppText>
        )}
        {permission.canAskAgain && <PillButton tone="dawn" label={t.task.allowCamera} onPress={requestPermission} />}
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
    <View style={{ gap: space.md }}>
      <View style={styles.camera}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
      </View>
      {tooDark && (
        <AppText align="center" color={dawn.text}>
          {t.task.tooDark}
        </AppText>
      )}
      <PillButton tone="dawn" label={busy ? t.task.checking : t.task.takePhoto} onPress={shoot} disabled={busy} />
    </View>
  );
}

function MathTask({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const key = nightKey(useNow(60_000));
  // Примеры зависят от даты: каждый день новые, но не меняются при перерисовке.
  const problems = useMemo(() => mathProblems(Number(key.replace(/-/g, '')) % 100000), [key]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const check = () => {
    if (Number(value.trim()) === problems[i].answer) {
      haptic.success();
      setValue('');
      setWrong(false);
      if (i + 1 >= MATH_COUNT) onDone();
      else setI(i + 1);
    } else {
      haptic.light();
      setWrong(true);
    }
  };

  return (
    <Glass tone="dawn">
      <View style={{ alignItems: 'center', gap: space.md }}>
        <AppText variant="label" color={dawn.textSecondary}>
          {fill(t.task.progress, { n: i + 1, total: MATH_COUNT })}
        </AppText>
        <AppText style={styles.problem} color={dawn.text}>
          {problems[i].text} = ?
        </AppText>
        <TextInput
          value={value}
          onChangeText={(v) => setValue(v.replace(/[^0-9]/g, ''))}
          onSubmitEditing={check}
          keyboardType="number-pad"
          placeholder={t.task.answer}
          placeholderTextColor={dawn.textSecondary}
          style={styles.input}
          autoFocus
          maxLength={4}
        />
        {wrong && <AppText color={dawn.text}>{t.task.wrong}</AppText>}
        <PillButton tone="dawn" label={t.task.check} onPress={check} disabled={!value} style={styles.wide} />
      </View>
    </Glass>
  );
}

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

  if (state === 'unavailable')
    return (
      <AppText align="center" color={dawn.text}>
        {t.task.stepsUnavailable}
      </AppText>
    );
  if (state === 'denied')
    return (
      <AppText align="center" color={dawn.text}>
        {t.task.stepsDenied}
      </AppText>
    );
  return (
    <View style={{ alignItems: 'center' }}>
      <AppText style={styles.problem} color={dawn.text}>
        {Math.min(steps, STEPS_GOAL)} / {STEPS_GOAL}
      </AppText>
      <AppText variant="caption" color={dawn.textSecondary}>
        {f(t.task.stepsLeft, { n: Math.max(0, STEPS_GOAL - steps) })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: space.lg },
  camera: { height: 320, borderRadius: radius.card, overflow: 'hidden', backgroundColor: 'rgba(59,42,63,0.15)' },
  problem: { fontFamily: fonts.light, fontSize: 48, lineHeight: 56, fontVariant: ['tabular-nums'] },
  input: {
    width: 160,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 24,
    color: dawn.text,
  },
  wide: { alignSelf: 'stretch' },
});
