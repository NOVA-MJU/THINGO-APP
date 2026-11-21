// Xcode 27은 최소 iOS 버전이 15보다 낮게 적힌 Pod 타깃(GoogleSignIn, SDWebImage 등의 리소스·Privacy 번들)을
// 아카이브할 때 오류로 거부한다. 앱 자체 최소 버전(Podfile의 platform :ios)보다 낮은 Pod 타깃을 앱과 같은 버전으로 올린다.
// prebuild 때마다 Podfile의 post_install 첫 줄에 넣고, 이미 넣었으면 건너뛴다. 넣을 자리를 못 찾으면 prebuild를 멈춘다
const { withPodfile } = require('expo/config-plugins');

const MARKER = '# with-ios-pod-deployment-target';
const POST_INSTALL = 'post_install do |installer|';

module.exports = function withIosPodDeploymentTarget(config) {
  return withPodfile(config, (podfileConfig) => {
    const contents = podfileConfig.modResults.contents;
    if (contents.includes(MARKER)) return podfileConfig;
    // 앱 최소 버전은 Podfile의 platform 줄 값을 그대로 쓴다 (예: podfile_properties['ios.deploymentTarget'] || '15.1')
    const platform = contents.match(/^platform :ios, (.+)$/m);
    if (!platform || !contents.includes(POST_INSTALL)) {
      throw new Error(
        'with-ios-pod-deployment-target: Podfile에서 platform :ios 또는 post_install을 찾지 못했어요'
      );
    }
    podfileConfig.modResults.contents = contents.replace(
      POST_INSTALL,
      `${POST_INSTALL}
    ${MARKER}: 앱 최소 버전보다 낮은 Pod 타깃을 올린다 (Xcode 27이 iOS 15 미만을 거부)
    app_deployment_target = (${platform[1].trim()}).to_s
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_configuration|
        if build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < app_deployment_target.to_f
          build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = app_deployment_target
        end
      end
    end`
    );
    return podfileConfig;
  });
};
