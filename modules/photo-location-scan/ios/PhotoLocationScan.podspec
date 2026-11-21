Pod::Spec.new do |s|
  s.name           = 'PhotoLocationScan'
  s.version        = '1.0.0'
  s.summary        = 'Finds photo library assets taken inside a coordinate box'
  s.description    = 'Finds photo library assets taken inside a coordinate box'
  s.author         = ''
  s.homepage       = 'https://thingo.kr'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.frameworks     = 'Photos', 'Vision'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = '**/*.swift'
end
