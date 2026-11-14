Pod::Spec.new do |s|
  s.name           = 'LunaAlarm'
  s.version        = '0.1.0'
  s.summary        = 'Luna: настоящий будильник через AlarmKit (iOS 26+) с одним «отложить».'
  s.description    = s.summary
  s.author         = 'Luna'
  s.homepage       = 'https://github.com/omartorezhan15-source/sleep-app'
  s.license        = 'MIT'
  # Приложение поддерживает iOS 16.4+, AlarmKit подключается «слабо» и используется только на iOS 26+.
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.weak_frameworks = 'AlarmKit'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
