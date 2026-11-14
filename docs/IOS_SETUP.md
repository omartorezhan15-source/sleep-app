# Luna на iPhone: блокировка и будильник

Всё, что можно было сделать без аккаунта Apple Developer, уже в коде. Здесь — что сделать, когда аккаунт появится.

## Что уже готово в репозитории

| Что | Где |
|---|---|
| Правила блокировки и будильника (с отбоя до задания, автоснятие через 60 мин, «отложить» 1 раз) | `src/lib/blocking.ts` |
| Утреннее задание (фото у окна, 3 примера, 30 шагов) — работает и в вебе | `src/app/task.tsx`, `src/lib/morningTask.ts` |
| Блокировка всех приложений по расписанию (Screen Time API) | `src/native/blocking.ios.ts` + библиотека `react-native-device-activity` |
| Будильник AlarmKit (iOS 26+) со своим правилом «отложить один раз» | `modules/luna-alarm/` (Swift) + `src/native/alarm.ts` |
| Синхронизация с расписанием, отметки «отложили» и «блокировку выключили в Настройках» | `src/native/nightPlan.ts` |
| Конфигурация сборки: 3 iOS-расширения, App Group, разрешения | `app.config.ts`, `eas.json` |

⚠️ Нативный код **ещё ни разу не собирался**: в облачной среде разработки нет Xcode. Проверено только, что
`expo prebuild` создаёт iOS-проект с нужными расширениями. Первая EAS-сборка покажет ошибки компиляции, если они есть.

## Шаги

### 1. Купить Apple Developer Program — $99 в год
[developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/) → **Enroll** → как частное лицо (Individual).
Нужен Apple ID с двухфакторной защитой. Активация — обычно 1–2 дня.

После активации: [developer.apple.com/account](https://developer.apple.com/account) → **Membership details** → скопируйте **Team ID** (10 символов).

### 2. Выбрать идентификатор приложения
По умолчанию — `com.lunasleep.app`. Если он занят (или хотите свой), его задаёт переменная `LUNA_BUNDLE_ID`.
**После публикации его нельзя поменять.** Расширения получат идентификаторы:
`<id>.ActivityMonitorExtension`, `<id>.ShieldAction`, `<id>.ShieldConfiguration`, группа — `group.<id>`.

### 3. Подать заявку Apple на Family Controls (Distribution) — сразу
[developer.apple.com/contact/request/family-controls-distribution](https://developer.apple.com/contact/request/family-controls-distribution)

Без одобрения собрать приложение с блокировкой через облако (EAS) нельзя — даже для своего iPhone
([так пишет автор библиотеки](https://github.com/kingstinct/react-native-device-activity#family-controls-distribution-entitlement-requires-approval-from-apple)).
Без Mac это главный срок ожидания: по отзывам разработчиков — от нескольких дней до месяца и больше.
Укажите все 4 идентификатора из шага 2.

Текст заявки (можно вставить как есть, по-английски):

> Luna is a sleep-schedule app for teenagers and young adults that helps them go to bed and wake up at a consistent
> time. Bedtime procrastination — staying up on the phone after deciding to sleep — is the main problem it addresses.
> The user chooses their own bedtime and wake-up time. With FamilyControls individual authorization the app shields
> all apps on the user's own device from bedtime until the user completes a short morning task in the app (or
> automatically 60 minutes after wake-up). Phone calls and emergency calls stay available. The app does not read,
> collect or transmit any app-usage data; it only uses opaque tokens and DeviceActivity schedules on the device.
> It is not used for parental control of other people or for employee monitoring.

### 4. Будильник без заявок
AlarmKit не требует одобрения Apple: при первом запуске iPhone сам спросит разрешение. Нужен **iOS 26 или новее**.
На старых iOS приложение честно пишет «Нужна iOS 26 или новее», остаются обычные напоминания.

### 5. Первая сборка (без Mac, в облаке EAS)
Когда заявка одобрена:

```bash
npm install
npx eas-cli@latest login                     # бесплатный аккаунт expo.dev
npx eas-cli@latest init                      # привязать проект
npx eas-cli@latest env:create --name APPLE_TEAM_ID --value <TEAM_ID> --environment development --environment preview --environment production
npx eas-cli@latest device:create             # зарегистрировать свой iPhone (ссылка откроется на телефоне)
npx eas-cli@latest build --profile development --platform ios
```

EAS сам создаст профили подписи для приложения и трёх расширений. На iPhone: **Настройки → Конфиденциальность и безопасность →
Режим разработчика → Вкл.**, затем установить сборку по ссылке из EAS и запустить `npx expo start` на компьютере.

Если удобнее — я могу запускать сборки сам: для этого среде Claude Code нужен доступ к `expo.dev` и токен Expo.

### 6. Проверка на телефоне (чек-лист)
- [ ] Настройки → «Блокировка и будильник» → «Включить» блокировку → системное окно «Экранное время» → Разрешить.
- [ ] «Включить» будильник → системное окно AlarmKit → Разрешить.
- [ ] Поставить отбой через 20 минут: в это время любое приложение показывает щит «Луна уже взошла», кнопки «отложить» нет.
- [ ] Звонки и экстренный вызов работают. Luna открывается.
- [ ] В подъём звонит будильник даже в беззвучном режиме; «Ещё 5 минут» — только на первом звонке.
- [ ] Утреннее задание снимает блокировку сразу и останавливает звонки.
- [ ] Без задания блокировка снимается сама через 60 минут после подъёма.
- [ ] Отключить Luna в «Настройки → Экранное время» → утром в Luna и в статистике видна честная отметка.

## Ограничения, которые нельзя обойти
- Владелец iPhone всегда может отозвать доступ «Экранного времени» в Настройках (по Face ID или коду) — блокировка
  исчезнет. Luna это заметит и отметит, но запретить не может.
- Экран-щит рисует система: можно задать только иконку, тексты, цвета и до двух кнопок.
- Кнопку «Стоп» у будильника убрать нельзя; поэтому после неё звонки повторяются каждые 5 минут до задания.
