import ExpoModulesCore
import Photos

// 사진첩 전체에서 좌표 범위 안에서 찍힌 사진만 골라준다.
// expo-media-library는 사진마다 위치를 따로 물어봐야 해서 수만 장이면 너무 느리다.
// 여기서는 PHAsset 목록을 한 번 훑으면서 이미 들어 있는 위치 값만 비교한다 (원본 파일은 열지 않음)
public class PhotoLocationScanModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PhotoLocationScan")

    AsyncFunction("findPhotosInBounds") { (minLatitude: Double, maxLatitude: Double, minLongitude: Double, maxLongitude: Double) -> [[String: Any]] in
      let options = PHFetchOptions()
      options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
      let assets = PHAsset.fetchAssets(with: .image, options: options)

      var photos: [[String: Any]] = []
      assets.enumerateObjects { asset, _, _ in
        guard let coordinate = asset.location?.coordinate, let takenAt = asset.creationDate,
              coordinate.latitude >= minLatitude, coordinate.latitude <= maxLatitude,
              coordinate.longitude >= minLongitude, coordinate.longitude <= maxLongitude
        else { return }
        photos.append([
          "id": asset.localIdentifier,
          "takenAt": takenAt.timeIntervalSince1970 * 1000,
          "latitude": coordinate.latitude,
          "longitude": coordinate.longitude,
          "width": asset.pixelWidth,
          "height": asset.pixelHeight,
        ])
      }
      return photos
    }
  }
}
