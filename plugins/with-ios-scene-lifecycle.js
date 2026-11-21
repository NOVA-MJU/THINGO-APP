// iOS 27 SDK(Xcode 27)로 빌드한 앱은 UIScene 생명주기를 쓰지 않으면 iOS 27에서 실행되자마자 꺼진다.
// Expo SDK 55 기본 AppDelegate는 예전 방식(앱 하나에 window 하나)이라, prebuild 때마다 아래를 넣어 scene 방식으로 바꾼다.
// - Info.plist에 scene 설정(UIApplicationSceneManifest, 창 하나)
// - AppDelegate는 React Native 시작을 미루고, SceneDelegate가 scene의 window에서 시작한다.
//   이때 scene으로 들어온 링크(앱이 꺼진 상태에서 링크로 열림)를 launchOptions에 넣어 Linking.getInitialURL이 그대로 받게 한다
// - 앱이 켜진 뒤 들어오는 링크·유니버설 링크는 scene이 받으므로 AppDelegate의 기존 처리로 넘긴다 (Expo 모듈, 구글 로그인 포함)
// Expo 템플릿이 바뀌어 넣을 자리를 못 찾으면 조용히 넘어가지 않고 prebuild를 멈춘다
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const START_REACT_NATIVE = `    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)`;

const DEFERRED_START = `    // React Native는 SceneDelegate가 scene의 window에서 시작한다 (plugins/with-ios-scene-lifecycle.js)
    launchOptionsForScene = launchOptions`;

const SCENE_DELEGATE = `
// scene 방식 실행 (plugins/with-ios-scene-lifecycle.js에서 넣는다)
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    let sceneWindow = UIWindow(windowScene: windowScene)
    window = sceneWindow
    appDelegate.window = sceneWindow

    // 링크로 앱을 열었으면 예전 방식처럼 launchOptions에 넣어 둔다 (React Native Linking.getInitialURL이 여기서 읽는다)
    var launchOptions = appDelegate.launchOptionsForScene ?? [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    }
    if let activity = connectionOptions.userActivities.first(where: {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }) {
      launchOptions[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity,
      ]
    }
    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "main",
      in: sceneWindow,
      launchOptions: launchOptions)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    URLContexts.forEach { context in
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(
      UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

function replaceOnce(contents, search, replacement, label) {
  if (!contents.includes(search)) {
    throw new Error(
      `with-ios-scene-lifecycle: AppDelegate에서 ${label}을(를) 찾지 못했어요. Expo 템플릿이 바뀌었는지 확인하세요`
    );
  }
  return contents.replace(search, replacement);
}

module.exports = function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return plistConfig;
  });

  return withAppDelegate(config, (appDelegateConfig) => {
    let contents = appDelegateConfig.modResults.contents;
    if (contents.includes('class SceneDelegate')) return appDelegateConfig;
    contents = replaceOnce(contents, START_REACT_NATIVE, DEFERRED_START, 'React Native 시작 코드');
    contents = replaceOnce(
      contents,
      '  var reactNativeFactory: RCTReactNativeFactory?\n',
      '  var reactNativeFactory: RCTReactNativeFactory?\n  // SceneDelegate가 React Native를 시작할 때 넘길 앱 실행 옵션\n  var launchOptionsForScene: [UIApplication.LaunchOptionsKey: Any]?\n',
      'reactNativeFactory 선언'
    );
    appDelegateConfig.modResults.contents = `${contents.trimEnd()}\n${SCENE_DELEGATE}`;
    return appDelegateConfig;
  });
};
