// Luna: будильник через AlarmKit (iOS 26+).
//
// Правила (src/lib/blocking.ts): звонки в подъём и затем каждые 5 минут, пока не выполнено утреннее задание
// (максимум 60 минут). У первого звонка вторая кнопка — «Ещё 5 минут» (просто гасит звонок: следующий
// звонок цепочки и есть «отложенный»), у остальных — «Задание» (открывает Luna). Кнопка «Стоп» есть всегда
// (её требует Apple) и тоже открывает Luna. Системный «countdown»-snooze не используем: он позволял бы
// откладывать бесконечно.
//
// ⚠️ Этот файл не собирался: в среде разработки нет Xcode. Проверить на первой EAS-сборке.

import ExpoModulesCore
import AppIntents
import SwiftUI
#if canImport(AlarmKit)
import AlarmKit
#endif

private let idsKey = "luna.alarm.ids"
private let snoozedAtKey = "luna.alarm.snoozedAt"

struct LunaAlarmItem: Record {
  @Field var id: String = ""
  @Field var epochSeconds: Double = 0
  @Field var title: String = ""
  @Field var stopLabel: String = ""
  @Field var secondaryLabel: String = ""
  /// "snooze" — первый звонок; "task" — остальные.
  @Field var secondaryKind: String = "task"
}

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct LunaAlarmMetadata: AlarmMetadata {}

/// «Стоп» и «Задание»: гасят звонок и открывают Luna (там утреннее задание).
@available(iOS 26.0, *)
public struct LunaOpenAppIntent: LiveActivityIntent {
  public static var title: LocalizedStringResource = "Open Luna"
  public static var openAppWhenRun: Bool = true
  @Parameter(title: "alarmId") public var alarmId: String
  public init() {}
  public init(alarmId: String) { self.alarmId = alarmId }
  public func perform() async throws -> some IntentResult { .result() }
}

/// «Ещё 5 минут»: только запоминаем, что отложили (Luna покажет это утром). Следующий звонок уже запланирован.
@available(iOS 26.0, *)
public struct LunaSnoozeOnceIntent: LiveActivityIntent {
  public static var title: LocalizedStringResource = "Snooze once"
  public static var openAppWhenRun: Bool = false
  @Parameter(title: "alarmId") public var alarmId: String
  public init() {}
  public init(alarmId: String) { self.alarmId = alarmId }
  public func perform() async throws -> some IntentResult {
    UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: snoozedAtKey)
    return .result()
  }
}
#endif

public class LunaAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LunaAlarm")

    Function("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    Function("authorizationStatus") { () -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        return Self.statusString(AlarmManager.shared.authorizationState)
      }
      #endif
      return "unsupported"
    }

    AsyncFunction("requestAuthorization") { () async -> String in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        do {
          return Self.statusString(try await AlarmManager.shared.requestAuthorization())
        } catch {
          return "denied"
        }
      }
      #endif
      return "unsupported"
    }

    /// Заменяет все будильники Luna новой цепочкой. Возвращает число запланированных звонков.
    AsyncFunction("scheduleChain") { (items: [LunaAlarmItem], tintHex: String) async -> Int in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        Self.cancelStored()
        var scheduled: [String] = []
        for item in items {
          guard let uuid = UUID(uuidString: item.id) else { continue }
          let stop = AlarmButton(text: LocalizedStringResource(stringLiteral: item.stopLabel), textColor: .white, systemImageName: "sun.max.fill")
          let secondary = AlarmButton(
            text: LocalizedStringResource(stringLiteral: item.secondaryLabel),
            textColor: .white,
            systemImageName: item.secondaryKind == "snooze" ? "moon.zzz.fill" : "checkmark.circle.fill"
          )
          let alert = AlarmPresentation.Alert(
            title: LocalizedStringResource(stringLiteral: item.title),
            stopButton: stop,
            secondaryButton: secondary,
            secondaryButtonBehavior: .custom
          )
          let attributes = AlarmAttributes<LunaAlarmMetadata>(
            presentation: AlarmPresentation(alert: alert),
            metadata: LunaAlarmMetadata(),
            tintColor: Self.color(tintHex)
          )
          let secondaryIntent: any LiveActivityIntent = item.secondaryKind == "snooze"
            ? LunaSnoozeOnceIntent(alarmId: item.id)
            : LunaOpenAppIntent(alarmId: item.id)
          let config = AlarmManager.AlarmConfiguration<LunaAlarmMetadata>(
            countdownDuration: nil,
            schedule: .fixed(Date(timeIntervalSince1970: item.epochSeconds)),
            attributes: attributes,
            stopIntent: LunaOpenAppIntent(alarmId: item.id),
            secondaryIntent: secondaryIntent,
            sound: .default
          )
          do {
            _ = try await AlarmManager.shared.schedule(id: uuid, configuration: config)
            scheduled.append(item.id)
          } catch {
            print("[LunaAlarm] schedule failed: \(error)")
          }
        }
        UserDefaults.standard.set(scheduled, forKey: idsKey)
        return scheduled.count
      }
      #endif
      return 0
    }

    /// Отменить все будильники Luna (после утреннего задания или при смене расписания).
    Function("cancelAll") { () -> Void in
      #if canImport(AlarmKit)
      if #available(iOS 26.0, *) { Self.cancelStored() }
      #endif
    }

    /// Когда последний раз нажали «Ещё 5 минут» (секунды с 1970) — и сбросить отметку.
    Function("consumeSnoozedAt") { () -> Double in
      let value = UserDefaults.standard.double(forKey: snoozedAtKey)
      UserDefaults.standard.removeObject(forKey: snoozedAtKey)
      return value
    }
  }

  #if canImport(AlarmKit)
  @available(iOS 26.0, *)
  private static func statusString(_ state: AlarmManager.AuthorizationState) -> String {
    switch state {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "notDetermined"
    }
  }

  @available(iOS 26.0, *)
  private static func cancelStored() {
    let ids = UserDefaults.standard.stringArray(forKey: idsKey) ?? []
    for id in ids {
      if let uuid = UUID(uuidString: id) { try? AlarmManager.shared.cancel(id: uuid) }
    }
    UserDefaults.standard.removeObject(forKey: idsKey)
  }
  #endif

  private static func color(_ hex: String) -> Color {
    var rgb: UInt64 = 0
    Scanner(string: hex.replacingOccurrences(of: "#", with: "")).scanHexInt64(&rgb)
    return Color(
      red: Double((rgb >> 16) & 0xFF) / 255,
      green: Double((rgb >> 8) & 0xFF) / 255,
      blue: Double(rgb & 0xFF) / 255
    )
  }
}
